import { NextResponse } from "next/server";
import { getSession, setPerspectives } from "@/lib/sessions";
import { clusterReflections } from "@/lib/cluster";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Idempotent: if already synthesized, return the existing perspectives.
  if (session.perspectives && session.perspectives.length > 0) {
    return NextResponse.json({ perspectives: session.perspectives });
  }

  const written = (session.reflections ?? []).filter(
    (r) => !r.passed && r.text.trim().length > 0
  );
  if (written.length === 0) {
    return NextResponse.json(
      { error: "No reflections to synthesize yet" },
      { status: 409 }
    );
  }

  try {
    const perspectives = await clusterReflections(
      session.topic,
      written,
      session.summary
    );
    await setPerspectives(id, perspectives);
    return NextResponse.json({ perspectives });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to synthesize", detail: msg },
      { status: 500 }
    );
  }
}
