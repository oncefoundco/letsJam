import "server-only";
import { sql } from "./db";
import type {
  StoredSession,
  Participant,
  Reflection,
  Perspective,
  Vote,
  VoteChoice,
  Outcome,
  JamOption,
  DotAllocation,
} from "./sessions";

// Maps the StoredSession blob (the Redis cache unit) to/from the normalized
// Supabase tables, which are the durable source of truth. Redis is a
// cache-aside layer on top of this (see lib/sessions.ts).

const ms = (d: Date | string | null | undefined): number | undefined =>
  d == null ? undefined : new Date(d).getTime();

function jamStatus(s: StoredSession): string {
  if (s.outcome) return "completed";
  if (s.startedAt) return "active";
  return "waiting";
}

export async function loadSession(id: string): Promise<StoredSession | null> {
  const [jam] = await sql<
    {
      id: string;
      title: string;
      whereby_room_url: string | null;
      whereby_host_room_url: string | null;
      whereby_room_name: string | null;
      created_at: Date;
      started_at: Date | null;
      current_round: number;
    }[]
  >`select id, title, whereby_room_url, whereby_host_room_url, whereby_room_name,
           created_at, started_at, current_round
      from jams where id = ${id}`;
  if (!jam) return null;

  const round = jam.current_round;
  const [participants, files, reflections, perspectives, votes, refine, outcome, summary, options, dots, decision] =
    await Promise.all([
      sql`select id, name, color, joined_at from jam_participants where jam_id = ${id} order by joined_at asc`,
      sql`select name from jam_files where jam_id = ${id} order by created_at asc`,
      sql`select participant_id, text, passed, submitted_at from reflections where jam_id = ${id} and round = ${round}`,
      sql`select slot, label, title, body, attribution from perspectives where jam_id = ${id} and round = ${round} order by slot asc`,
      sql`select participant_id, choice, reason, round, voted_at from votes where jam_id = ${id} order by voted_at asc`,
      sql`select reason from refine_context where jam_id = ${id} order by created_at asc`,
      sql`select round, choice, perspective_id from outcomes where jam_id = ${id} and round = ${round}`,
      sql`select decisions, open_questions, differences from jam_summaries where jam_id = ${id} order by created_at desc limit 1`,
      sql`select id, title, body, attribution, author_id from jam_options where jam_id = ${id} and round = ${round} order by position asc`,
      sql`select participant_id, option_id, dots, round from dot_allocations where jam_id = ${id}`,
      sql`select round, option_id from jam_decisions where jam_id = ${id} and round = ${round}`,
    ]);

  const nameById = new Map(participants.map((p) => [p.id as string, p.name as string]));

  const participantList: Participant[] = participants.map((p) => ({
    id: p.id as string,
    name: p.name as string,
    bg: p.color as string,
    joinedAt: ms(p.joined_at as Date)!,
  }));

  const reflectionList: Reflection[] = reflections.map((r) => ({
    participantId: r.participant_id as string,
    name: nameById.get(r.participant_id as string) ?? "Someone",
    text: r.text as string,
    passed: r.passed as boolean,
    submittedAt: ms(r.submitted_at as Date)!,
  }));

  const perspectiveList: Perspective[] = perspectives.map((p) => ({
    label: (p.label as string) ?? "",
    title: (p.title as string) ?? "",
    body: (p.body as string) ?? "",
    attribution: (p.attribution as string) ?? "",
  }));

  const voteList: Vote[] = votes.map((v) => ({
    participantId: v.participant_id as string,
    name: nameById.get(v.participant_id as string) ?? "Someone",
    choice: v.choice as VoteChoice,
    reason: (v.reason as string) ?? undefined,
    round: v.round as number,
    votedAt: ms(v.voted_at as Date)!,
  }));

  let outcomeVal: Outcome | undefined;
  if (outcome[0]) {
    const slot = outcome[0].choice === "A" ? 0 : 1;
    outcomeVal = {
      round: outcome[0].round as number,
      choice: outcome[0].choice as "A" | "B",
      perspective: perspectiveList[slot],
    };
  }

  const optionList: JamOption[] = options.map((o) => ({
    id: o.id as string,
    title: (o.title as string) ?? "",
    body: (o.body as string) ?? "",
    attribution: (o.attribution as string) ?? "",
    authorId: (o.author_id as string) ?? undefined,
  }));

  const dotVotes: DotAllocation[] = dots.map((d) => ({
    participantId: d.participant_id as string,
    optionId: d.option_id as string,
    dots: d.dots as number,
    round: d.round as number,
  }));

  let decisionVal: { round: number; option: JamOption } | undefined;
  if (decision[0]) {
    const opt = optionList.find((o) => o.id === decision[0].option_id);
    if (opt) decisionVal = { round: decision[0].round as number, option: opt };
  }

  return {
    id: jam.id,
    topic: jam.title,
    files: files.map((f) => f.name as string),
    roomUrl: jam.whereby_room_url ?? "",
    hostRoomUrl: jam.whereby_host_room_url ?? "",
    roomName: jam.whereby_room_name ?? "",
    createdAt: ms(jam.created_at)!,
    startedAt: ms(jam.started_at) ?? undefined,
    participants: participantList,
    summary: summary[0]
      ? {
          decisions: (summary[0].decisions as string[]) ?? [],
          openQuestions: (summary[0].open_questions as string[]) ?? [],
          differences: (summary[0].differences as string[]) ?? [],
        }
      : undefined,
    reflections: reflectionList,
    perspectives: perspectiveList.length ? perspectiveList : undefined,
    round,
    votes: voteList,
    refineContext: refine.map((r) => r.reason as string),
    outcome: outcomeVal,
    options: optionList.length ? optionList : undefined,
    dotVotes,
    decision: decisionVal,
  };
}

const SESSION_TTL_SECONDS = 60 * 60 * 24;

export async function persistSession(s: StoredSession): Promise<void> {
  const round = s.round ?? 1;
  const createdAt = new Date(s.createdAt);
  const expiresAt = new Date(s.createdAt + SESSION_TTL_SECONDS * 1000);

  await sql.begin(async (tx) => {
    await tx`
      insert into jams (id, title, status, whereby_room_url, whereby_host_room_url,
                        whereby_room_name, started_at, current_round, created_at, expires_at)
      values (${s.id}, ${s.topic}, ${jamStatus(s)}, ${s.roomUrl}, ${s.hostRoomUrl},
              ${s.roomName.replace(/^\/+|\/+$/g, "")}, ${s.startedAt ? new Date(s.startedAt) : null}, ${round},
              ${createdAt}, ${expiresAt})
      on conflict (id) do update set
        title = excluded.title,
        status = excluded.status,
        whereby_room_url = excluded.whereby_room_url,
        whereby_host_room_url = excluded.whereby_host_room_url,
        whereby_room_name = excluded.whereby_room_name,
        started_at = excluded.started_at,
        current_round = excluded.current_round`;

    // Replace all child rows for a clean, simple write (data per jam is small).
    await tx`delete from jam_decisions where jam_id = ${s.id}`;
    await tx`delete from dot_allocations where jam_id = ${s.id}`;
    await tx`delete from jam_options where jam_id = ${s.id}`;
    await tx`delete from outcomes where jam_id = ${s.id}`;
    await tx`delete from votes where jam_id = ${s.id}`;
    await tx`delete from reflections where jam_id = ${s.id}`;
    await tx`delete from refine_context where jam_id = ${s.id}`;
    await tx`delete from jam_summaries where jam_id = ${s.id}`;
    await tx`delete from jam_files where jam_id = ${s.id}`;
    await tx`delete from perspectives where jam_id = ${s.id}`;
    await tx`delete from jam_participants where jam_id = ${s.id}`;

    for (const [i, p] of s.participants.entries()) {
      await tx`insert into jam_participants (id, jam_id, name, color, is_host, joined_at)
               values (${p.id}, ${s.id}, ${p.name}, ${p.bg}, ${i === 0}, ${new Date(p.joinedAt)})`;
    }
    for (const name of s.files ?? []) {
      await tx`insert into jam_files (jam_id, name) values (${s.id}, ${name})`;
    }
    for (const r of s.reflections ?? []) {
      await tx`insert into reflections (jam_id, participant_id, round, text, passed, submitted_at)
               values (${s.id}, ${r.participantId}, ${round}, ${r.text}, ${r.passed}, ${new Date(r.submittedAt)})`;
    }
    for (const [i, p] of (s.perspectives ?? []).entries()) {
      await tx`insert into perspectives (jam_id, round, slot, label, title, body, attribution)
               values (${s.id}, ${round}, ${i === 0 ? "A" : "B"}, ${p.label}, ${p.title}, ${p.body}, ${p.attribution})`;
    }
    for (const v of s.votes ?? []) {
      await tx`insert into votes (jam_id, participant_id, round, choice, reason, voted_at)
               values (${s.id}, ${v.participantId}, ${v.round}, ${v.choice}, ${v.reason ?? null}, ${new Date(v.votedAt)})`;
    }
    for (const reason of s.refineContext ?? []) {
      await tx`insert into refine_context (jam_id, from_round, reason) values (${s.id}, ${round}, ${reason})`;
    }
    if (s.summary) {
      await tx`insert into jam_summaries (jam_id, round, decisions, open_questions, differences)
               values (${s.id}, ${null}, ${s.summary.decisions}, ${s.summary.openQuestions}, ${s.summary.differences})`;
    }
    if (s.outcome) {
      await tx`
        insert into outcomes (jam_id, round, choice, perspective_id)
        values (${s.id}, ${s.outcome.round}, ${s.outcome.choice},
          (select id from perspectives where jam_id = ${s.id} and round = ${s.outcome.round}
                and slot = ${s.outcome.choice} limit 1))`;
    }
    // Dot voting: options for the round, every participant's allocations, and
    // the decision if resolved. (option_id is text — may be the 'refine' sentinel.)
    for (const [i, o] of (s.options ?? []).entries()) {
      await tx`insert into jam_options (id, jam_id, round, title, body, attribution, author_id, position)
               values (${o.id}, ${s.id}, ${round}, ${o.title}, ${o.body}, ${o.attribution}, ${o.authorId ?? null}, ${i})`;
    }
    for (const d of s.dotVotes ?? []) {
      await tx`insert into dot_allocations (jam_id, participant_id, round, option_id, dots)
               values (${s.id}, ${d.participantId}, ${d.round}, ${d.optionId}, ${d.dots})`;
    }
    if (s.decision) {
      await tx`insert into jam_decisions (jam_id, round, option_id)
               values (${s.id}, ${s.decision.round}, ${s.decision.option.id})`;
    }
  });
}

// Fast path for a brand-new room. A fresh jam has no child rows yet, so
// persistSession's delete-everything-then-reinsert is pure overhead — and
// through the transaction-mode pooler (which can't pipeline) every extra
// statement is another ~190ms round-trip. This does the whole insert (jam +
// host + any attached files) in a single statement / single round-trip via
// data-modifying CTEs. Mirrors the jams/jam_participants/jam_files columns in
// persistSession — keep them in sync if the schema changes.
export async function insertNewSession(s: StoredSession): Promise<void> {
  const createdAt = new Date(s.createdAt);
  const expiresAt = new Date(s.createdAt + SESSION_TTL_SECONDS * 1000);
  const [host] = s.participants;
  if (!host) throw new Error("insertNewSession requires a host participant");
  const files = s.files ?? [];
  await sql`
    with j as (
      insert into jams (id, title, status, whereby_room_url, whereby_host_room_url,
                        whereby_room_name, current_round, created_at, expires_at)
      values (${s.id}, ${s.topic}, ${jamStatus(s)}, ${s.roomUrl}, ${s.hostRoomUrl},
              ${s.roomName.replace(/^\/+|\/+$/g, "")}, ${s.round ?? 1}, ${createdAt}, ${expiresAt})
      returning id
    ),
    p as (
      insert into jam_participants (id, jam_id, name, color, is_host, joined_at)
      select ${host.id}, j.id, ${host.name}, ${host.bg}, true, ${new Date(host.joinedAt)} from j
    )
    insert into jam_files (jam_id, name)
    select j.id, f from j, unnest(${files}::text[]) as f`;
}

// Atomic single-row write for one participant's reflection in a round. Avoids
// the lost-update race of read-modify-writing the whole session blob when two
// people submit at the same time — two participants are two distinct rows.
// Re-submitting replaces only that participant's own row.
export async function insertReflection(
  jamId: string,
  round: number,
  reflection: {
    participantId: string;
    text: string;
    passed: boolean;
    // Up to three takes per person, each with a refine flag. Optional so the
    // legacy single-text path still works; reflections.text above stays the
    // joined backward-compat copy that synthesis reads.
    ideas?: { text: string; refine: boolean }[];
  }
): Promise<void> {
  const now = new Date();
  const ideas = (reflection.ideas ?? []).slice(0, 3);
  await sql.begin(async (tx) => {
    await tx`delete from reflections
             where jam_id = ${jamId}
               and participant_id = ${reflection.participantId}
               and round = ${round}`;
    await tx`insert into reflections (jam_id, participant_id, round, text, passed, submitted_at)
             values (${jamId}, ${reflection.participantId}, ${round}, ${reflection.text}, ${reflection.passed}, ${now})`;
    await tx`delete from reflection_ideas
             where jam_id = ${jamId}
               and participant_id = ${reflection.participantId}
               and round = ${round}`;
    for (let idx = 0; idx < ideas.length; idx++) {
      const idea = ideas[idx];
      if (!idea.text.trim()) continue;
      await tx`insert into reflection_ideas (jam_id, participant_id, round, idx, text, refine, submitted_at)
               values (${jamId}, ${reflection.participantId}, ${round}, ${idx}, ${idea.text}, ${idea.refine}, ${now})`;
    }
  });
}

// Load this round's individual ideas (the 3-takes-per-person rows) for bucketing
// into option cards. Ordered by participant then slot for stable output.
export async function loadReflectionIdeas(
  jamId: string,
  round: number
): Promise<{ participantId: string; text: string; refine: boolean }[]> {
  const rows = await sql`
    select participant_id, text, refine
    from reflection_ideas
    where jam_id = ${jamId} and round = ${round}
    order by participant_id, idx`;
  return rows.map((r) => ({
    participantId: r.participant_id as string,
    text: r.text as string,
    refine: r.refine as boolean,
  }));
}

// Atomically add one participant — a single INSERT, so concurrent joins can't
// clobber each other the way a read-whole-session / rewrite-whole-session does.
// Caller invalidates the Redis cache afterward so the next read reloads the
// full roster from Postgres.
export async function insertParticipant(
  jamId: string,
  p: Participant,
  isHost: boolean
): Promise<void> {
  await sql`insert into jam_participants (id, jam_id, name, color, is_host, joined_at)
            values (${p.id}, ${jamId}, ${p.name}, ${p.bg}, ${isHost}, ${new Date(p.joinedAt)})
            on conflict (id) do nothing`;
}

// Atomically upsert one participant's vote for a round (same shape as
// insertReflection — one row per participant per round).
export async function insertVote(
  jamId: string,
  round: number,
  vote: { participantId: string; choice: VoteChoice; reason?: string }
): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`delete from votes
             where jam_id = ${jamId}
               and participant_id = ${vote.participantId}
               and round = ${round}`;
    await tx`insert into votes (jam_id, participant_id, round, choice, reason, voted_at)
             values (${jamId}, ${vote.participantId}, ${round}, ${vote.choice}, ${vote.reason ?? null}, ${new Date()})`;
  });
}

// Idempotently stamp the room as started (first writer wins), atomically.
// Returns the canonical startedAt in epoch ms.
export async function setStartedAt(jamId: string): Promise<number | null> {
  const rows = await sql<{ started_at: Date | null }[]>`
    update jams set started_at = coalesce(started_at, now()), status = 'active'
     where id = ${jamId}
    returning started_at`;
  return rows[0] ? ms(rows[0].started_at) ?? null : null;
}

// Retry a transient DB op a few times. The Sydney pooler can't pipeline and
// drops idle connections, so a write occasionally fails on a cold/closed
// connection or a momentary timeout — exactly the flaky "Failed (500)" the dot
// vote was hitting. Only wrap operations that are safe to re-run (idempotent),
// since a retried attempt may run after a partial-but-rolled-back first try.
async function withDbRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 120 * (i + 1)));
      }
    }
  }
  throw lastErr;
}

// Atomically replace one participant's dot allocations for a round (like
// insertVote). Caller invalidates the cache afterward.
//
// The whole transaction is delete-then-(bulk)insert of this participant's full
// allocation, so it's idempotent — safe to retry on a transient pooler failure
// (sql.begin rolls back a failed attempt, so a retry starts clean). The inserts
// are collapsed into ONE multi-row statement to minimize round-trips through the
// non-pipelining pooler, which is where the intermittent 500s came from.
export async function setDotAllocations(
  jamId: string,
  round: number,
  participantId: string,
  allocations: { optionId: string; dots: number }[]
): Promise<void> {
  await withDbRetry(() =>
    sql.begin(async (tx) => {
      await tx`delete from dot_allocations
               where jam_id = ${jamId} and participant_id = ${participantId} and round = ${round}`;
      if (allocations.length) {
        const rows = allocations.map((a) => ({
          jam_id: jamId,
          participant_id: participantId,
          round,
          option_id: a.optionId,
          dots: a.dots,
        }));
        await tx`insert into dot_allocations ${tx(
          rows,
          "jam_id",
          "participant_id",
          "round",
          "option_id",
          "dots"
        )}`;
      }
    })
  );
}

// Insert the round's option cards once. Idempotent: skips if any already exist
// for the round (a concurrent generation can't double-insert).
export async function insertOptions(
  jamId: string,
  round: number,
  options: JamOption[]
): Promise<void> {
  await sql.begin(async (tx) => {
    const existing = await tx`select 1 from jam_options where jam_id = ${jamId} and round = ${round} limit 1`;
    if (existing.length) return;
    for (const [i, o] of options.entries()) {
      await tx`insert into jam_options (id, jam_id, round, title, body, attribution, author_id, position)
               values (${o.id}, ${jamId}, ${round}, ${o.title}, ${o.body}, ${o.attribution}, ${o.authorId ?? null}, ${i})`;
    }
  });
}

// Record the winning option for a round (idempotent upsert).
export async function setDecision(
  jamId: string,
  round: number,
  optionId: string
): Promise<void> {
  await sql`insert into jam_decisions (jam_id, round, option_id)
            values (${jamId}, ${round}, ${optionId})
            on conflict (jam_id, round) do update set option_id = excluded.option_id`;
}

// Refine: advance the round and clear this round's dots, the options, and the
// reflections — all atomically so a concurrent read can't see a half-reset jam.
export async function refineRound(jamId: string, fromRound: number): Promise<number> {
  const next = fromRound + 1;
  await sql.begin(async (tx) => {
    await tx`update jams set current_round = ${next}, status = 'active' where id = ${jamId}`;
    await tx`delete from dot_allocations where jam_id = ${jamId} and round = ${fromRound}`;
    await tx`delete from jam_options where jam_id = ${jamId}`;
    await tx`delete from reflections where jam_id = ${jamId}`;
    await tx`delete from reflection_ideas where jam_id = ${jamId}`;
  });
  return next;
}

// Diamond 1 → diamond 2: the round-1 dot vote narrows to the top-3 ideas. Bump
// the round (concurrency-guarded), clear the round's working state, and carry the
// 3 ideas forward as refine_context so the second round's reflection + synthesis
// build on them. Returns the new round, or null if another client already
// advanced. Mirrors refineRound's resets.
export async function narrowToRound2(
  jamId: string,
  fromRound: number,
  ideas: string[]
): Promise<number | null> {
  const next = fromRound + 1;
  let bumped = false;
  await sql.begin(async (tx) => {
    const res = await tx`update jams set current_round = ${next}, status = 'active'
                         where id = ${jamId} and current_round = ${fromRound}`;
    if (res.count === 0) return; // another client already narrowed
    bumped = true;
    await tx`delete from dot_allocations where jam_id = ${jamId} and round = ${fromRound}`;
    await tx`delete from jam_options where jam_id = ${jamId}`;
    await tx`delete from reflections where jam_id = ${jamId}`;
    await tx`delete from reflection_ideas where jam_id = ${jamId}`;
    for (const reason of ideas) {
      await tx`insert into refine_context (jam_id, from_round, reason)
               values (${jamId}, ${fromRound}, ${reason})`;
    }
  });
  return bumped ? next : null;
}

// Concurrency-safe refine used by the reflection-phase trigger: many clients may
// hit the reflection->vote transition at once, so the round bump is conditional
// on the round not already having moved (only one caller wins). Returns true if
// THIS call advanced the round. Mirrors refineRound's resets.
export async function tryRefineRound(
  jamId: string,
  fromRound: number
): Promise<boolean> {
  let bumped = false;
  await sql.begin(async (tx) => {
    const res = await tx`update jams set current_round = ${fromRound + 1}, status = 'active'
                         where id = ${jamId} and current_round = ${fromRound}`;
    if (res.count === 0) return; // someone else already advanced this round
    bumped = true;
    await tx`delete from dot_allocations where jam_id = ${jamId} and round = ${fromRound}`;
    await tx`delete from jam_options where jam_id = ${jamId}`;
    await tx`delete from reflections where jam_id = ${jamId}`;
    await tx`delete from reflection_ideas where jam_id = ${jamId}`;
  });
  return bumped;
}

// Reverse lookup for the Whereby webhook (replaces the Redis room:* index).
export async function sessionIdByRoomName(roomName: string): Promise<string | null> {
  const rows = await sql<{ id: string }[]>`
    select id from jams where whereby_room_name = ${roomName} limit 1`;
  return rows[0]?.id ?? null;
}
