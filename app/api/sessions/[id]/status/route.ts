import { NextResponse } from "next/server";
import { currentRound, getPhaseTimer, getSession } from "@/lib/sessions";

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
  // Timer lives in its own Redis key (not the session blob), so it survives the
  // cache invalidations that wiped it on the round transition. See lib/sessions.
  const timer = await getPhaseTimer(id);
  return NextResponse.json({
    submitted: reflections.length,
    total,
    allSubmitted: total > 0 && reflections.length >= total,
    submittedIds: reflections.map((r) => r.participantId),
    // Once options exist (everyone submitted, or the host forced "Start vote
    // anyway"), every reflection client should advance to the vote — this is
    // the shared signal that moves the whole room, not just the host.
    optionsReady: (session.options?.length ?? 0) > 0,
    // Diamond 2's forced start ("Start vote anyway") builds perspectives, not
    // options — without this signal, non-submitters polling the reflection page
    // never learned the vote had started and got stranded.
    perspectivesReady: (session.perspectives?.length ?? 0) > 0,
    round: currentRound(session),
    startedAt: session.startedAt ?? null,
    timer,
  });
}
