import { NextResponse } from "next/server";
import {
  currentRound,
  ensureOptions,
  ensurePerspectives,
  getSession,
} from "@/lib/sessions";

// Diamond 1 → dot-vote option cards; diamond 2 (round >= 2) → A/B perspectives.
// Idempotent.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await getSession(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (currentRound(session) >= 2) {
      const perspectives = await ensurePerspectives(id);
      if (!perspectives || perspectives.length === 0) {
        return NextResponse.json(
          { error: "No reflections to turn into perspectives yet" },
          { status: 409 }
        );
      }
      return NextResponse.json({ perspectives });
    }
    const options = await ensureOptions(id);
    if (options === null) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (options.length === 0) {
      return NextResponse.json(
        { error: "No reflections to turn into options yet" },
        { status: 409 }
      );
    }
    return NextResponse.json({ options });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to build options", detail: msg },
      { status: 500 }
    );
  }
}
