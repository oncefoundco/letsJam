// Anchor-based phase timer, shared by the API routes and the client UI. Nothing
// server-only here so both sides can import it. The timer never "ticks" on the
// server — it stores an anchor and clients compute the remaining time, so every
// participant sees the same countdown without polling sub-second.

export type TimerPhase = "discussion" | "reflection" | "vote";

export type PhaseTimer = {
  phase: TimerPhase;
  startedAt: number; // epoch ms anchor
  durationMs: number;
  pausedAt: number | null; // null = running; set = frozen at this instant
  pausedAccumMs: number; // paused time banked before the current pause
  endedAt: number | null; // host Stop / hard end → remaining is 0
};

export const DEFAULT_PHASE_MINUTES = 5;
export const DEFAULT_PHASE_MS = DEFAULT_PHASE_MINUTES * 60 * 1000;

export function isPaused(timer: PhaseTimer): boolean {
  return timer.endedAt == null && timer.pausedAt != null;
}

export function remainingMs(timer: PhaseTimer, now: number): number {
  if (timer.endedAt != null) return 0;
  // While paused, freeze elapsed at the pause instant.
  const reference = timer.pausedAt ?? now;
  const elapsed = reference - timer.startedAt - timer.pausedAccumMs;
  return Math.max(0, timer.durationMs - elapsed);
}

// "m:ss" — e.g. 264000ms → "4:24".
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
