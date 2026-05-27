import { NextResponse } from "next/server";
import { getSession, setSummary } from "@/lib/sessions";
import { summarizeTranscript } from "@/lib/summary";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: { transcript?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const transcript =
    typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) {
    return NextResponse.json(
      { error: "transcript is required" },
      { status: 400 }
    );
  }

  try {
    const summary = await summarizeTranscript(session.topic, transcript);
    await setSummary(id, summary);
    return NextResponse.json(summary);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to summarize", detail: msg },
      { status: 500 }
    );
  }
}
