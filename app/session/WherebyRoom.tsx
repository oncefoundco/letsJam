"use client";

import {
  WherebyProvider,
  useRoomConnection,
  VideoGrid,
} from "@whereby.com/browser-sdk/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function WherebyRoom({
  roomUrl,
  leaveHref,
}: {
  roomUrl: string;
  leaveHref: string;
}) {
  return (
    <WherebyProvider>
      <RoomInner roomUrl={roomUrl} leaveHref={leaveHref} />
    </WherebyProvider>
  );
}

function RoomInner({
  roomUrl,
  leaveHref,
}: {
  roomUrl: string;
  leaveHref: string;
}) {
  const router = useRouter();
  const { state, actions } = useRoomConnection(roomUrl, {
    localMediaOptions: { audio: true, video: true },
  });
  const { joinRoom, leaveRoom, toggleCamera, toggleMicrophone } = actions;

  // Latest state in a ref so the unmount cleanup can release the
  // local stream even if state changed between mount and unmount.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Hard-stop any local tracks the SDK is still holding. leaveRoom()
  // disconnects the room but does NOT reliably release getUserMedia
  // tracks acquired via localMediaOptions — the macOS green dot stays
  // on otherwise.
  function releaseLocalMedia() {
    const s = stateRef.current.localParticipant?.stream;
    if (s) {
      for (const t of s.getTracks()) {
        t.stop();
        s.removeTrack(t);
      }
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

  function handleEnd() {
    leaveRoom();
    releaseLocalMedia();
    router.push(leaveHref);
  }

  const cameraOn = state.isCameraEnabled;
  const micOn = state.isMicrophoneEnabled;

  return (
    <RoomShell>
      <VideoGrid />
      {state.connectionStatus !== "connected" ? (
        <Placeholder label={statusLabel(state.connectionStatus)} />
      ) : null}
      <ControlBar
        cameraOn={cameraOn}
        micOn={micOn}
        onToggleCamera={() => toggleCamera(!cameraOn)}
        onToggleMic={() => toggleMicrophone(!micOn)}
        onEnd={handleEnd}
      />
    </RoomShell>
  );
}

function ControlBar({
  cameraOn,
  micOn,
  onToggleCamera,
  onToggleMic,
  onEnd,
}: {
  cameraOn: boolean;
  micOn: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onEnd: () => void;
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
        aria-label="End session"
        onClick={onEnd}
        className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[#e85d3c] text-white shadow-md transition-colors hover:bg-[#d44d2e]"
      >
        <EndIcon />
      </button>
    </div>
  );
}

function ControlButton({
  children,
  ariaLabel,
  onClick,
  pressed,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
  pressed: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={pressed}
      onClick={onClick}
      className={`grid h-[52px] w-[52px] place-items-center rounded-full shadow-md transition-colors ${
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
    <div className="relative aspect-[1003/639] w-full overflow-hidden rounded-xl bg-neutral-900">
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

function EndIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12c5.5-5 12.5-5 18 0v3l-4-1v-3a8 8 0 00-10 0v3l-4 1v-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        transform="rotate(135 12 12)"
      />
    </svg>
  );
}
