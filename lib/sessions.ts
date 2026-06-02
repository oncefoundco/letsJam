import { after } from "next/server";
import { kv } from "@vercel/kv";
import { AVATAR_COLORS } from "./avatar";
import { DEFAULT_PHASE_MS, type PhaseTimer, type TimerPhase } from "./timer";
import {
  DOTS_PER_PARTICIPANT,
  REFINE_OPTION_ID,
  type DotAllocation,
  type DotResolution,
  type JamOption,
} from "./voting";
import {
  insertNewSession,
  insertOptions,
  insertParticipant,
  insertReflection,
  insertVote,
  loadReflectionIdeas,
  loadSession,
  persistSession,
  refineRound,
  sessionIdByRoomName,
  setDecision,
  setDotAllocations,
  setStartedAt,
} from "./sessionStore";

// Sessions live in Upstash Redis (via @vercel/kv).
// 24h TTL matches the Whereby room's endDate so storage and the call expire together.

const SESSION_TTL_SECONDS = 60 * 60 * 24;

// Cap on how many people can be in a single jam, including the host. Enforced
// on join (see the participants route). Kept small while we validate the format.
export const MAX_PARTICIPANTS = 6;

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

// Dot voting (Develop → Deliver). Constants/types live in the client-safe
// lib/voting.ts; re-exported here so server code can keep importing from
// "@/lib/sessions".
export { DOTS_PER_PARTICIPANT, REFINE_OPTION_ID };
export type { JamOption, DotAllocation, DotResolution };

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
  // Live phase countdown. Cached in Redis only (not persisted to Postgres);
  // fine for a short-lived timer. See lib/timer.ts.
  timer?: PhaseTimer;
  // Dot-voting state (Redis-only for now, like timer). `decision` is the chosen
  // option once the dot vote resolves — see lib/timer.ts note on persistence.
  options?: JamOption[];
  dotVotes?: DotAllocation[];
  decision?: { round: number; option: JamOption };
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
  // Redis index first (fast); fall back to the durable jams.whereby_room_name.
  const cached = await kv.get<string>(roomKey(roomName));
  if (cached) return cached;
  return sessionIdByRoomName(normalizeRoomName(roomName));
}

// Supabase (Postgres) is the durable source of truth; Redis is a cache-aside
// layer so hot reads stay fast. Writes go to Postgres first, then refresh the
// cache. If the Postgres write fails we surface the error rather than leaving
// the cache ahead of the source of truth.
export async function saveSession(session: StoredSession): Promise<void> {
  // Redis is the read source of truth — write it synchronously so the response
  // and the next read reflect the change immediately.
  await kv.set(sessionKey(session.id), session, { ex: SESSION_TTL_SECONDS });
  // Durably persist to Postgres in the background. persistSession is ~20
  // sequential round-trips to the Sydney pooler (~5s); awaiting it made every
  // state-changing click block that long. Redis stays authoritative for reads,
  // so a brief Postgres lag is harmless for these ephemeral jams.
  schedulePersist(session);
}

// Run persistSession after the response so the click returns at Redis speed.
// after() keeps the serverless function alive until it finishes; outside a
// request scope (scripts/tests) we just run it detached.
function schedulePersist(session: StoredSession): void {
  const run = () =>
    persistSession(session).catch((err) => {
      console.error(`Background persistSession failed for ${session.id}:`, err);
    });
  try {
    after(run);
  } catch {
    void run();
  }
}

// Fast path for a brand-new room: a single-statement insert (see
// insertNewSession) instead of the general delete-and-reinsert persistSession,
// then prime the cache. Use only when the session is known not to exist yet.
export async function createSession(session: StoredSession): Promise<void> {
  await insertNewSession(session);
  await kv.set(sessionKey(session.id), session, { ex: SESSION_TTL_SECONDS });
}

// Write only the Redis cache, skipping persistSession. For state that lives
// solely in the session blob with no Postgres columns yet — dot votes (and the
// phase timer). persistSession would spend ~4s rewriting every child table on
// the Sydney pooler without even storing this data, so it's pure overhead here.
async function cacheSession(session: StoredSession): Promise<void> {
  await kv.set(sessionKey(session.id), session, { ex: SESSION_TTL_SECONDS });
}

export async function getSession(
  id: string
): Promise<StoredSession | undefined> {
  const cached = await kv.get<StoredSession>(sessionKey(id));
  if (cached) return cached;
  // Cache miss — load from the source of truth and backfill the cache.
  const session = await loadSession(id);
  if (!session) return undefined;
  await kv.set(sessionKey(id), session, { ex: SESSION_TTL_SECONDS });
  return session;
}

// Build the host participant for a brand-new room. Equivalent to addParticipant
// on an empty session, but pure (no IO) so the create path can persist the host
// in the same write as the room itself — saving a full read-modify-write round
// trip to Postgres + Redis. On an empty room the color logic is trivial: honor
// the requested color, else take the first palette color.
export function makeHostParticipant(name: string, color?: string): Participant {
  return {
    id: crypto.randomUUID(),
    name,
    bg: color || AVATAR_COLORS[0],
    joinedAt: Date.now(),
  };
}

// `color` lets a signed-in user carry their chosen profile color; otherwise we
// fall back to the rotating palette so guests still get distinct avatars. The
// color/cap checks read the cached roster (best-effort — a near-simultaneous
// join could still pick a dup color), but the write itself is a single atomic
// INSERT so concurrent joins never clobber each other out of the session.
export async function addParticipant(
  sessionId: string,
  name: string,
  color?: string
): Promise<Participant | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  // Keep avatars distinct: honor the requested color only if no one else has it
  // (the picker hides taken colors, but two near-simultaneous joins could still
  // request the same one). Otherwise fall back to the first free palette color.
  const used = new Set(session.participants.map((p) => p.bg));
  const bg =
    color && !used.has(color)
      ? color
      : AVATAR_COLORS.find((c) => !used.has(c)) ??
        AVATAR_COLORS[session.participants.length % AVATAR_COLORS.length];
  const participant: Participant = {
    id: crypto.randomUUID(),
    name,
    bg,
    joinedAt: Date.now(),
  };
  // The host is inserted at room creation, so anyone arriving here is a guest.
  // Atomic INSERT + cache drop (mirrors saveReflection): the next read rebuilds
  // the full roster from Postgres, so concurrent joins all survive.
  await insertParticipant(sessionId, participant, false);
  await kv.del(sessionKey(sessionId));
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

// ── Phase timer ──────────────────────────────────────────────────────────────
// Host-only enforcement lives in the timer route; these just read-modify-write.

// Start the countdown for a phase. Idempotent: if a non-ended timer for this
// phase already runs, leave it be so re-mounts don't reset the clock.
export async function ensurePhaseTimer(
  sessionId: string,
  phase: TimerPhase,
  durationMs: number = DEFAULT_PHASE_MS
): Promise<PhaseTimer | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  const current = session.timer;
  if (current && current.phase === phase && current.endedAt == null) {
    return current;
  }
  const timer: PhaseTimer = {
    phase,
    startedAt: Date.now(),
    durationMs,
    pausedAt: null,
    pausedAccumMs: 0,
    endedAt: null,
  };
  session.timer = timer;
  await saveSession(session);
  return timer;
}

export async function pausePhaseTimer(
  sessionId: string
): Promise<PhaseTimer | null> {
  const session = await getSession(sessionId);
  if (!session?.timer) return null;
  const t = session.timer;
  if (t.endedAt == null && t.pausedAt == null) {
    t.pausedAt = Date.now();
    await saveSession(session);
  }
  return t;
}

export async function resumePhaseTimer(
  sessionId: string
): Promise<PhaseTimer | null> {
  const session = await getSession(sessionId);
  if (!session?.timer) return null;
  const t = session.timer;
  if (t.endedAt == null && t.pausedAt != null) {
    t.pausedAccumMs += Date.now() - t.pausedAt;
    t.pausedAt = null;
    await saveSession(session);
  }
  return t;
}

export async function stopPhaseTimer(
  sessionId: string
): Promise<PhaseTimer | null> {
  const session = await getSession(sessionId);
  if (!session?.timer) return null;
  const t = session.timer;
  if (t.endedAt == null) {
    t.endedAt = Date.now();
    await saveSession(session);
  }
  return t;
}

// Upsert a participant's reflection — re-submitting replaces the prior one.
// Writes a single row to Postgres (the source of truth) and invalidates the
// Redis cache, instead of read-modify-writing the whole session blob. This is
// concurrency-safe: two people submitting at once write two distinct rows
// rather than clobbering each other's copy of the session.
export async function saveReflection(
  sessionId: string,
  reflection: {
    participantId: string;
    text: string;
    passed: boolean;
    ideas?: { text: string; refine: boolean }[];
  }
): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session) return false;
  const known = session.participants.some(
    (p) => p.id === reflection.participantId
  );
  if (!known) return false;
  await insertReflection(sessionId, currentRound(session), reflection);
  // Drop the stale cache so the next read reloads from Postgres with every
  // reflection present (including any submitted concurrently).
  await kv.del(sessionKey(sessionId));
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
  // Atomic, idempotent stamp (coalesce keeps the first writer's time) + cache
  // drop, so a concurrent join/vote can't roll the start back by saving a stale
  // blob. The next read reloads startedAt from Postgres.
  const startedAt = (await setStartedAt(sessionId)) ?? session.startedAt ?? Date.now();
  await kv.del(sessionKey(sessionId));
  return { ok: true, startedAt };
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
  // Atomic upsert + cache drop (like saveReflection) so concurrent votes don't
  // clobber each other; the next read reloads all votes from Postgres.
  await insertVote(sessionId, round, {
    participantId: vote.participantId,
    choice: vote.choice,
    reason: vote.reason?.trim() || undefined,
  });
  await kv.del(sessionKey(sessionId));
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

// ── Dot voting ───────────────────────────────────────────────────────────────

// Turn this round's ideas into option cards by bucketing aligned ideas across
// people. Idempotent: returns existing options if already generated. Empty array
// if nobody has written yet.
export async function ensureOptions(sessionId: string): Promise<JamOption[] | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  if (session.options && session.options.length > 0) return session.options;

  // Prefer the per-idea rows (3-takes-per-person); each idea is one clustering
  // entry so the AI buckets aligned ideas across people. Fall back to the joined
  // per-person reflection text for sessions created before the 3-ideas change.
  const round = currentRound(session);
  const ideaRows = await loadReflectionIdeas(sessionId, round);
  const nameById = new Map(session.participants.map((p) => [p.id, p.name]));
  const entries = ideaRows.length
    ? ideaRows
        .filter((i) => i.text.trim().length > 0)
        .map((i) => ({ name: nameById.get(i.participantId) ?? "Someone", text: i.text }))
    : (session.reflections ?? [])
        .filter((r) => !r.passed && r.text.trim().length > 0)
        .map((r) => ({ name: r.name, text: r.text }));
  if (entries.length === 0) return [];
  const { proposeOptions } = await import("./cluster");
  const proposed = await proposeOptions(
    session.topic,
    entries,
    session.summary,
    session.refineContext
  );
  const options: JamOption[] = proposed.map((o) => ({
    id: crypto.randomUUID(),
    ...o,
  }));
  // Persist atomically (idempotent — skips if a concurrent call already wrote
  // them) and drop the cache so the next read reloads them from Postgres.
  await insertOptions(sessionId, currentRound(session), options);
  await kv.del(sessionKey(sessionId));
  return options;
}

// Replace a participant's dot allocation for the current round. Total dots must
// not exceed DOTS_PER_PARTICIPANT.
export async function setDotAllocation(
  sessionId: string,
  participantId: string,
  allocations: { optionId: string; dots: number }[]
): Promise<"ok" | "no-session" | "unknown-participant" | "too-many"> {
  const session = await getSession(sessionId);
  if (!session) return "no-session";
  if (!session.participants.find((p) => p.id === participantId)) {
    return "unknown-participant";
  }
  const round = currentRound(session);
  const valid = allocations
    .map((a) => ({ optionId: a.optionId, dots: Math.max(0, Math.floor(a.dots)) }))
    .filter(
      (a) =>
        a.dots > 0 &&
        (a.optionId === REFINE_OPTION_ID ||
          (session.options ?? []).some((o) => o.id === a.optionId))
    );
  const total = valid.reduce((sum, a) => sum + a.dots, 0);
  if (total > DOTS_PER_PARTICIPANT) return "too-many";

  // Atomic per-participant write + cache drop (like insertVote): concurrent
  // allocations can't clobber each other, and the next read reloads all dots
  // from Postgres.
  await setDotAllocations(sessionId, round, participantId, valid);
  await kv.del(sessionKey(sessionId));
  return "ok";
}

export function tallyDots(session: StoredSession): Record<string, number> {
  const round = currentRound(session);
  const tally: Record<string, number> = {};
  for (const d of session.dotVotes ?? []) {
    if (d.round === round) tally[d.optionId] = (tally[d.optionId] ?? 0) + d.dots;
  }
  return tally;
}

// Colors of the dots cast on each option, for the per-voter colored dots in the
// UI (one entry per dot, in the participant's avatar color).
export function dotColorsByOption(
  session: StoredSession
): Record<string, string[]> {
  const round = currentRound(session);
  const colorById = new Map(session.participants.map((p) => [p.id, p.bg]));
  const out: Record<string, string[]> = {};
  for (const d of session.dotVotes ?? []) {
    if (d.round !== round) continue;
    const color = colorById.get(d.participantId) ?? "#cccccc";
    (out[d.optionId] ??= []).push(...Array(d.dots).fill(color));
  }
  return out;
}

// Participants who have spent all their dots this round (i.e. they're "in").
export function dotVotersDone(session: StoredSession): string[] {
  const round = currentRound(session);
  const byParticipant = new Map<string, number>();
  for (const d of session.dotVotes ?? []) {
    if (d.round === round) {
      byParticipant.set(d.participantId, (byParticipant.get(d.participantId) ?? 0) + d.dots);
    }
  }
  return [...byParticipant.entries()]
    .filter(([, total]) => total >= DOTS_PER_PARTICIPANT)
    .map(([id]) => id);
}

// Resolve the dot vote. Winner = option with the most dots → decided. If the
// refine card wins, or the top is a tie with no clear winner, loop the round.
export async function resolveDots(
  sessionId: string,
  { force = false }: { force?: boolean } = {}
): Promise<DotResolution | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  const round = currentRound(session);

  if (session.decision && session.decision.round === round) {
    return { resolution: "decided", round, option: session.decision.option };
  }

  const total = session.participants.length;
  const done = dotVotersDone(session);
  const allIn = total > 0 && done.length >= total;
  if (!allIn && !force) return { resolution: "pending", round };

  const tally = tallyDots(session);
  const entries = Object.entries(tally).filter(([, d]) => d > 0);
  if (entries.length === 0) return { resolution: "pending", round };
  entries.sort((a, b) => b[1] - a[1]);
  const [topId, topDots] = entries[0];
  const topTie = entries.filter(([, d]) => d === topDots).length > 1;

  // Refine when the refine card leads, or the top real options deadlock.
  if (topId === REFINE_OPTION_ID || topTie) {
    // Atomic round advance (clears this round's dots, options, reflections).
    const next = await refineRound(sessionId, round);
    await kv.del(sessionKey(sessionId));
    return { resolution: "refining", round: next };
  }

  const winner = (session.options ?? []).find((o) => o.id === topId);
  if (!winner) return { resolution: "pending", round };
  await setDecision(sessionId, round, winner.id);
  await kv.del(sessionKey(sessionId));
  return { resolution: "decided", round, option: winner };
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
