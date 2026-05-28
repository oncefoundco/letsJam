"use client";

import {
  WherebyProvider,
  useLocalMedia,
  VideoView,
} from "@whereby.com/browser-sdk/react";
import { useEffect, useRef, useState } from "react";

export function VideoPreview() {
  return (
    <WherebyProvider>
      <PreviewInner />
    </WherebyProvider>
  );
}

function PreviewInner() {
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const { state, actions } = useLocalMedia({ audio: true, video: true });

  const stream = state.localStream;
  const denied = state.startError != null;

  // Keep refs to the latest stream + actions so the unmount cleanup
  // (which runs with empty deps) always sees current values.
  const streamRef = useRef<MediaStream | undefined>(stream);
  streamRef.current = stream;
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  // Hard release of camera + mic when this component leaves the tree.
  // The SDK's useLocalMedia only auto-releases when its internal status is
  // "started"; navigating mid-acquisition or with the SDK's preview held
  // open can leave the macOS green dot on. We stop AND removeTrack every
  // track from the latest stream, and tell the SDK to disable the devices,
  // belt-and-braces.
  useEffect(() => {
    return () => {
      const s = streamRef.current;
      if (s) {
        for (const t of s.getTracks()) {
          t.stop();
          s.removeTrack(t);
        }
      }
      try {
        actionsRef.current.toggleCameraEnabled(false);
      } catch {
        // SDK may already be torn down
      }
      try {
        actionsRef.current.toggleMicrophoneEnabled(false);
      } catch {
        // ditto
      }
    };
  }, []);

  function toggleCamera() {
    const next = !cameraOn;
    setCameraOn(next);
    actions.toggleCameraEnabled(next);
    if (!next && stream) {
      // Force-release the camera hardware so the macOS green dot turns off.
      // SDK does this internally but only when status === "started"; guarantee it here.
      stream.getVideoTracks().forEach((t) => {
        t.stop();
        stream.removeTrack(t);
      });
    }
  }

  function toggleMic() {
    const next = !micOn;
    setMicOn(next);
    actions.toggleMicrophoneEnabled(next);
    if (!next && stream) {
      stream.getAudioTracks().forEach((t) => {
        t.stop();
        stream.removeTrack(t);
      });
    }
  }

  return (
    <div className="relative w-full max-w-[366px]">
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-row gap-3 sm:bottom-auto sm:left-[-4rem] sm:top-1/2 sm:translate-x-0 sm:-translate-y-1/2 sm:flex-col">
        <IconButton
          ariaLabel={micOn ? "Mute microphone" : "Unmute microphone"}
          pressed={micOn}
          onClick={toggleMic}
        >
          <MicIcon muted={!micOn} />
        </IconButton>
        <IconButton
          ariaLabel={cameraOn ? "Turn off camera" : "Turn on camera"}
          pressed={cameraOn}
          onClick={toggleCamera}
        >
          <VideoIcon muted={!cameraOn} />
        </IconButton>
      </div>
      <div className="relative aspect-[547/443] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-700 to-neutral-900">
        {stream && cameraOn ? (
          <VideoView
            stream={stream}
            muted
            mirror
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white/10 text-white/70">
              <VideoIcon muted={!cameraOn} />
            </div>
          </div>
        )}
        {denied ? (
          <div
            className="absolute inset-x-0 bottom-0 bg-black/60 px-4 py-2 text-center text-[12px] text-white"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            Camera/mic access blocked — allow in browser settings to preview.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IconButton({
  children,
  ariaLabel,
  onClick,
  pressed,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={pressed}
      onClick={onClick}
      className={`grid h-[56px] w-[56px] place-items-center rounded-full shadow-sm transition-colors ${
        pressed
          ? "bg-white text-black hover:bg-neutral-100"
          : "bg-[#e85d3c] text-white hover:bg-[#d44d2e]"
      }`}
    >
      {children}
    </button>
  );
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
