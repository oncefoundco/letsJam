"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// 3-second countdown after the host clicks Start Session.
const COUNTDOWN_MS = 3000;
const POLL_MS = 1000;

export function MainCardActions({
  sessionId,
  hostId,
}: {
  sessionId: string;
  hostId?: string;
}) {
  const router = useRouter();
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [hasParticipant, setHasParticipant] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Identify the current participant + whether they're the host. Re-runs
  // whenever the join gate completes (it dispatches "jam:participant-changed"),
  // so late joiners flow from "no participant" to registered without a
  // page reload.
  useEffect(() => {
    const read = () => {
      try {
        const stored = localStorage.getItem(`participant.${sessionId}`);
        if (!stored) {
          setHasParticipant(false);
          setMeId(null);
          setIsHost(hostId ? false : false);
          return;
        }
        const parsed = JSON.parse(stored) as { id?: string };
        setMeId(parsed.id ?? null);
        setHasParticipant(true);
        setIsHost(hostId != null && parsed.id === hostId);
      } catch {
        setHasParticipant(false);
        setIsHost(false);
      }
    };
    read();
    window.addEventListener("jam:participant-changed", read);
    return () => window.removeEventListener("jam:participant-changed", read);
  }, [sessionId, hostId]);

  // Poll the session status so non-hosts see startedAt as soon as the host triggers it.
  useEffect(() => {
    if (startedAt) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/status`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { startedAt?: number | null };
        if (data.startedAt) setStartedAt(data.startedAt);
      } catch {
        // network blip; next tick retries
      }
    };
    tick();
    const handle = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [sessionId, startedAt]);

  const handleStart = useCallback(async () => {
    if (starting || startedAt) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: meId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      const data = (await res.json()) as { startedAt: number };
      setStartedAt(data.startedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
      setStarting(false);
    }
  }, [sessionId, meId, starting, startedAt]);

  // Countdown overlay handles its own ticking + redirect. Only fire it
  // once the user is actually registered — otherwise a late joiner whose
  // join gate hasn't been submitted yet gets dragged into /session
  // anonymously the instant we discover startedAt is in the past.
  if (startedAt && hasParticipant) {
    return (
      <CountdownOverlay
        startedAt={startedAt}
        onDone={() => router.push(`/session?session=${sessionId}`)}
      />
    );
  }
  if (startedAt && !hasParticipant) {
    // The join gate is covering the screen; it will route to /session
    // itself once the joiner has signed in and set their name.
    return null;
  }

  if (isHost === null) {
    // Avoid a flash of host-only buttons before the localStorage check completes.
    return <div className="h-[56px] w-full" aria-hidden />;
  }

  if (!isHost) {
    return (
      <p
        className="text-center text-[14px] leading-snug text-black/60"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        Waiting for the host to start the session…
      </p>
    );
  }

  const inviteHref = `/waiting-room?session=${sessionId}&invite=1`;
  return (
    <div className="flex w-full flex-col gap-3 sm:gap-4">
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:gap-6">
        <Link
          href={inviteHref}
          className="flex flex-1 items-center justify-center rounded-2xl bg-[#1a1a1a] p-4 text-[14px] font-medium leading-none text-white transition-colors hover:bg-black"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Invite team
        </Link>
        <button
          type="button"
          onClick={handleStart}
          disabled={starting}
          className="flex flex-1 items-center justify-center rounded-2xl bg-[#1a1a1a] p-4 text-[14px] font-medium leading-none text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          {starting ? "Starting…" : "Start Session"}
        </button>
      </div>
      {error ? (
        <p
          className="text-center text-[13px] text-red-600"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CountdownOverlay({
  startedAt,
  onDone,
}: {
  startedAt: number;
  onDone: () => void;
}) {
  // Render the integer seconds remaining; recompute every 100ms so the
  // number flips at the right instant even if clocks drift slightly.
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((startedAt + COUNTDOWN_MS - Date.now()) / 1000))
  );
  const navigated = useRef(false);

  useEffect(() => {
    const tick = () => {
      const remaining = startedAt + COUNTDOWN_MS - Date.now();
      const next = Math.max(0, Math.ceil(remaining / 1000));
      setSecondsLeft(next);
      if (remaining <= 0 && !navigated.current) {
        navigated.current = true;
        onDone();
      }
    };
    tick();
    const handle = setInterval(tick, 100);
    return () => clearInterval(handle);
  }, [startedAt, onDone]);

  const display = secondsLeft > 0 ? secondsLeft : "Go";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-md"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <p
          className="text-[16px] uppercase tracking-[0.3em] text-white/70"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          Session starting
        </p>
        <p
          key={String(display)}
          className="animate-[countdown-pulse_1s_ease-out] text-[160px] leading-none text-white sm:text-[200px]"
          style={{ fontFamily: "var(--font-queens)", fontWeight: 300 }}
        >
          {display}
        </p>
      </div>
      <style>{`
        @keyframes countdown-pulse {
          0% { transform: scale(0.7); opacity: 0; }
          30% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
