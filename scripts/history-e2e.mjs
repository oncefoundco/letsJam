#!/usr/bin/env node
/**
 * E2E verification for round-history retention. Drives a REAL 2-round jam
 * through the live HTTP API against a dev server (Whereby room + AI synthesis
 * included), and asserts after every transition that:
 *   1. the live flow behaves exactly as before (options generate, dots gate,
 *      narrow fires, A/B vote decides), and
 *   2. round 1's ideas/options/dot allocations SURVIVE the narrow transition
 *      and all the background persistSession traffic that follows.
 *
 * Run:  node --env-file=.env scripts/history-e2e.mjs http://localhost:3000
 * The test jam is clearly titled; pass --keep to leave it for manual viewing
 * (it sets created_by so the signed-in host can open /jam/<id>), otherwise it
 * is deleted at the end.
 */
import postgres from "postgres";

const base = process.argv[2] ?? "http://localhost:3000";
const keep = process.argv.includes("--keep");

const sql = postgres({
  host: "aws-1-ap-southeast-2.pooler.supabase.com",
  port: 6543,
  user: "postgres.tkjjgogbhhtinncnwlpp",
  password: process.env.SUPABASE_DATABASE_PASSWORD,
  database: "postgres",
  ssl: "require",
  prepare: false,
  max: 3,
});

let failures = 0;
const ok = (cond, label) => {
  console.log(`${cond ? "  ✓" : "  ✗ FAIL"} ${label}`);
  if (!cond) failures++;
};

const api = async (path, body) => {
  const res = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${text.slice(0, 300)}`);
  return data;
};

// Poll a step that may need the AI call to finish (synthesize is idempotent).
const retry = async (fn, attempts = 5, delayMs = 3000) => {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
};

const counts = async (id) => {
  const [row] = await sql`select
    (select count(*)::int from jam_options     where jam_id = ${id} and round = 1) as r1_options,
    (select count(*)::int from dot_allocations where jam_id = ${id} and round = 1) as r1_dots,
    (select count(*)::int from reflection_ideas where jam_id = ${id} and round = 1) as r1_ideas,
    (select count(*)::int from reflections      where jam_id = ${id} and round = 1) as r1_refl,
    (select count(*)::int from reflections      where jam_id = ${id} and round = 2) as r2_refl,
    (select current_round from jams where id = ${id}) as round`;
  return row;
};

// ── Round 1: create, join, reflect, synthesize, dot-vote, resolve ────────────
console.log("create jam");
const { id, host } = await api("/api/sessions", {
  topic: "TEST — history retention (safe to delete)",
  description: "Automated verification jam for round-history retention.",
});
console.log(`  jam ${id}, host ${host.name}`);

const guest = await api(`/api/sessions/${id}/participants`, {
  name: "Guest Tester",
});
await api(`/api/sessions/${id}/start`, { participantId: host.id });

console.log("round 1: reflections (ideas per person)");
await api(`/api/sessions/${id}/reflections`, {
  participantId: host.id,
  ideas: [
    { text: "Host idea: ship the simple version first", refine: false },
    { text: "Host idea: timebox the rollout to one week", refine: false },
  ],
});
await api(`/api/sessions/${id}/reflections`, {
  participantId: guest.id,
  ideas: [{ text: "Guest idea: pilot with one friendly team", refine: false }],
});

console.log("round 1: synthesize option cards (AI)");
const { options } = await retry(() => api(`/api/sessions/${id}/synthesize`, {}));
ok(options.length >= 2, `options generated (${options.length})`);

console.log("round 1: both participants spend all 5 dots");
await api(`/api/sessions/${id}/votes`, {
  participantId: host.id,
  allocations: [
    { optionId: options[0].id, dots: 3 },
    { optionId: options[1].id, dots: 2 },
  ],
});
await api(`/api/sessions/${id}/votes`, {
  participantId: guest.id,
  allocations: [
    { optionId: options[0].id, dots: 2 },
    { optionId: options[1].id, dots: 3 },
  ],
});

const before = await counts(id);
ok(before.r1_options >= 2, `pre-narrow: round-1 options in PG (${before.r1_options})`);
ok(before.r1_dots === 4, `pre-narrow: round-1 dot rows in PG (${before.r1_dots})`);
ok(before.r1_ideas === 3, `pre-narrow: round-1 idea rows in PG (${before.r1_ideas})`);

console.log("resolve round 1 (should narrow to round 2)");
const res1 = await api(`/api/sessions/${id}/votes/resolve`, {});
ok(res1.resolution === "refining" && res1.round === 2, `narrowed to round 2 (${res1.resolution})`);

const afterNarrow = await counts(id);
ok(afterNarrow.round === 2, `jams.current_round = 2`);
ok(afterNarrow.r1_options === before.r1_options, `HISTORY: round-1 options survived narrow (${afterNarrow.r1_options})`);
ok(afterNarrow.r1_dots === before.r1_dots, `HISTORY: round-1 dots survived narrow (${afterNarrow.r1_dots})`);
ok(afterNarrow.r1_ideas === before.r1_ideas, `HISTORY: round-1 ideas survived narrow (${afterNarrow.r1_ideas})`);

// Live-flow guard: the new round must see a CLEAN slate.
const votesView = await api(`/api/sessions/${id}/votes`);
ok((votesView.options ?? []).length === 0 || votesView.round === 2, "live view moved to round 2");

// ── Round 2: reflect, synthesize perspectives, A/B vote, decide ──────────────
console.log("round 2: reflections");
await api(`/api/sessions/${id}/reflections`, {
  participantId: host.id,
  ideas: [{ text: "Go with the pilot, simple version", refine: false }],
});
await api(`/api/sessions/${id}/reflections`, {
  participantId: guest.id,
  ideas: [{ text: "Agree — pilot first, then expand", refine: false }],
});

console.log("round 2: synthesize perspectives (AI) — this fires persistSession");
const { perspectives } = await retry(() => api(`/api/sessions/${id}/synthesize`, {}));
ok(perspectives.length === 2, `perspectives generated (${perspectives.length})`);

// THE critical assertion: setPerspectives -> saveSession -> persistSession just
// ran. Under the old code that wipes history; under the fix it must not.
const afterPersist = await counts(id);
ok(afterPersist.r1_options === before.r1_options, `HISTORY: round-1 options survived persistSession (${afterPersist.r1_options})`);
ok(afterPersist.r1_dots === before.r1_dots, `HISTORY: round-1 dots survived persistSession (${afterPersist.r1_dots})`);
ok(afterPersist.r1_ideas === before.r1_ideas, `HISTORY: round-1 ideas survived persistSession (${afterPersist.r1_ideas})`);

console.log("round 2: both vote A, resolve");
await api(`/api/sessions/${id}/votes`, { participantId: host.id, choice: "A" });
await api(`/api/sessions/${id}/votes`, { participantId: guest.id, choice: "A" });
const res2 = await api(`/api/sessions/${id}/votes/resolve`, {});
ok(res2.resolution === "decided", `round 2 decided (${res2.resolution})`);

// Allow the post-decision background persist to land, then final history check.
await new Promise((r) => setTimeout(r, 6000));
const final = await counts(id);
ok(final.r1_options === before.r1_options, `FINAL: round-1 options intact (${final.r1_options})`);
ok(final.r1_dots === before.r1_dots, `FINAL: round-1 dots intact (${final.r1_dots})`);
ok(final.r1_ideas === before.r1_ideas, `FINAL: round-1 ideas intact (${final.r1_ideas})`);
ok(final.r1_refl === 2, `FINAL: round-1 reflections intact (${final.r1_refl})`);
ok(final.r2_refl === 2, `FINAL: round-2 reflections intact (${final.r2_refl})`);

const [outcome] = await sql`select choice from outcomes where jam_id = ${id} and round = 2`;
ok(outcome?.choice === "A", `outcome recorded (${outcome?.choice})`);

if (keep) {
  // Hand the jam to the signed-in host so /jam/<id> renders for them.
  const [profile] = await sql`select id from profiles order by created_at asc limit 1`;
  if (profile) {
    await sql`update jams set created_by = ${profile.id} where id = ${id}`;
    console.log(`kept: open ${base}/jam/${id} while signed in`);
  }
} else {
  await sql`delete from jams where id = ${id}`;
  console.log("cleaned up test jam");
}

await sql.end();
console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
