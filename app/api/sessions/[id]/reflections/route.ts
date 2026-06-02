import { NextResponse } from "next/server";
import { getSession, saveReflection } from "@/lib/sessions";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: {
    participantId?: unknown;
    text?: unknown;
    passed?: unknown;
    ideas?: unknown;
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
  const known = session.participants.some((p) => p.id === participantId);
  if (!known) {
    return NextResponse.json(
      { error: "Unknown participant" },
      { status: 403 }
    );
  }

  const passed = body.passed === true;

  // New shape: up to three ideas, each { text, refine }. Sanitize, cap to 3,
  // drop empties. We still derive one joined `text` so synthesis (which reads
  // reflections.text) keeps working until bucketing consumes the ideas.
  const ideas = Array.isArray(body.ideas)
    ? body.ideas
        .slice(0, 3)
        .map((raw) => {
          const o = (raw ?? {}) as { text?: unknown; refine?: unknown };
          return {
            text: typeof o.text === "string" ? o.text.trim().slice(0, 8000) : "",
            refine: o.refine === true,
          };
        })
        .filter((i) => i.text.length > 0)
    : [];

  // Legacy single-text callers still supported.
  const legacyText =
    typeof body.text === "string" ? body.text.trim().slice(0, 8000) : "";
  const text = ideas.length
    ? ideas.map((i) => i.text).join("\n\n")
    : legacyText;

  if (!passed && !text) {
    return NextResponse.json(
      { error: "Write at least one idea, or pass" },
      { status: 400 }
    );
  }

  await saveReflection(id, { participantId, text, passed, ideas });
  return NextResponse.json({ ok: true });
}
