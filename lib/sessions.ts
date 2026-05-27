import { kv } from "@vercel/kv";

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

export type StoredSession = {
  id: string;
  topic: string;
  files: string[];
  roomUrl: string;
  hostRoomUrl: string;
  roomName: string;
  createdAt: number;
  participants: Participant[];
  summary?: SessionSummary;
  reflections: Reflection[];
  perspectives?: Perspective[];
};

const AVATAR_COLORS = [
  "#9fd5f1",
  "#f9f6b8",
  "#d4f0da",
  "#b9caf5",
  "#ffd9fd",
  "#fed7aa",
  "#bae6fd",
  "#bbf7d0",
  "#e9d5ff",
  "#fecaca",
];

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
