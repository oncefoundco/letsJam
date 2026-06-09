import { NextResponse } from "next/server";
import {
  currentRound,
  dotColorsByOption,
  dotVotersDone,
  loadVoteStatus,
  recordVote,
  setDotAllocation,
  tallyDots,
  votesThisRound,
  DOTS_PER_PARTICIPANT,
} from "@/lib/sessions";

// Status of the current dot-voting round.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Source-of-truth read: this is the poll that gates dot sync (everyone's dots
  // + tally) and allIn. The cache-aside blob can be poisoned stale by a
  // concurrent poll's backfill landing after a writer's invalidation, which
  // wedges the round (dots never appear, allIn never flips). See loadVoteStatus.
  const session = await loadVoteStatus(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const round = currentRound(session);
  const total = session.participants.length;

  // Diamond 2 (round >= 2): A/B vote status, matching VotePanel's contract.
  if (round >= 2) {
    const votes = votesThisRound(session);
    const tally = { A: 0, B: 0, refine: 0 };
    for (const v of votes) tally[v.choice] += 1;
    return NextResponse.json({
      round,
      total,
      voted: votes.length,
      allVoted: total > 0 && votes.length >= total,
      tally,
      voterIds: votes.map((v) => v.participantId),
      outcome:
        session.outcome && session.outcome.round === round
          ? session.outcome
          : null,
    });
  }

  const done = dotVotersDone(session);
  const pid = new URL(req.url).searchParams.get("pid");
  const mine = pid
    ? (session.dotVotes ?? [])
        .filter((d) => d.round === round && d.participantId === pid)
        .map((d) => ({ optionId: d.optionId, dots: d.dots }))
    : [];

  return NextResponse.json({
    round,
    total,
    done: done.length,
    allIn: total > 0 && done.length >= total,
    tally: tallyDots(session),
    dotsByOption: dotColorsByOption(session),
    dotsPerParticipant: DOTS_PER_PARTICIPANT,
    decided:
      session.decision && session.decision.round === round
        ? session.decision
        : null,
    mine,
  });
}

// Set (or change) this participant's dot allocation for the current round.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: {
    participantId?: unknown;
    allocations?: unknown;
    choice?: unknown;
    reason?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const participantId =
    typeof body.participantId === "string" ? body.participantId : "";
  if (!participantId) {
    return NextResponse.json(
      { error: "participantId is required" },
      { status: 400 }
    );
  }

  // Diamond 2 (round >= 2): A/B/Refine vote rather than a dot allocation.
  if (typeof body.choice === "string") {
    const choice = body.choice;
    if (choice !== "A" && choice !== "B" && choice !== "refine") {
      return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
    }
    const reason = typeof body.reason === "string" ? body.reason : undefined;
    const r = await recordVote(id, { participantId, choice, reason });
    if (r === "no-session") {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (r === "unknown-participant") {
      return NextResponse.json({ error: "Unknown participant" }, { status: 403 });
    }
    return NextResponse.json({ ok: true });
  }

  const allocations = Array.isArray(body.allocations)
    ? body.allocations
        .filter(
          (a): a is { optionId: string; dots: number } =>
            !!a &&
            typeof a.optionId === "string" &&
            typeof a.dots === "number"
        )
        .map((a) => ({ optionId: a.optionId, dots: a.dots }))
    : [];

  const result = await setDotAllocation(id, participantId, allocations);
  if (result === "no-session") {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (result === "unknown-participant") {
    return NextResponse.json({ error: "Unknown participant" }, { status: 403 });
  }
  if (result === "too-many") {
    return NextResponse.json(
      { error: `You only have ${DOTS_PER_PARTICIPANT} dots` },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
