# Dot Voting (second diamond: Develop → Deliver) — Design

**Date:** 2026-05-31
**Status:** Approved

## Goal

Replace the binary A/B vote with **participant-proposed options + dot voting**,
completing the Double Diamond: Discuss (Discover) → Reflect/synthesize (Define) →
**propose options (Develop) → dot-vote (Deliver)**.

## Decisions (from discussion)

- **Options come from participants.** The self-reflection prompt already asks
  "what would you do, and why?", so each submitted take **is** that person's
  proposed direction. After reflection, the AI turns the takes into a tidy set of
  **option cards** (short title + cleaned body + attribution), merging only
  near-duplicates. No separate "propose" step/page.
- **Dot voting.** Each participant gets **5 dots** (`DOTS_PER_PARTICIPANT`),
  distributed across the option cards with `−/+` (stacking allowed). Live
  "Votes left ●●●●● x/5" pill; each voter's dots render in their avatar color.
- **A standing "Neither — we need to refine" card** is always present.
- **Resolve: most dots wins → `/the-call`.** If the refine card wins (or no
  option clears the others — tie at top), **loop**: bump `round`, carry refine
  context, clear options + reflections + dot votes, re-open reflection. Reuses
  the existing `round` / `refineContext` machinery.

## Build in two stages

**Stage 1 (this work): the working dot-vote on the Redis-cached session.**
`options` + `dotVotes` live on `StoredSession`, cached in Redis only — exactly
like the phase timer. No Postgres migration, so the durable `loadSession`/
`persistSession` mapping is untouched and nothing breaks. Within a live jam the
24h Redis cache holds it. This delivers the full experience end-to-end.

**Stage 2 (follow-up, flagged): durable persistence.** A migration adding
`jam_options` + `jam_dot_votes` (and an `outcomes` → option reference), plus
`sessionStore` load/persist mapping. Needs applying to Supabase, so it's
deferred — same posture as the timer. Until then, options/dots/outcome persist
in Redis only.

## Data model (Stage 1 — `lib/sessions.ts`)

```ts
type JamOption = {
  id: string;
  title: string;
  body: string;
  authorId?: string;
  authorName?: string;
};
type DotAllocation = { participantId: string; optionId: string; dots: number; round: number };

// on StoredSession:
options?: JamOption[];
dotVotes?: DotAllocation[];
```

`REFINE_OPTION_ID = "refine"` is a sentinel (not a stored option) for the
standing refine card. `DOTS_PER_PARTICIPANT = 5` (one constant).

## AI (`lib/cluster.ts`)

New `proposeOptions(topic, reflections, summary, refineContext)` → `JamOption[]`
(without ids). System prompt: each reflection is a participant's proposed
direction; produce one concise option card per distinct proposal (title ≤ ~8
words, 2–3 sentence body, attribution by name); merge only near-identical
proposals; ground strictly in what people wrote; cap ~6. The existing
`clusterReflections` (2 perspectives) is retired from the flow.

## Server helpers (`lib/sessions.ts`)

- `ensureOptions(sessionId)` — idempotent: if no `options`, run `proposeOptions`
  over the round's written reflections and store (ids assigned).
- `setDotAllocation(sessionId, participantId, allocations)` — replace this
  participant's dots for the round; reject if total > `DOTS_PER_PARTICIPANT`.
- `tallyDots(session)` → `{ [optionId]: number }` for the round (incl. `refine`).
- `resolveDots(sessionId, {force})` — once everyone has spent ≥1 dot (or forced):
  winner = option with most dots. If `refine` wins or there's a top-tie → refine
  loop (bump round, clear options/reflections/dotVotes, append refine reasons).
  Else set `outcome` to the winning option → decided.

## API

- `POST …/synthesize` → now calls `ensureOptions`; returns `{ options }`.
- `POST …/votes` → body `{ participantId, allocations: {optionId,dots}[] }`;
  validates total ≤ 5; returns `{ tally }`.
- `POST …/votes/resolve` → `resolveDots`; returns the resolution.
- `GET …/status` → add `options`, `tally`, `round`, and per-round
  `dotsCast` / `allIn` so clients can poll.

## UI

- **`/vote`** (`331:802`): "Time to decide / Vote on your …" + a responsive grid
  of option cards (gray, title/body) + the standing refine card. Each card shows
  cast dots (avatar-colored) and a `−/+` control bound to the current user's
  allocation. Fixed bottom "Votes left ●●●●● x/5" pill. A `VotePanel` client
  component manages allocation state, posts on change (debounced), polls
  `/status` for others' dots + resolution, and routes to `/the-call` when
  decided (or refreshes on a refine loop). Host can force-resolve; everyone-in
  auto-resolves. The "synthesizing options…" interim shows while `ensureOptions`
  runs.
- **`/the-call`**: render the winning `JamOption` (title/body/attribution)
  instead of the A/B perspective. Falls back gracefully.
- **`/self-reflection`** (`357:2988`) polish: "Refine" affordance on the box,
  "Private until everyone is in" hint, and "(Completed)" status in the
  participant list.

## Out of scope

- Stage-2 Postgres persistence (migration provided later).
- Editing/reordering options; per-option comments.

## Verification

- Build + lint clean.
- API smoke: synthesize → options; cast dots (reject >5); resolve picks the
  top option; refine card winning loops the round.
- Browser: dot grid renders, `−/+` updates "Votes left", others' dots appear,
  decided → `/the-call` shows the winner.
