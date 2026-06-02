import { NextResponse } from "next/server";
import { currentRound, getSession, resolveDots, resolveVotes } from "@/lib/sessions";

// Resolve the current round. Host calls this (force=true to advance early);
// the regular path only resolves once everyone has voted. Idempotent.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let force = false;
  try {
    const body = (await req.json()) as { force?: unknown };
    force = body.force === true;
  } catch {
    // empty body is fine
  }

  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  // Diamond 1 (round 1) resolves the dot vote (narrow to top 3); diamond 2
  // (round >= 2) resolves the A/B vote (winner, or repeat on >=2 Refine).
  const result =
    currentRound(session) >= 2
      ? await resolveVotes(id, { force })
      : await resolveDots(id, { force });
  if (!result) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
