import { NextResponse } from "next/server";
import { ensureOptions } from "@/lib/sessions";

// Turn this round's reflections into dot-vote option cards. Idempotent.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
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
