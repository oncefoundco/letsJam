"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Camera + mic preview. Acquisition is fully opt-in: no getUserMedia call
// happens until the user explicitly enables a device, and every track we
// acquire is owned by this component so we can stop it on unmount.

export function VideoPreview() {
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  const stopVideo = useCallback(() => {
    const s = videoStreamRef.current;
    if (s) {
      for (const t of s.getTracks()) {
        t.stop();
        s.removeTrack(t);
      }
      videoStreamRef.current = null;
    }
    if (videoElRef.current) {
      videoElRef.current.srcObject = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    const s = audioStreamRef.current;
    if (s) {
      for (const t of s.getTracks()) {
        t.stop();
        s.removeTrack(t);
      }
      audioStreamRef.current = null;
    }
  }, []);

  const toggleCamera = useCallback(async () => {
    if (cameraOn) {
      stopVideo();
      setCameraOn(false);
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoStreamRef.current = stream;
      if (videoElRef.current) {
        videoElRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch (err) {
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera access blocked — allow it in browser settings to preview."
          : "Couldn't access camera."
      );
    }
  }, [cameraOn, stopVideo]);

  const toggleMic = useCallback(async () => {
    if (micOn) {
      stopAudio();
      setMicOn(false);
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setMicOn(true);
    } catch (err) {
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Microphone access blocked — allow it in browser settings."
          : "Couldn't access microphone."
      );
    }
  }, [micOn, stopAudio]);

  // Hard release of every track we own when the component leaves the tree.
  useEffect(() => {
    return () => {
      stopVideo();
      stopAudio();
    };
  }, [stopVideo, stopAudio]);

  return (
    <div className="relative w-full max-w-[366px]">
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-row gap-3 sm:bottom-auto sm:left-[-4rem] sm:top-1/2 sm:translate-x-0 sm:-translate-y-1/2 sm:flex-col">
        <IconButton
          ariaLabel={micOn ? "Turn off microphone" : "Turn on microphone"}
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
        <video
          ref={videoElRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 h-full w-full -scale-x-100 object-cover ${
            cameraOn ? "" : "hidden"
          }`}
        />
        {!cameraOn ? (
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-3 text-white/70">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white/10">
                <VideoIcon muted />
              </div>
              <p
                className="text-[13px]"
                style={{ fontFamily: "var(--font-public-sans)" }}
              >
                Tap the camera icon to preview
              </p>
            </div>
          </div>
        ) : null}
        {error ? (
          <div
            className="absolute inset-x-0 bottom-0 bg-black/60 px-4 py-2 text-center text-[12px] text-white"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            {error}
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
