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
    round: currentRound(session),
    startedAt: session.startedAt ?? null,
    timer: session.timer ?? null,
  });
}
