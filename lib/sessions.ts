import { kv } from "@vercel/kv";
import { AVATAR_COLORS } from "./avatar";

// Sessions live in Upstash Redis (via @vercel/kv).
// 24h TTL matches the Whereby room's endDate so storage and the call expire together.

const SESSION_TTL_SECONDS = 60 * 60 * 24;

export type Participant = {
  id: string;
  name: string;
  bg: string;
  joinedAt: number;
};

export type SessionSummary = {
  decisions: string[];
  openQuestions: string[];
  differences: string[];
};

export type Reflection = {
  participantId: string;
  name: string;
  text: string;
  passed: boolean;
  submittedAt: number;
};

export type Perspective = {
  label: string;
  title: string;
  body: string;
  attribution: string;
};

export type VoteChoice = "A" | "B" | "refine";

export type Vote = {
  participantId: string;
  name: string;
  choice: VoteChoice;
  reason?: string;
  round: number;
  votedAt: number;
};

export type Outcome = {
  round: number;
  choice: "A" | "B";
  perspective: Perspective;
};

export type StoredSession = {
  id: string;
  topic: string;
  files: string[];
  roomUrl: string;
  hostRoomUrl: string;
  roomName: string;
  createdAt: number;
  // When the host clicked "Start Session". Drives the synchronized
  // countdown shown on every client in the waiting room.
  startedAt?: number;
  participants: Participant[];
  summary?: SessionSummary;
  reflections: Reflection[];
  perspectives?: Perspective[];
  // Voting state. round starts at 1; a refine result bumps it and re-opens reflection.
  round?: number;
  votes?: Vote[];
  // Refine reasons carried forward to sharpen the next round's synthesis.
  refineContext?: string[];
  outcome?: Outcome;
};


function sessionKey(id: string) {
  return `session:${id}`;
}

function normalizeRoomName(roomName: string) {
  return roomName.replace(/^\/+|\/+$/g, "");
}

function roomKey(roomName: string) {
  return `room:${normalizeRoomName(roomName)}`;
}

// Reverse index so the Whereby webhook (which only knows roomName) can find our session.
export async function linkRoomToSession(
  roomName: string,
  sessionId: string
): Promise<void> {
  await kv.set(roomKey(roomName), sessionId, { ex: SESSION_TTL_SECONDS });
}

export async function getSessionIdByRoomName(
  roomName: string
): Promise<string | null> {
  return (await kv.get<string>(roomKey(roomName))) ?? null;
}

export async function saveSession(session: StoredSession): Promise<void> {
  await kv.set(sessionKey(session.id), session, { ex: SESSION_TTL_SECONDS });
}

export async function getSession(
  id: string
): Promise<StoredSession | undefined> {
  const session = await kv.get<StoredSession>(sessionKey(id));
  return session ?? undefined;
}

// Read-modify-write. Concurrent joins (sub-second) could lose a participant; acceptable
// for now since join rate is low. Move to RPUSH on a separate participants list if it bites.
export async function addParticipant(
  sessionId: string,
  name: string
): Promise<Participant | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  const bg =
    AVATAR_COLORS[session.participants.length % AVATAR_COLORS.length];
  const participant: Participant = {
    id: crypto.randomUUID(),
    name,
    bg,
    joinedAt: Date.now(),
  };
  session.participants.push(participant);
  await saveSession(session);
  return participant;
}

export async function setSummary(
  sessionId: string,
  summary: SessionSummary
): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session) return false;
  session.summary = summary;
  await saveSession(session);
  return true;
}

export async function setPerspectives(
  sessionId: string,
  perspectives: Perspective[]
): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session) return false;
  session.perspectives = perspectives;
  await saveSession(session);
  return true;
}

// Upsert a participant's reflection — re-submitting replaces the prior one.
export async function saveReflection(
  sessionId: string,
  reflection: { participantId: string; text: string; passed: boolean }
): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session) return false;
  const participant = session.participants.find(
    (p) => p.id === reflection.participantId
  );
  const entry: Reflection = {
    participantId: reflection.participantId,
    name: participant?.name ?? "Someone",
    text: reflection.text,
    passed: reflection.passed,
    submittedAt: Date.now(),
  };
  if (!session.reflections) session.reflections = [];
  const existing = session.reflections.findIndex(
    (r) => r.participantId === reflection.participantId
  );
  if (existing >= 0) {
    session.reflections[existing] = entry;
  } else {
    session.reflections.push(entry);
  }
  await saveSession(session);
  return true;
}

export function currentRound(session: StoredSession): number {
  return session.round ?? 1;
}

// Mark the room as started so every client's countdown anchors to the same instant.
// Idempotent — re-calling preserves the first startedAt so the countdown doesn't reset.
export async function startSession(
  sessionId: string,
  hostParticipantId: string
): Promise<{ ok: true; startedAt: number } | { ok: false; reason: "no-session" | "not-host" }> {
  const session = await getSession(sessionId);
  if (!session) return { ok: false, reason: "no-session" };
  const host = session.participants[0];
  if (!host || host.id !== hostParticipantId) {
    return { ok: false, reason: "not-host" };
  }
  if (!session.startedAt) {
    session.startedAt = Date.now();
    await saveSession(session);
  }
  return { ok: true, startedAt: session.startedAt };
}

export type Tally = { A: number; B: number; refine: number };

export function tallyVotes(session: StoredSession): Tally {
  const round = currentRound(session);
  const tally: Tally = { A: 0, B: 0, refine: 0 };
  for (const v of session.votes ?? []) {
    if (v.round === round) tally[v.choice] += 1;
  }
  return tally;
}

export function votesThisRound(session: StoredSession): Vote[] {
  const round = currentRound(session);
  return (session.votes ?? []).filter((v) => v.round === round);
}

// Upsert a participant's vote for the current round. Re-voting replaces the prior one.
export async function recordVote(
  sessionId: string,
  vote: { participantId: string; choice: VoteChoice; reason?: string }
): Promise<"ok" | "no-session" | "unknown-participant"> {
  const session = await getSession(sessionId);
  if (!session) return "no-session";
  const participant = session.participants.find(
    (p) => p.id === vote.participantId
  );
  if (!participant) return "unknown-participant";
  const round = currentRound(session);
  const entry: Vote = {
    participantId: vote.participantId,
    name: participant.name,
    choice: vote.choice,
    reason: vote.reason?.trim() || undefined,
    round,
    votedAt: Date.now(),
  };
  if (!session.votes) session.votes = [];
  const existing = session.votes.findIndex(
    (v) => v.participantId === vote.participantId && v.round === round
  );
  if (existing >= 0) {
    session.votes[existing] = entry;
  } else {
    session.votes.push(entry);
  }
  await saveSession(session);
  return "ok";
}

export type Resolution =
  | { resolution: "pending"; round: number }
  | { resolution: "decided"; round: number; outcome: Outcome }
  | { resolution: "refining"; round: number };

// Resolve the current round once everyone has voted (or the host forces it).
// Idempotent: a decided round returns the stored outcome; a refine result bumps
// the round, clears perspectives/reflections, and carries refine reasons forward.
// Read-modify-write — concurrent calls are acceptable at this scale (see addParticipant).
export async function resolveVotes(
  sessionId: string,
  { force = false }: { force?: boolean } = {}
): Promise<Resolution | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  const round = currentRound(session);

  if (session.outcome && session.outcome.round === round) {
    return { resolution: "decided", round, outcome: session.outcome };
  }

  const votes = votesThisRound(session);
  const total = session.participants.length;
  const allVoted = total > 0 && votes.length >= total;
  if (!allVoted && !force) return { resolution: "pending", round };

  const tally: Tally = { A: 0, B: 0, refine: 0 };
  for (const v of votes) tally[v.choice] += 1;

  // Refine when 2+ ask for it, or when A/B deadlock with no clear winner.
  const deadlock = tally.A === tally.B;
  if (tally.refine >= 2 || deadlock) {
    const reasons = votes
      .filter((v) => v.choice === "refine" && v.reason)
      .map((v) => `${v.name}: ${v.reason}`);
    session.round = round + 1;
    session.votes = (session.votes ?? []).filter((v) => v.round !== round);
    session.refineContext = [...(session.refineContext ?? []), ...reasons];
    session.perspectives = undefined;
    session.reflections = [];
    await saveSession(session);
    return { resolution: "refining", round: session.round };
  }

  const choice: "A" | "B" = tally.A > tally.B ? "A" : "B";
  const perspective = session.perspectives?.[choice === "A" ? 0 : 1];
  if (!perspective) return { resolution: "pending", round };
  session.outcome = { round, choice, perspective };
  await saveSession(session);
  return { resolution: "decided", round, outcome: session.outcome };
}

export async function createWherebyRoom(): Promise<{
  roomUrl: string;
  hostRoomUrl: string;
  roomName: string;
}> {
  const apiKey = process.env.WHEREBY_API_KEY;
  if (!apiKey) {
    throw new Error("WHEREBY_API_KEY env var is not set");
  }

  const endDate = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();

  const res = await fetch("https://api.whereby.dev/v1/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endDate,
      roomMode: "group",
      fields: ["hostRoomUrl"],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Whereby API error ${res.status}: ${detail}`);
  }

  const json = (await res.json()) as {
    roomUrl: string;
    hostRoomUrl: string;
    roomName?: string;
  };
  const roomName =
    json.roomName ?? new URL(json.roomUrl).pathname.replace(/^\/+/, "");
  return { roomUrl: json.roomUrl, hostRoomUrl: json.hostRoomUrl, roomName };
}
