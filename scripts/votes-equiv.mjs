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
               values (${jid}, 'VOTES EQUIV', ${f.desc}, 'active', '', '', ${"veq-" + f.j}, ${t(0)}, ${f.round}, ${t(0)},
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
