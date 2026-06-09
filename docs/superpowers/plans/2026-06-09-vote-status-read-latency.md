# Lightweight `GET /votes` Read — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut `GET /votes` server latency from ~1.3–2.5s to ~400ms by replacing the full-session `loadSession` (10+ serialized pooler round-trips) with a tailored, vote-only read, without changing the HTTP response or the strict server-authoritative model.

**Architecture:** Add `loadVoteStatus(id)` to `lib/sessionStore.ts`: a cheap `current_round` probe + ONE aggregated SQL statement for the relevant phase, returning a *partial* `StoredSession`. The `GET /votes` route swaps `getSessionFresh` → `loadVoteStatus` and otherwise stays identical, so the existing helpers (`votesThisRound`, `tallyDots`, etc.) still compute the response — making byte-equivalence the correctness guard.

**Tech Stack:** Next.js 16 (App Router), `postgres` (Supabase Sydney transaction pooler, `prepare:false`), node `.mjs` scripts for characterization/latency tests (no unit-test framework in this repo).

**Spec:** `docs/superpowers/specs/2026-06-09-vote-status-read-latency-design.md`

---

## File Structure

- **Create** `scripts/votes-equiv.mjs` — characterization harness: seeds deterministic vote-state fixtures, fetches `GET /votes`, normalizes, and `capture`s a golden file / `check`s against it. This is the drift guard (no unit-test framework exists).
- **Modify** `lib/sessionStore.ts` — add `loadVoteStatus(id)` beside `loadSession`.
- **Modify** `lib/sessions.ts` — re-export `loadVoteStatus` so the route imports it from `@/lib/sessions` (existing import-source convention).
- **Modify** `app/api/sessions/[id]/votes/route.ts` — GET: swap `getSessionFresh(id)` → `loadVoteStatus(id)`; add the import. Nothing else changes.
- **Golden artifact** `scripts/.votes-equiv-golden.json` — transient, NOT committed (add to `.gitignore`).

Prerequisite for every step that runs the harness: the dev server is up on `http://localhost:3000` and `.env` holds `SUPABASE_DATABASE_PASSWORD`. Check with:
`curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/` → `200`.

---

## Task 1: Characterization harness + capture golden from current code

Captures the CURRENT endpoint's responses across representative states. This is a behavior-preserving refactor, so the test is a golden/characterization comparison (green-before → green-after), not red→green.

**Files:**
- Create: `scripts/votes-equiv.mjs`
- Modify: `.gitignore` (ignore the golden artifact)

- [ ] **Step 1: Write the harness**

Create `scripts/votes-equiv.mjs` with exactly this content:

```js
#!/usr/bin/env node
/**
 * Characterization harness for GET /votes — guards the response contract while
 * we swap the read path under it (loadSession -> loadVoteStatus).
 *
 * Seeds DETERMINISTIC fixtures (fixed UUIDs + fixed timestamps) so the response
 * is byte-stable across runs, then:
 *   capture <baseUrl>  seed + fetch + normalize -> write golden json
 *   check   <baseUrl>  seed + fetch + normalize -> deep-compare to golden (exit 1 on drift)
 *   clean              delete all fixtures
 *
 * Run: node --env-file=.env scripts/votes-equiv.mjs capture http://localhost:3000
 *      node --env-file=.env scripts/votes-equiv.mjs check   http://localhost:3000
 *      node --env-file=.env scripts/votes-equiv.mjs clean
 */
import postgres from "postgres";
import { readFileSync, writeFileSync } from "node:fs";

const DOTS_PER_PARTICIPANT = 5; // keep in sync with lib/voting.ts
const GOLDEN = "scripts/.votes-equiv-golden.json";
const T0 = new Date("2026-06-09T00:00:00.000Z");
const t = (n) => new Date(T0.getTime() + n * 1000);

const sql = postgres({
  host: "aws-1-ap-southeast-2.pooler.supabase.com", port: 6543,
  user: "postgres.tkjjgogbhhtinncnwlpp", password: process.env.SUPABASE_DATABASE_PASSWORD,
  database: "postgres", ssl: "require", prepare: false, max: 3,
});

// Deterministic, valid-shaped UUIDs.
const J = (n) => `aaaaaaaa-0000-4000-8000-${String(n).padStart(12, "0")}`;
const P = (j, k) => `bbbbbbbb-000${j}-4000-8000-${String(k).padStart(12, "0")}`;
const O = (j, k) => `cccccccc-000${j}-4000-8000-${String(k).padStart(12, "0")}`;
const COLORS = ["#e96748", "#44aa77", "#4477aa"];

// Fixture specs. round>=2 -> A/B (perspectives); round 1 -> dot (options).
const FIXTURES = [
  { j: 1, round: 2, np: 3, votes: [],                          desc: "ab-no-votes" },
  { j: 2, round: 2, np: 3, votes: [["A"]],                     desc: "ab-partial" },
  { j: 3, round: 2, np: 3, votes: [["A"], ["B"], ["A"]],       desc: "ab-all-no-outcome" },
  { j: 4, round: 2, np: 3, votes: [["A"], ["B"], ["A"]], outcome: "A", desc: "ab-resolved-A" },
  { j: 5, round: 2, np: 3, votes: [["B"], ["B"], ["A"]], outcome: "B", desc: "ab-resolved-B" },
  { j: 6, round: 1, np: 3, opts: 3, dots: [],                  desc: "dot-no-dots" },
  { j: 7, round: 1, np: 3, opts: 3, dots: [[0, 0, 3]],         desc: "dot-partial", pid: 0 },
  { j: 8, round: 1, np: 3, opts: 3, dots: [[0, 0, 5], [1, 1, 5], [2, 0, 5]], desc: "dot-all-in" },
  { j: 9, round: 1, np: 3, opts: 3, dots: [[0, 0, 5], [1, 0, 5], [2, 1, 5]], decision: 0, desc: "dot-decided" },
];

async function seedAll() {
  await cleanAll();
  for (const f of FIXTURES) {
    const jid = J(f.j);
    await sql.begin(async (tx) => {
      await tx`insert into jams (id, title, description, status, whereby_room_url, whereby_host_room_url,
                 whereby_room_name, started_at, current_round, created_at, expires_at)
               values (${jid}, 'VOTES EQUIV', ${f.desc}, 'active', '', '', '', ${t(0)}, ${f.round}, ${t(0)},
                       ${new Date(T0.getTime() + 864e5)})`;
      for (let k = 0; k < f.np; k++) {
        await tx`insert into jam_participants (id, jam_id, name, color, is_host, joined_at)
                 values (${P(f.j, k)}, ${jid}, ${"P" + k}, ${COLORS[k % COLORS.length]}, ${k === 0}, ${t(k)})`;
      }
      if (f.round >= 2) {
        for (const [slot, s] of [["A", "Aa"], ["B", "Bb"]]) {
          await tx`insert into perspectives (jam_id, round, slot, label, title, body, attribution)
                   values (${jid}, ${f.round}, ${slot}, ${"Perspective " + slot}, ${s}, 'body', 'room')`;
        }
        // Sequential inserts keep voted_at order deterministic for voterIds.
        for (let i = 0; i < f.votes.length; i++) {
          await tx`insert into votes (jam_id, participant_id, round, choice, reason, voted_at)
                   values (${jid}, ${P(f.j, i)}, ${f.round}, ${f.votes[i][0]}, null, ${t(10 + i)})`;
        }
        if (f.outcome) {
          await tx`insert into outcomes (jam_id, round, choice, perspective_id)
                   values (${jid}, ${f.round}, ${f.outcome},
                     (select id from perspectives where jam_id = ${jid} and round = ${f.round}
                            and slot = ${f.outcome} limit 1))`;
        }
      } else {
        for (let i = 0; i < f.opts; i++) {
          await tx`insert into jam_options (id, jam_id, round, title, body, attribution, author_id, position)
                   values (${O(f.j, i)}, ${jid}, 1, ${"Opt" + i}, 'b', 'r', null, ${i})`;
        }
        for (const [pIdx, optIdx, dots] of f.dots) {
          await tx`insert into dot_allocations (jam_id, participant_id, round, option_id, dots)
                   values (${jid}, ${P(f.j, pIdx)}, 1, ${O(f.j, optIdx)}, ${dots})`;
        }
        if (f.decision !== undefined) {
          await tx`insert into jam_decisions (jam_id, round, option_id) values (${jid}, 1, ${O(f.j, f.decision)})`;
        }
      }
    });
  }
}

async function cleanAll() {
  const rows = await sql`select id from jams where title = 'VOTES EQUIV'`;
  for (const r of rows) {
    for (const tbl of ["jam_decisions", "dot_allocations", "jam_options", "outcomes", "votes",
                       "perspectives", "jam_participants"]) {
      await sql.unsafe(`delete from ${tbl} where jam_id = $1`, [r.id]);
    }
    await sql`delete from jams where id = ${r.id}`;
  }
}

// Sort the order-insensitive list fields so legit nondeterministic ordering
// (loadSession reads dot_allocations with no ORDER BY) doesn't cause false drift.
function normalize(body) {
  const b = JSON.parse(JSON.stringify(body));
  if (Array.isArray(b.voterIds)) b.voterIds.sort();
  if (b.dotsByOption) for (const k of Object.keys(b.dotsByOption)) b.dotsByOption[k].sort();
  return b;
}

async function fetchAll(baseUrl) {
  const out = {};
  for (const f of FIXTURES) {
    const q = f.pid !== undefined ? `?pid=${P(f.j, f.pid)}` : "";
    const res = await fetch(`${baseUrl}/api/sessions/${J(f.j)}/votes${q}`, { cache: "no-store" });
    out[f.desc] = { status: res.status, body: normalize(await res.json()) };
  }
  return out;
}

const mode = process.argv[2];
const baseUrl = (process.argv[3] || "http://localhost:3000").replace(/\/$/, "");

if (mode === "clean") {
  await cleanAll();
  console.log("cleaned");
} else if (mode === "capture") {
  await seedAll();
  const got = await fetchAll(baseUrl);
  writeFileSync(GOLDEN, JSON.stringify(got, null, 2));
  console.log(`captured ${Object.keys(got).length} fixtures -> ${GOLDEN}`);
} else if (mode === "check") {
  await seedAll();
  const got = await fetchAll(baseUrl);
  const golden = JSON.parse(readFileSync(GOLDEN, "utf8"));
  let drift = 0;
  for (const k of Object.keys(golden)) {
    const a = JSON.stringify(golden[k]), b = JSON.stringify(got[k]);
    if (a !== b) { drift++; console.error(`DRIFT [${k}]\n  golden: ${a}\n  got:    ${b}`); }
  }
  console.log(drift ? `FAIL: ${drift} fixture(s) drifted` : `PASS: all ${Object.keys(golden).length} match`);
  await sql.end();
  process.exit(drift ? 1 : 0);
} else {
  console.error("usage: votes-equiv.mjs <capture|check|clean> [baseUrl]");
  process.exit(2);
}
await sql.end();
```

- [ ] **Step 2: Ignore the golden artifact**

Append to `.gitignore`:

```
scripts/.votes-equiv-golden.json
```

- [ ] **Step 3: Capture the golden from the CURRENT (unchanged) endpoint**

Run: `node --env-file=.env scripts/votes-equiv.mjs capture http://localhost:3000`
Expected: `captured 9 fixtures -> scripts/.votes-equiv-golden.json`

- [ ] **Step 4: Sanity-check the harness against itself (old vs old)**

Run: `node --env-file=.env scripts/votes-equiv.mjs check http://localhost:3000`
Expected: `PASS: all 9 match` (exit 0). If this fails, the harness is nondeterministic — fix before proceeding.

- [ ] **Step 5: Commit**

```bash
git add scripts/votes-equiv.mjs .gitignore
git commit -m "test: characterization harness for GET /votes response"
```

---

## Task 2: Implement `loadVoteStatus` in `lib/sessionStore.ts`

Not wired to the route yet — just add the function so it can be reviewed in isolation.

**Files:**
- Modify: `lib/sessionStore.ts` (add after `loadSession`, before `persistSession`)

- [ ] **Step 1: Add the function**

Insert this immediately after `loadSession` ends (after its closing `}` near line 146 — the `const SESSION_TTL_SECONDS` line follows; place the function above that constant or just after `loadSession`):

```ts
// Lightweight, vote-only source-of-truth read for the GET /votes hot path
// (fires on every Realtime broadcast + the fallback poll). loadSession issues
// 1+10 queries; through the non-pipelining Sydney pooler that's ~10 serialized
// round-trips (~2s). The vote-status response only needs the current round's
// slice, so this does a cheap current_round probe + ONE aggregated statement for
// the relevant phase (~2 round-trips). Returns a PARTIAL StoredSession: only the
// fields the GET /votes response helpers read are populated; the rest are safe
// empties. Reads Postgres directly (no Redis), so it keeps the strict
// server-authoritative model and sidesteps the cache-poisoning race
// getSessionFresh exists to dodge. It deliberately does NOT re-warm the Redis
// blob (it has no full session to write) — getSession backfills on its own miss.
export async function loadVoteStatus(id: string): Promise<StoredSession | null> {
  const [probe] = await sql<{ current_round: number }[]>`
    select current_round from jams where id = ${id}`;
  if (!probe) return null;
  const round = probe.current_round;

  const base: StoredSession = {
    id,
    topic: "",
    files: [],
    roomUrl: "",
    hostRoomUrl: "",
    roomName: "",
    createdAt: 0,
    participants: [],
    reflections: [],
    round,
  };

  if (round >= 2) {
    const [row] = await sql<
      { participants: Participant[]; votes: Vote[]; perspectives: Perspective[]; outcome: { round: number; choice: "A" | "B" } | null }[]
    >`
      select
        coalesce((select json_agg(json_build_object(
            'id', p.id, 'name', p.name, 'bg', p.color,
            'joinedAt', (extract(epoch from p.joined_at) * 1000)::float8) order by p.joined_at)
          from jam_participants p where p.jam_id = ${id}), '[]') as participants,
        coalesce((select json_agg(json_build_object(
            'participantId', v.participant_id, 'name', '', 'choice', v.choice,
            'reason', v.reason, 'round', v.round, 'votedAt', 0) order by v.voted_at)
          from votes v where v.jam_id = ${id} and v.round = ${round}), '[]') as votes,
        coalesce((select json_agg(json_build_object(
            'label', pe.label, 'title', pe.title, 'body', pe.body, 'attribution', pe.attribution) order by pe.slot)
          from perspectives pe where pe.jam_id = ${id} and pe.round = ${round}), '[]') as perspectives,
        (select json_build_object('round', o.round, 'choice', o.choice)
          from outcomes o where o.jam_id = ${id} and o.round = ${round} limit 1) as outcome`;
    base.participants = row.participants;
    base.votes = row.votes;
    base.perspectives = row.perspectives.length ? row.perspectives : undefined;
    if (row.outcome) {
      const slot = row.outcome.choice === "A" ? 0 : 1;
      base.outcome = { round: row.outcome.round, choice: row.outcome.choice, perspective: row.perspectives[slot] };
    }
    return base;
  }

  const [row] = await sql<
    { participants: Participant[]; dot_votes: DotAllocation[]; options: JamOption[]; decided_option_id: string | null }[]
  >`
    select
      coalesce((select json_agg(json_build_object(
          'id', p.id, 'name', p.name, 'bg', p.color,
          'joinedAt', (extract(epoch from p.joined_at) * 1000)::float8) order by p.joined_at)
        from jam_participants p where p.jam_id = ${id}), '[]') as participants,
      coalesce((select json_agg(json_build_object(
          'participantId', d.participant_id, 'optionId', d.option_id, 'dots', d.dots, 'round', d.round))
        from dot_allocations d where d.jam_id = ${id} and d.round = ${round}), '[]') as dot_votes,
      coalesce((select json_agg(json_build_object(
          'id', op.id, 'title', op.title, 'body', op.body, 'attribution', op.attribution, 'authorId', op.author_id)
          order by op.position)
        from jam_options op where op.jam_id = ${id} and op.round = ${round}), '[]') as options,
      (select dec.option_id from jam_decisions dec where dec.jam_id = ${id} and dec.round = ${round} limit 1) as decided_option_id`;
  base.participants = row.participants;
  base.dotVotes = row.dot_votes;
  base.options = row.options.length ? row.options : undefined;
  if (row.decided_option_id) {
    const opt = row.options.find((o) => o.id === row.decided_option_id);
    if (opt) base.decision = { round, option: opt };
  }
  return base;
}
```

- [ ] **Step 2: Type-check compiles**

Run: `npx tsc --noEmit`
Expected: no errors (the file already imports `Participant`, `Vote`, `Perspective`, `JamOption`, `DotAllocation`, `StoredSession`).
Note: if the repo has no standalone `tsc` config that succeeds, skip to Step 3 and rely on the build in Task 5.

- [ ] **Step 3: Commit**

```bash
git add lib/sessionStore.ts
git commit -m "feat: add loadVoteStatus lightweight vote-only read"
```

---

## Task 3: Re-export and wire into the route

**Files:**
- Modify: `lib/sessions.ts` (re-export)
- Modify: `app/api/sessions/[id]/votes/route.ts` (import + swap the GET read)

- [ ] **Step 1: Re-export from `lib/sessions.ts`**

Add this line right after the `} from "./sessionStore";` block (around line 27):

```ts
export { loadVoteStatus } from "./sessionStore";
```

- [ ] **Step 2: Import it in the route**

In `app/api/sessions/[id]/votes/route.ts`, add `loadVoteStatus,` to the existing `@/lib/sessions` import block (alphabetical, after `getSessionFresh`):

```ts
import {
  currentRound,
  dotColorsByOption,
  dotVotersDone,
  getSessionFresh,
  loadVoteStatus,
  recordVote,
  setDotAllocation,
  tallyDots,
  votesThisRound,
  DOTS_PER_PARTICIPANT,
} from "@/lib/sessions";
```

(`getSessionFresh` stays imported — the POST handler still uses it.)

- [ ] **Step 3: Swap the GET read**

In the GET handler, change ONLY this line:

```ts
  const session = await getSessionFresh(id);
```

to:

```ts
  const session = await loadVoteStatus(id);
```

Leave the surrounding comment and all downstream logic untouched.

- [ ] **Step 4: Commit**

```bash
git add lib/sessions.ts "app/api/sessions/[id]/votes/route.ts"
git commit -m "feat: use loadVoteStatus on the GET /votes hot path"
```

---

## Task 4: Verify response equivalence (the drift guard)

**Files:** none (runs the Task 1 harness against the changed endpoint)

- [ ] **Step 1: Run the characterization check against the NEW endpoint**

Run: `node --env-file=.env scripts/votes-equiv.mjs check http://localhost:3000`
Expected: `PASS: all 9 match` (exit 0).

- [ ] **Step 2: If any fixture drifts**

The harness prints `DRIFT [<fixture>]` with `golden` vs `got`. Common causes and fixes:
- `outcome.perspective` null/misaligned → check the `slot` index mapping (`A`→0, `B`→1) and that perspectives are ordered `by pe.slot`.
- `decided` missing → check `decided_option_id` join and `options.find`.
- `dotsByOption` mismatch after sort → confirm `bg`/color came through (`'bg', p.color`).
Fix `loadVoteStatus`, re-commit, re-run Step 1 until `PASS`.

---

## Task 5: Confirm the latency win + build

**Files:** none

- [ ] **Step 1: Measure GET /votes latency (A/B fixture, warm)**

Run:
```bash
node --env-file=.env scripts/votes-equiv.mjs capture http://localhost:3000 >/dev/null  # ensure fixtures seeded
for i in 1 2 3 4 5; do curl -s -o /dev/null -w "  %{time_total}s\n" \
  "http://localhost:3000/api/sessions/aaaaaaaa-0000-4000-8000-000000000004/votes"; done
```
Expected: warm calls well under the prior ~1.3–2.5s baseline (target ~0.4–0.6s in dev; the floor is ~2 pooler round-trips).

- [ ] **Step 2: Production build passes**

Run: `npm run build`
Expected: builds with no type/lint errors; `/api/sessions/[id]/votes` listed as a route.

- [ ] **Step 3: Clean up fixtures**

Run: `node --env-file=.env scripts/votes-equiv.mjs clean`
Expected: `cleaned`

---

## Task 6: End-to-end realtime confirmation (manual)

Confirms the peer-visible update is now sub-second, using the committed `scripts/ws-trace.js` from the prior verification.

**Files:** none

- [ ] **Step 1: Seed one A/B session and reuse the two-browser flow**

Seed a 3-participant round-2 session (reuse the pattern from `scripts/votes-equiv.mjs` `seedAll`, or a one-off insert), open it in two `agent-browser` sessions with `--init-script scripts/ws-trace.js`, set each `localStorage` `participant.<id>` identity, vote in one, and confirm in the other:
- `window.__wsTrace.dump("votes-updated")` shows the received broadcast frame, and
- the "N of M have voted" counter advances within ~1s of the vote (previously ~2–9s).

- [ ] **Step 2: Tear down**

Delete the seeded session from Postgres and `agent-browser --session <name> close` both sessions.

---

## Self-Review (completed by plan author)

- **Spec coverage:** lightweight read (Tasks 2–3), both phases (Task 2 both branches), strict/no-cache/parameterized (Task 2 code + comment), equivalence guard (Tasks 1,4), latency target (Task 5), end-to-end (Task 6), security posture (parameterized tagged-template SQL throughout). ✔
- **Placeholder scan:** none — all SQL/JS shown in full.
- **Type consistency:** `loadVoteStatus(id): Promise<StoredSession | null>` defined Task 2, re-exported Task 3, called Task 3; harness uses fixed UUIDs `J(4)` consistently in Tasks 1 & 5.
