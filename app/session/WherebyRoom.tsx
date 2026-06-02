"use client";

import {
  WherebyProvider,
  useRoomConnection,
  VideoGrid,
  GridVideoView,
} from "@whereby.com/browser-sdk/react";
import type { ClientView } from "@whereby.com/core";
import { useEffect, useMemo, useRef } from "react";
import { getInitials, colorForName } from "@/lib/avatar";

// --- Bulletproof device release -------------------------------------------
// The Whereby SDK acquires camera/mic tracks via getUserMedia internally and,
// in certain toggle/reconnect windows, leaves a LIVE video track detached from
// localParticipant.stream. Nothing in the SDK (or any code reading
// localParticipant.stream) then holds a reference to it, so it never gets
// stopped and the macOS camera light stays on indefinitely.
//
// The only reliable defence is to keep a reference to every track the camera
// ever produces and stop them ourselves. We patch getUserMedia ONCE and record
// every track it hands out. While a room is tearing down we hard-stop tracks
// the moment they're acquired, so a late re-acquire during cleanup can't keep
// the device alive either. Tracks remove themselves from the registry when they
// end, so this never grows unbounded.
const acquiredTracks = new Set<MediaStreamTrack>();
let suppressMediaAcquisition = false;

function installMediaTracking() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices) return;
  const md = navigator.mediaDevices as MediaDevices & {
    __jamTrackingInstalled?: boolean;
  };
  if (md.__jamTrackingInstalled) return;
  md.__jamTrackingInstalled = true;
  const orig = md.getUserMedia.bind(md);
  md.getUserMedia = async (constraints?: MediaStreamConstraints) => {
    if (suppressMediaAcquisition) {
      // The room is tearing down (leave / unmount, where we set this flag before
      // leaveRoom). Don't open ANY device: return an empty stream WITHOUT calling
      // the real getUserMedia, so the camera/mic never power on during teardown.
      // This is safe here precisely because the SDK is being destroyed — there's
      // no later re-enable to corrupt (the reason we can't do this on join).
      return new MediaStream();
    }
    const stream = await orig(constraints);
    for (const track of stream.getTracks()) {
      acquiredTracks.add(track);
      track.addEventListener("ended", () => acquiredTracks.delete(track), {
        once: true,
      });
    }
    return stream;
  };
}

// Stop every tracked track (optionally only one kind) and forget them.
function stopTrackedTracks(kind?: "video" | "audio") {
  for (const track of [...acquiredTracks]) {
    if (kind && track.kind !== kind) continue;
    track.stop();
    acquiredTracks.delete(track);
  }
}

// Install at module load so the patch is in place before the SDK acquires any
// media (this module is client-only via WherebyRoomClient; the guard inside
// no-ops under SSR).
installMediaTracking();
// ---------------------------------------------------------------------------

export function WherebyRoom({
  roomUrl,
  sessionId,
}: {
  roomUrl: string;
  sessionId: string;
}) {
  return (
    <WherebyProvider>
      <RoomInner roomUrl={roomUrl} sessionId={sessionId} />
    </WherebyProvider>
  );
}

function RoomInner({
  roomUrl,
  sessionId,
}: {
  roomUrl: string;
  sessionId: string;
}) {
  // The waiting room stores this participant's record (name + color) in
  // localStorage under participant.<sessionId>. Read the name so the SDK
  // shows real initials instead of the "Guest" → "G" fallback. Absent
  // (e.g. an unjoined host) falls back to the SDK default — no worse than
  // before. This component is client-only (ssr:false), so localStorage is safe.
  const displayName = useMemo(() => {
    try {
      const stored = localStorage.getItem(`participant.${sessionId}`);
      if (!stored) return undefined;
      const parsed = JSON.parse(stored) as { name?: unknown };
      return typeof parsed.name === "string" && parsed.name.trim()
        ? parsed.name.trim()
        : undefined;
    } catch {
      return undefined;
    }
  }, [sessionId]);
  // Only open the camera on join if the user actually wanted it on in the
  // waiting room. Otherwise the SDK's localMediaOptions would acquire the
  // camera regardless, flashing the macOS green light for a moment before our
  // camera-off sweep stops it — alarming and unnecessary for someone who joined
  // with video off. Camera-off users join video-less; toggling on in-call works
  // because the SDK's doToggleCamera re-acquires the device on enable.
  //
  // We still request audio unconditionally: it anchors a live local stream so
  // both toggles function (the SDK can't re-acquire a stream once all tracks
  // are gone — getUserMedia({audio:false,video:false}) throws), and the mic's
  // toggle only flips `enabled` rather than re-acquiring, so the device must
  // exist up front. Mic-off users get the track immediately disabled by the
  // prefs effect below.
  const cameraWanted = useMemo(() => {
    try {
      return sessionStorage.getItem("jam:camera") === "on";
    } catch {
      return false;
    }
  }, []);
  const { state, actions } = useRoomConnection(roomUrl, {
    localMediaOptions: { audio: true, video: cameraWanted },
    displayName,
  });
  const {
    joinRoom,
    leaveRoom,
    toggleCamera,
    toggleMicrophone,
    startScreenshare,
    stopScreenshare,
  } = actions;

  // Remember the local MediaStream the moment the SDK hands it to us. We can't
  // just read it at unmount: the SDK nulls localParticipant.stream when the room
  // disconnects or the phase changes (navigating to /self-reflection), so by the
  // time cleanup runs there's nothing to stop and the camera/mic device stays
  // live — the macOS green dot never turns off. Holding the reference lets us
  // hard-stop the exact tracks regardless of the SDK's later state.
  const mediaStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    const s = state.localParticipant?.stream;
    if (s) mediaStreamRef.current = s;
  }, [state.localParticipant?.stream]);

  // While the camera is off, NO video device may be live. We reconcile
  // continuously (not a one-shot sweep): the SDK can acquire a video track on
  // join even with video disabled, and late getUserMedia calls resolve after a
  // single sweep would have run. So while the camera reads off, repeatedly stop
  // every live video track we captured.
  //
  // CRITICAL: we must also remove the stopped track from the local MediaStream,
  // mirroring the SDK's own toggle-off (which does stream.removeTrack). If we
  // only stop() it, the dead track stays in the stream, and the SDK's
  // doToggleCamera on the next ENABLE sees a track present and merely sets
  // track.enabled=true on it — re-enabling a DEAD track renders black/no video
  // instead of re-acquiring the camera. Removing it forces a clean re-acquire.
  //
  // Turning the camera back ON flips isCameraEnabled true first (the reducer runs
  // before the SDK re-acquires), which exits this effect, so we never touch a
  // track the user just turned on.
  useEffect(() => {
    if (state.isCameraEnabled) return;
    const releaseOffVideo = () => {
      const streams = [
        mediaStreamRef.current,
        state.localParticipant?.stream,
      ].filter((s): s is MediaStream => !!s);
      // Stop every camera track we captured.
      for (const track of [...acquiredTracks]) {
        if (track.kind !== "video") continue;
        track.stop();
        acquiredTracks.delete(track);
      }
      // Remove ALL video tracks (live OR already-ended) from the local stream.
      // The SDK can attach a track to localParticipant.stream AFTER we've stopped
      // and forgotten it, so we can't rely on the registry alone. A dead track
      // left in the stream (a) makes the grid render a black video tile and
      // (b) makes doToggleCamera re-enable a dead track on the next ON instead of
      // re-acquiring. Clearing them forces a clean re-acquire and lets the avatar
      // show.
      for (const s of streams) {
        for (const t of s.getVideoTracks()) {
          t.stop();
          s.removeTrack(t);
        }
      }
    };
    releaseOffVideo();
    const id = setInterval(releaseOffVideo, 1000);
    return () => clearInterval(id);
  }, [state.isCameraEnabled, state.localParticipant?.stream]);

  // Recover a detached camera. On a room RE-JOIN (notably entering diamond 2,
  // where /session remounts and rejoins) the SDK can report the camera enabled
  // while the live video track never lands on localParticipant.stream — the
  // macOS camera light is on, but the tile shows the avatar with no footage and
  // never self-heals. When "camera enabled but no live track" persists past a
  // short settle window, force a clean re-acquire: toggle the camera OFF (the
  // camera-off reconciler above drops the dead track) then back ON (so the SDK
  // re-acquires fresh rather than re-enabling a dead track). Bounded to a few
  // attempts so a camera that genuinely can't open doesn't flap forever.
  //
  // toggleCamera is recreated every render, so we hold it in a ref and keep this
  // effect's deps to the actual signals (enabled + stream identity). Depending on
  // toggleCamera directly would reset the detection timer on every render and it
  // would never fire.
  const toggleCameraRef = useRef(toggleCamera);
  useEffect(() => {
    toggleCameraRef.current = toggleCamera;
  });
  const reacquireRef = useRef<{
    attempts: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ attempts: 0, timer: null });
  useEffect(() => {
    const r = reacquireRef.current;
    const clear = () => {
      if (r.timer) {
        clearTimeout(r.timer);
        r.timer = null;
      }
    };
    if (state.connectionStatus !== "connected" || !state.isCameraEnabled) {
      clear();
      return;
    }
    const hasLiveVideo = !!state.localParticipant?.stream
      ?.getVideoTracks()
      .some((t) => t.readyState === "live");
    if (hasLiveVideo) {
      r.attempts = 0; // healthy — restore the recovery budget
      clear();
      return;
    }
    if (r.timer || r.attempts >= 3) return; // already scheduled, or gave up
    r.timer = setTimeout(() => {
      r.timer = null;
      r.attempts += 1;
      toggleCameraRef.current(false);
      setTimeout(() => toggleCameraRef.current(true), 400);
    }, 1500);
    return clear;
  }, [
    state.connectionStatus,
    state.isCameraEnabled,
    state.localParticipant?.stream,
  ]);

  // leaveRoom() disconnects the room but does NOT reliably release the
  // getUserMedia tracks acquired via localMediaOptions, so we stop them here.
  function releaseLocalMedia() {
    const s = mediaStreamRef.current;
    if (s) {
      for (const t of s.getTracks()) t.stop();
      mediaStreamRef.current = null;
    }
  }

  useEffect(() => {
    // Re-arm tracking in case a previous room's teardown left it suppressed.
    suppressMediaAcquisition = false;
    joinRoom();
    return () => {
      // Block any media the SDK re-grabs while tearing down, then release
      // everything: leaveRoom() for the SDK's own cleanup, releaseLocalMedia()
      // for the stream we captured, and stopTrackedTracks() as the backstop
      // that kills orphaned tracks the SDK lost track of.
      suppressMediaAcquisition = true;
      leaveRoom();
      releaseLocalMedia();
      stopTrackedTracks();
    };
    // SDK requires once-on-mount; actions are recreated each render.
    // Note: in dev (Strict Mode) you may see a "Did not find client for update"
    // warning from the SDK due to the double mount/unmount cycle. Harmless.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carry over the user's camera/mic preferences from the waiting room.
  //
  // We mute/disable by toggling OFF, but ONLY once the device actually reads as
  // enabled. The SDK's toggle listener computes `enabled || !isCurrentlyEnabled`
  // (index.cjs:3499), so toggle(false) while already off evaluates to `true` and
  // turns it back ON. Waiting for the enabled state avoids that quirk.
  //
  // The camera is the important one here: even with localMediaOptions.video
  // false, the SDK spuriously enables the camera on join (isCameraEnabled flips
  // true → it acquires the device → green dot). We can't stop the track behind
  // the SDK's back without leaving it stuck "camera on, no video" (camEnabled
  // true with no track, which the reconciler can't fix). So we turn it off via
  // the SDK itself: once it reads enabled, toggleCamera(false) stops+removes the
  // track AND sets camEnabled false — consistent state, and re-enable still works.
  const micPrefAppliedRef = useRef(false);
  useEffect(() => {
    if (micPrefAppliedRef.current) return;
    if (state.connectionStatus !== "connected") return;
    if (!state.isMicrophoneEnabled) return; // not ready — retry on next change
    micPrefAppliedRef.current = true;
    if (sessionStorage.getItem("jam:mic") !== "on") {
      toggleMicrophone(false);
    }
  }, [state.connectionStatus, state.isMicrophoneEnabled, toggleMicrophone]);

  const camPrefAppliedRef = useRef(false);
  useEffect(() => {
    if (camPrefAppliedRef.current) return;
    if (state.connectionStatus !== "connected") return;
    if (sessionStorage.getItem("jam:camera") === "on") {
      // User wanted the camera on — leave it as the SDK brought it up.
      camPrefAppliedRef.current = true;
      return;
    }
    if (!state.isCameraEnabled) return; // not (yet) enabled — wait for the spurious enable
    camPrefAppliedRef.current = true;
    toggleCamera(false);
  }, [state.connectionStatus, state.isCameraEnabled, toggleCamera]);

  const cameraOn = state.isCameraEnabled;
  const micOn = state.isMicrophoneEnabled;
  // state.localScreenshareStatus is bugged in this SDK build — it reads
  // from localParticipant.isScreenSharing, which is never flipped to
  // true. Source of truth is state.screenshares; the entry with
  // isLocal === true represents our active share.
  const sharingScreen = state.screenshares.some((s) => s.isLocal);
  // No reliable "starting" signal without the broken status field; keep
  // the disabled affordance simple — block re-clicks only via React
  // re-render after the screenshares array updates.
  const screenshareBusy = false;

  return (
    <RoomShell>
      {/* enableSubgrid={false}: the SDK routes camera-off participants into a
          subgrid that ignores renderParticipant (falling back to its default
          beige avatar). Disabling it sends every tile through the main grid so
          our colored initials avatars apply to everyone. */}
      {/* absolute inset-0 gives the SDK grid a definite-size box to fill;
          its internal height:100% won't resolve against a flex-sized parent. */}
      <div className="absolute inset-0">
        <VideoGrid renderParticipant={renderParticipant} enableSubgrid={false} />
      </div>
      {state.connectionStatus !== "connected" ? (
        <Placeholder label={statusLabel(state.connectionStatus)} />
      ) : null}
      {sharingScreen ? <SharingBanner onStop={stopScreenshare} /> : null}
      <ControlBar
        cameraOn={cameraOn}
        micOn={micOn}
        sharingScreen={sharingScreen}
        screenshareBusy={screenshareBusy}
        onToggleCamera={() => toggleCamera(!cameraOn)}
        onToggleMic={() => toggleMicrophone(!micOn)}
        onToggleScreenshare={() => {
          if (sharingScreen) stopScreenshare();
          else if (!screenshareBusy) startScreenshare();
        }}
      />
    </RoomShell>
  );
}

// VideoGrid wraps each tile in a GridCell; renderParticipant returns only the
// cell contents. GridVideoView reads the participant's stream from cell context.
// Screenshares (isPresentation) and cameras-on render video; camera-off tiles
// render our own initials avatar, colored deterministically from the name so
// participants are distinguishable — two people sharing an initial still differ.
function renderParticipant({ participant }: { participant: ClientView }) {
  // Render the video view only when there's an actually LIVE video track. The
  // SDK can keep isVideoEnabled=true with a dead/removed track — e.g. the camera
  // it briefly opens on join (which we release), or a track we stopped while the
  // camera is off. Trusting isVideoEnabled alone renders a black tile; gating on
  // a live track falls back to the avatar instead.
  const hasLiveVideo = !!participant.stream
    ?.getVideoTracks()
    .some((t) => t.readyState === "live");
  const hasVideo = participant.isPresentation || (!!participant.isVideoEnabled && hasLiveVideo);
  if (hasVideo) return <GridVideoView />;
  return <InitialsAvatar name={participant.displayName} />;
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = getInitials(name);
  return (
    <div className="grid h-full w-full place-items-center rounded-lg bg-neutral-900">
      <svg
        viewBox="0 0 100 100"
        className="h-1/2 w-auto max-w-full"
        style={{ aspectRatio: "1" }}
        role="img"
        aria-label={name || "Participant"}
      >
        <circle cx="50" cy="50" r="50" fill={colorForName(name)} />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="38"
          fontWeight="500"
          fill="#000"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {initials}
        </text>
      </svg>
    </div>
  );
}

function SharingBanner({ onStop }: { onStop: () => void }) {
  return (
    <div className="absolute inset-x-0 top-4 z-20 flex justify-center px-4">
      <div
        className="flex items-center gap-3 rounded-full bg-[#1a1a1a]/90 px-4 py-2 text-white shadow-md backdrop-blur"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        <span className="grid h-2 w-2 place-items-center rounded-full bg-[#e85d3c]" aria-hidden>
          <span className="h-2 w-2 animate-ping rounded-full bg-[#e85d3c]/70" />
        </span>
        <span className="text-[13px] leading-none">You&apos;re sharing your screen</span>
        <button
          type="button"
          onClick={onStop}
          className="rounded-full bg-[#e85d3c] px-3 py-1.5 text-[12px] font-medium leading-none text-white transition-colors hover:bg-[#d44d2e]"
        >
          Stop sharing
        </button>
      </div>
    </div>
  );
}

function ControlBar({
  cameraOn,
  micOn,
  sharingScreen,
  screenshareBusy,
  onToggleCamera,
  onToggleMic,
  onToggleScreenshare,
}: {
  cameraOn: boolean;
  micOn: boolean;
  sharingScreen: boolean;
  screenshareBusy: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleScreenshare: () => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-3">
      <ControlButton
        ariaLabel={micOn ? "Mute microphone" : "Unmute microphone"}
        pressed={micOn}
        onClick={onToggleMic}
      >
        <MicIcon muted={!micOn} />
      </ControlButton>
      <ControlButton
        ariaLabel={cameraOn ? "Turn off camera" : "Turn on camera"}
        pressed={cameraOn}
        onClick={onToggleCamera}
      >
        <VideoIcon muted={!cameraOn} />
      </ControlButton>
      <button
        type="button"
        aria-label={sharingScreen ? "Stop sharing screen" : "Share screen"}
        aria-pressed={sharingScreen}
        onClick={onToggleScreenshare}
        disabled={screenshareBusy}
        className={`grid h-[52px] w-[52px] place-items-center rounded-full shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          sharingScreen
            ? "bg-[#e85d3c] text-white ring-2 ring-white hover:bg-[#d44d2e]"
            : "bg-white text-black hover:bg-neutral-100"
        }`}
      >
        <ScreenshareIcon active={sharingScreen} />
      </button>
    </div>
  );
}

function ControlButton({
  children,
  ariaLabel,
  onClick,
  pressed,
  disabled,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
  pressed: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-[52px] w-[52px] place-items-center rounded-full shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        pressed
          ? "bg-white text-black hover:bg-neutral-100"
          : "bg-[#e85d3c] text-white hover:bg-[#d44d2e]"
      }`}
    >
      {children}
    </button>
  );
}

function RoomShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-xl bg-neutral-900">
      {children}
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center text-white/70">
      {label}
    </div>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "connecting":
      return "Connecting…";
    case "reconnecting":
      return "Reconnecting…";
    case "disconnected":
    case "left":
      return "Disconnected";
    case "kicked":
      return "Removed from room";
    default:
      return status;
  }
}

function MicIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="3"
        width="6"
        height="12"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M5 11a7 7 0 0014 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {muted ? (
        <path
          d="M3 3l18 18"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

function VideoIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="2"
        y="6"
        width="14"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M16 10l5-3v10l-5-3v-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {muted ? (
        <path
          d="M3 3l18 18"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

function ScreenshareIcon({ active }: { active?: boolean }) {
  if (active) {
    // While sharing, show a filled stop-square — universally legible as
    // "tap to stop" and visually different from the idle share icon.
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="3"
          y="4"
          width="18"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M8 21h8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <rect x="9" y="8" width="6" height="5" rx="1" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="4"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 21h8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 13V7m0 0l-3 3m3-3l3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
