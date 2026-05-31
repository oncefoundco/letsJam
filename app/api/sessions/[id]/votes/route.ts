import { NextResponse } from "next/server";
import {
  currentRound,
  dotColorsByOption,
  dotVotersDone,
  getSession,
  setDotAllocation,
  tallyDots,
  DOTS_PER_PARTICIPANT,
} from "@/lib/sessions";

// Status of the current dot-voting round.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const round = currentRound(session);
  const total = session.participants.length;
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

  let body: { participantId?: unknown; allocations?: unknown };
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
