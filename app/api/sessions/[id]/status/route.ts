import { NextResponse } from "next/server";
import { currentRound, getSession } from "@/lib/sessions";

// Gate between Self Reflection and Vote: how many people have weighed in (passes count).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const total = session.participants.length;
  const reflections = session.reflections ?? [];
  return NextResponse.json({
    submitted: reflections.length,
    total,
    allSubmitted: total > 0 && reflections.length >= total,
    submittedIds: reflections.map((r) => r.participantId),
    // Once options exist (everyone submitted, or the host forced "Start vote
    // anyway"), every reflection client should advance to the vote — this is
    // the shared signal that moves the whole room, not just the host.
    optionsReady: (session.options?.length ?? 0) > 0,
    round: currentRound(session),
    startedAt: session.startedAt ?? null,
    timer: session.timer ?? null,
  });
}
