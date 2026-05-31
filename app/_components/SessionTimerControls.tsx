"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon, StopIcon } from "@heroicons/react/24/solid";
import { ControlButton, StatusPill } from "@/app/_components/HeaderControls";
import {
  DEFAULT_PHASE_MS,
  formatRemaining,
  isPaused,
  remainingMs,
  type PhaseTimer,
  type TimerPhase,
} from "@/lib/timer";

const POLL_MS = 2000;
const TICK_MS = 500;

// Live header timer + host controls. The host drives the shared countdown; every
// other client polls and follows. On /session, reaching 0:00 (or the host's
// Stop) moves everyone on to Self-Reflection.
export function SessionTimerControls({
  sessionId,
  phase,
  hostId,
}: {
  sessionId: string;
  phase: TimerPhase;
  hostId?: string;
}) {
  const router = useRouter();
  const [meId, setMeId] = useState<string | null>(null);
  const [timer, setTimer] = useState<PhaseTimer | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const navigated = useRef(false);
  const ensured = useRef(false);

  const isHost = hostId != null && meId === hostId;

  // Who am I? (set by the join/profile gate)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`participant.${sessionId}`);
      const parsed = stored ? (JSON.parse(stored) as { id?: string }) : null;
      setMeId(typeof parsed?.id === "string" ? parsed.id : null);
    } catch {
      setMeId(null);
    }
  }, [sessionId]);

  const post = useCallback(
    async (action: string, extra?: Record<string, unknown>) => {
      const res = await fetch(`/api/sessions/${sessionId}/timer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, participantId: meId, ...extra }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { timer: PhaseTimer | null };
      setTimer(data.timer);
    },
    [sessionId, meId]
  );

  // Host starts this phase's countdown once.
  useEffect(() => {
    if (!isHost || ensured.current) return;
    ensured.current = true;
    void post("ensure", { phase });
  }, [isHost, phase, post]);

  // Follow the shared timer + tick locally for a smooth display.
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/status`, {
          cache: "no-store",
        });
        if (!res.ok || !active) return;
        const data = (await res.json()) as { timer?: PhaseTimer | null };
        if (active) setTimer(data.timer ?? null);
      } catch {
        // transient — next tick retries
      }
    }
    refresh();
    const poll = setInterval(refresh, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => {
      active = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [sessionId]);

  const remaining = timer ? remainingMs(timer, now) : DEFAULT_PHASE_MS;
  const paused = timer ? isPaused(timer) : false;

  // Discussion: when the clock runs out (or the host stopped it), everyone
  // moves on to self-reflection. Guarded so we navigate exactly once.
  useEffect(() => {
    if (phase !== "discussion" || !timer || navigated.current) return;
    if (remainingMs(timer, Date.now()) <= 0) {
      navigated.current = true;
      router.push(`/self-reflection?session=${sessionId}`);
    }
  }, [phase, timer, now, sessionId, router]);

  const toggle = useCallback(() => {
    if (!isHost) return;
    void post(paused ? "resume" : "pause");
  }, [isHost, paused, post]);

  const stop = useCallback(() => {
    if (!isHost) return;
    void post("stop");
  }, [isHost, post]);

  const disabledCls = isHost ? "" : "opacity-40 cursor-not-allowed";

  return (
    <>
      {phase === "discussion" ? (
        <ControlButton
          aria-label="End discussion"
          onClick={stop}
          disabled={!isHost}
          className={disabledCls}
        >
          <StopIcon className="size-[16px]" />
        </ControlButton>
      ) : null}
      <ControlButton
        aria-label={paused ? "Resume timer" : "Pause timer"}
        onClick={toggle}
        disabled={!isHost}
        className={disabledCls}
      >
        {paused ? (
          <PlayIcon className="size-[16px]" />
        ) : (
          <PauseIcon className="size-[16px]" />
        )}
      </ControlButton>
      <StatusPill muted={paused}>{formatRemaining(remaining)} remaining</StatusPill>
    </>
  );
}
