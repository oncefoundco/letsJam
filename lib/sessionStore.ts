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
  const [participants, files, reflections, perspectives, votes, refine, outcome, summary] =
    await Promise.all([
      sql`select id, name, color, joined_at from jam_participants where jam_id = ${id} order by joined_at asc`,
      sql`select name from jam_files where jam_id = ${id} order by created_at asc`,
      sql`select participant_id, text, passed, submitted_at from reflections where jam_id = ${id} and round = ${round}`,
      sql`select slot, label, title, body, attribution from perspectives where jam_id = ${id} and round = ${round} order by slot asc`,
      sql`select participant_id, choice, reason, round, voted_at from votes where jam_id = ${id} order by voted_at asc`,
      sql`select reason from refine_context where jam_id = ${id} order by created_at asc`,
      sql`select round, choice, perspective_id from outcomes where jam_id = ${id} and round = ${round}`,
      sql`select decisions, open_questions, differences from jam_summaries where jam_id = ${id} order by created_at desc limit 1`,
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
  });
}

// Atomic single-row write for one participant's reflection in a round. Avoids
// the lost-update race of read-modify-writing the whole session blob when two
// people submit at the same time — two participants are two distinct rows.
// Re-submitting replaces only that participant's own row.
export async function insertReflection(
  jamId: string,
  round: number,
  reflection: { participantId: string; text: string; passed: boolean }
): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`delete from reflections
             where jam_id = ${jamId}
               and participant_id = ${reflection.participantId}
               and round = ${round}`;
    await tx`insert into reflections (jam_id, participant_id, round, text, passed, submitted_at)
             values (${jamId}, ${reflection.participantId}, ${round}, ${reflection.text}, ${reflection.passed}, ${new Date()})`;
  });
}

// Reverse lookup for the Whereby webhook (replaces the Redis room:* index).
export async function sessionIdByRoomName(roomName: string): Promise<string | null> {
  const rows = await sql<{ id: string }[]>`
    select id from jams where whereby_room_name = ${roomName} limit 1`;
  return rows[0]?.id ?? null;
}
