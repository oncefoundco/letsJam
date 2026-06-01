# Session Phase Timer — Design

**Date:** 2026-05-31
**Status:** Approved

## Goal

Make the header timer + pause/stop controls on the live session pages actually
work. Today `/session`, `/self-reflection`, and `/vote` show a static
`4:24s remaining` pill and non-functional pause/stop buttons. Replace this with a
real, **synchronized** phase countdown that the whole room shares, controlled by
the host.

## Decisions (from brainstorming)

- **Sync model:** server-anchored timer; every client computes remaining time
  locally from the anchor. Same pattern as the existing start countdown
  (`startedAt` + `/status` polling).
- **Duration:** single fixed default of **5 minutes** for every phase, expressed
  as one constant so it can later read the host's Settings value or be made
  per-phase. Not building duration editing now.
- **Auto-advance:** **Discussion only.** When the discussion timer hits `0:00`
  or the host hits Stop, every `/session` client navigates to
  `/self-reflection`. Self-Reflection and Vote show a live countdown + host
  pause/resume but do **not** force-advance at zero — advancement stays with the
  existing submit/vote flow.
- **Permissions:** pause / resume / stop are **host-only** (host = `participants[0]`),
  enforced server-side. Non-hosts see the live pill and the buttons rendered but
  disabled.

## Architecture

### Timer model (`lib/timer.ts`, client-safe)

A pure, anchor-based model — no server ticking, no per-client drift:

```ts
type TimerPhase = "discussion" | "reflection" | "vote";
type PhaseTimer = {
  phase: TimerPhase;
  startedAt: number;        // epoch ms anchor
  durationMs: number;       // default 5 min
  pausedAt: number | null;  // null = running; set = frozen at this instant
  pausedAccumMs: number;    // paused time banked before the current pause
  endedAt: number | null;   // host Stop / hard end → remaining is 0
};

DEFAULT_PHASE_MINUTES = 5;
remainingMs(t, now): number  // 0 if endedAt; else max(0, duration - (paused? - started - accum))
isPaused(t): boolean
formatRemaining(ms): string  // "m:ss"
```

`lib/timer.ts` imports nothing server-only, so both the API routes and the
client component use it.

### Persistence

`timer` is added to `StoredSession`. `persistSession`/`loadSession` map fixed
Postgres columns and will **not** persist it — so the timer lives in the **Redis
cache only** (24h TTL). That comfortably covers a 5-minute live timer; no DB
migration. If a timer must survive a cold cache later, add a `jams.timer` jsonb
column. Documented limitation, acceptable for now.

### Server helpers (`lib/sessions.ts`)

Load-modify-save (same concurrency caveat as `addParticipant`). No host check
here — the route does that.

- `ensurePhaseTimer(sessionId, phase, durationMs?)` — idempotent: if a running
  timer for `phase` exists, return it; otherwise replace with a fresh one
  (`startedAt = now`, `durationMs = durationMs ?? DEFAULT_PHASE_MS`).
- `pausePhaseTimer(sessionId)` — if running, set `pausedAt = now`.
- `resumePhaseTimer(sessionId)` — if paused, `pausedAccumMs += now - pausedAt`,
  `pausedAt = null`.
- `stopPhaseTimer(sessionId)` — set `endedAt = now` (remaining → 0).

### API

- `POST /api/sessions/[id]/timer` — body `{ action, participantId, phase?, durationMs? }`.
  `action ∈ { ensure, pause, resume, stop }`. 403 unless
  `participantId === participants[0].id`. Returns `{ timer }`.
- `GET /api/sessions/[id]/status` — extend response with `timer: session.timer ?? null`.

### Client (`app/_components/SessionTimerControls.tsx`)

One `"use client"` component, rendered inside each page's `HeaderControls`
group. Renders a fragment: `[Stop (discussion only)] [Pause/Resume] [timer pill]`.

- Reads `participant.{sessionId}` from localStorage → `meId`; `isHost = meId === hostId`.
- On mount, **host only** POSTs `ensure {phase}`.
- Polls `/status` (~2s) for the shared `timer`; ticks a local `now` (~500ms) for
  smooth display and prompt zero-detection.
- Pause toggles between `pause`/`resume`; Stop posts `stop`. Buttons
  `disabled` for non-hosts.
- **Discussion auto-advance:** if `phase === "discussion"` and
  `remainingMs === 0`, navigate once to `/self-reflection?session=…`.
- Pill text: `"{m:ss} remaining"`; falls back to the default duration until the
  first timer arrives.

### Page wiring

Each page keeps its static decorative buttons and drops in the client control +
live pill (replacing the static `StatusPill`):

- **/session** (`phase="discussion"`): clock (static) + `SessionTimerControls`
  (renders Stop, Pause, pill).
- **/self-reflection** (`phase="reflection"`): video + link (static) +
  `SessionTimerControls` (Pause, pill).
- **/vote** (`phase="vote"`): video + link (static) + `SessionTimerControls`
  (Pause, pill).

`sessionId` + `hostId = participants[0]?.id` are threaded into each page's
header.

## Out of scope

- Per-phase / editable durations and reading the Settings value (constant is
  structured to allow it later).
- Wiring the in-call clock/stop to Whereby's own mic/camera/leave controls.
- Postgres persistence of the timer.

## Verification

- Build + lint clean.
- Two browser tabs in one jam: timer counts down in sync; host Pause freezes
  both; host Stop (or hitting 0:00) moves both from `/session` to
  `/self-reflection`; non-host's buttons are disabled.
