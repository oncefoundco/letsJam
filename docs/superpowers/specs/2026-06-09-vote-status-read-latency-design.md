# Lightweight `GET /votes` read — tighten realtime vote latency

**Date:** 2026-06-09
**Status:** Approved (pending spec review)
**Scope:** `app/api/sessions/[id]/votes/route.ts` (GET), `lib/sessionStore.ts`

## Problem

When a participant votes, Supabase Realtime broadcasts a `votes-updated` ping
(`lib/realtime.ts`) and every peer reacts by calling `GET /votes` to refetch
status. End-to-end peer updates were measured at ~1–3s. Investigation showed the
Realtime relay is fast; the bottleneck is the refetch itself.

`GET /votes` calls `getSessionFresh(id)` → `loadSession(id)`, which issues **1 +
10** queries (`lib/sessionStore.ts`). Through the Sydney transaction pooler
(`prepare:false`, transaction-mode) queries **cannot pipeline**, so a
`Promise.all` of 10 still costs ~10 serialized round-trips (~190ms each per the
codebase's own notes in `createSession`/`saveSession`).

Measured `GET /votes` against a seeded round-2 session (dev, local → Sydney
pooler): **4.8s cold, then 1.3–2.5s warm**. That is the latency users feel.

Most of `loadSession`'s work is irrelevant to the vote-status response: it loads
files, reflections, refine_context, **and** the other phase's tables every time.

## Constraints (decided during brainstorming)

1. **Strict server-authoritative model stays.** Clients never trust vote data
   off the channel; every update is a fresh server read. We make the read cheap,
   we do **not** put the tally in the broadcast payload. (`lib/realtime.ts`'s
   "we never read vote state off the channel itself" stays true.)
2. **Both phases in scope.** The endpoint serves round-1 dot voting
   (`DotVotePanel`) and round-2 A/B voting (`VotePanel`); both fire on every
   broadcast. Each gets its own tailored lightweight read (not a single superset
   query).
3. **No contract drift.** The HTTP response shape for both branches must stay
   byte-identical to today's.

## Approach

**One aggregated statement per branch, fed through the existing helpers.**

Add `loadVoteStatus(id)` to `lib/sessionStore.ts`. It returns a *partial*
`StoredSession` (vote-relevant fields populated, the rest safe empties) or
`null`. The GET route swaps `getSessionFresh(id)` → `loadVoteStatus(id)` and is
otherwise unchanged — it still calls `currentRound`, `votesThisRound`,
`tallyDots`, `dotVotersDone`, `dotColorsByOption` to build the response, so the
output is computed by the same code as today and cannot silently drift.

### Data flow

```
broadcast  →  client GET /votes  →  loadVoteStatus(id):
  1. select current_round from jams where id = $1     (round-trip 1; no row → null → 404)
  2. branch on round, run ONE aggregated query        (round-trip 2):
       round >= 2 (A/B):  participants + votes(this round) + outcome + perspectives
       round  < 2 (dot):  participants(+color) + dot_allocations(this round)
                          + decision + the decided option
  3. shape into a partial StoredSession
  →  route feeds existing helpers → identical response JSON
```

**2 round-trips (~400ms)** vs today's ~10 (~2s). Honest tradeoff: keeping the two
reads tailored and separate (per constraint 2) means a cheap `current_round`
probe first. A single-round-trip CASE-CTE variant is possible later if ~400ms is
not tight enough; deferred (YAGNI).

### Partial `StoredSession` contract

The helpers only read specific fields, so populate exactly those; everything else
gets safe empties (`files: []`, `reflections: []`, `roomUrl: ""`, etc.) so the
object satisfies the type without extra reads.

**A/B branch (round ≥ 2)** — consumed by `currentRound`, `votesThisRound`,
`participants.length`, and the route's outcome check:
- `round` ← `jams.current_round`
- `participants` ← `[{ id }]` (count + ids suffice here)
- `votes` ← this round only: `{ participantId, choice, round }`
- `perspectives` ← the round's rows (slot A/B), used to build `outcome.perspective`
- `outcome` ← this round's outcome `{ round, choice, perspective }` or absent

**Dot branch (round 1)** — consumed by `dotVotersDone`, `tallyDots`,
`dotColorsByOption`, the `mine` filter, and the decision check:
- `round` ← `jams.current_round`
- `participants` ← `[{ id, bg }]` (`bg` = color, needed by `dotColorsByOption`)
- `dotVotes` ← this round only: `{ participantId, optionId, dots, round }`
- `options` ← the decided option's row (so `decision.option` can be built)
- `decision` ← this round's decision `{ round, option }` or absent

Match `loadSession`'s existing mapping for outcome/decision construction exactly
(see `lib/sessionStore.ts` `loadSession`).

### Error handling

- No jam row (round probe empty) → `loadVoteStatus` returns `null` → route
  returns the existing 404. Same as today.
- Empty child sets → `coalesce(..., '[]')` / absent → `[]` / `null`, producing the
  same response an empty session yields today.

### Deliberate non-behaviors

- **No Redis write.** Unlike `getSessionFresh`, `loadVoteStatus` does not re-warm
  the full-session blob (it never loads a full session). Acceptable: `getSession`
  (page render, sidebar) backfills the cache on its own misses. Document this in
  the function's comment so the omission reads as intentional.

## Security

Priorities: the change must be secure and must reduce latency. Posture:

- **No new trust surface.** Direct server-authoritative Postgres read; no cache,
  no trust of any broadcast-payload data (constraint 1). The client still cannot
  influence the returned tally.
- **Parameterized SQL only.** `postgres.js` tagged templates bind `${id}` and the
  `pid` query param as parameters, never string-interpolated — no injection path.
  The aggregation SQL is static.
- **Endpoint auth unchanged.** `GET /votes` currently returns status to anyone
  holding the session id; this change neither weakens nor adds that. Adding real
  auth/authorization to the endpoint is a separate, larger task (out of scope).
- **Robustness bonus.** Bypasses the cache-poisoning race `getSessionFresh`
  exists to dodge, so a stale-cache wedge can no longer affect this read.

## Out of scope

- Write-path reads (`recordVote`, `resolveVotes`, timer) keep `getSessionFresh`.
- Dot-vote **correctness** (a separate WIP).
- The 15s fallback poll cadence (`FALLBACK_POLL_MS`) — unchanged.
- Carrying vote data in the broadcast payload (rejected by constraint 1).

## Testing

1. **Equivalence (drift guard).** Seed representative DB states and assert the
   `loadVoteStatus`-based response equals the current `getSessionFresh`-based
   response, byte-identical:
   - round-2: no votes / partial / all-voted / resolved-A / refine-majority
   - round-1: no dots / partial / all-in / decided
2. **Latency.** Measure `GET /votes` before/after (target ~2s → ~400ms). Reuse /
   extend `scripts/bench-api.mjs`.
3. **End-to-end realtime.** Re-run the two-session vote flow with
   `scripts/ws-trace.js`; confirm the peer's counter updates well under 1s after
   the broadcast frame lands.

## Success criteria

- `GET /votes` server time drops from ~1.3–2.5s to ~400ms (warm).
- Response JSON unchanged for both branches across all seeded states.
- Strict server-authoritative model preserved (no cache read, no payload trust).
- End-to-end peer update visibly faster (sub-second after broadcast).
