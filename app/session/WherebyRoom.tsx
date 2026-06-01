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
  // SDK's toggleCamera/toggleMicrophone only flip enabled state on
  // already-acquired tracks; they do NOT call getUserMedia. Joining with
  // { audio: false, video: false } left the toggles dead. Acquire on mount
  // (the user reaches /session deliberately via the waiting room) and rely
  // on releaseLocalMedia() below to clear the macOS green dot on leave.
  const { state, actions } = useRoomConnection(roomUrl, {
    localMediaOptions: { audio: true, video: true },
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
    joinRoom();
    return () => {
      leaveRoom();
      releaseLocalMedia();
    };
    // SDK requires once-on-mount; actions are recreated each render.
    // Note: in dev (Strict Mode) you may see a "Did not find client for update"
    // warning from the SDK due to the double mount/unmount cycle. Harmless.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carry over the user's camera/mic state from the waiting room. The
  // waiting-room preview starts both devices off and only writes to
  // sessionStorage when the user toggles, so "no entry" means the user
  // never opted in — match the waiting-room default and start the session
  // muted. The toggles in-call still work because we already acquired
  // media on join. The SDK's toggle reducers are no-ops until
  // connectionStatus reaches "connected", so we wait for that.
  const prefsAppliedRef = useRef(false);
  useEffect(() => {
    if (prefsAppliedRef.current) return;
    if (state.connectionStatus !== "connected") return;
    prefsAppliedRef.current = true;
    if (sessionStorage.getItem("jam:camera") !== "on") {
      toggleCamera(false);
    }
    if (sessionStorage.getItem("jam:mic") !== "on") {
      toggleMicrophone(false);
    }
  }, [state.connectionStatus, toggleCamera, toggleMicrophone]);

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
  const hasVideo =
    participant.isPresentation ||
    (!!participant.isVideoEnabled && !!participant.stream);
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
