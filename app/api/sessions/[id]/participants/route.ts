import { NextResponse } from "next/server";
import { addParticipant, getSession, MAX_PARTICIPANTS } from "@/lib/sessions";

// Lets the waiting room / session sidebar poll for new joiners so the
// participant list updates live instead of only on a full page reload.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ participants: session.participants });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: { name?: unknown; participantId?: unknown; color?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const color = typeof body.color === "string" ? body.color : undefined;

  // If the client already has a participantId for this session, dedupe.
  // Returning here means existing members are never blocked by the cap.
  if (typeof body.participantId === "string") {
    const existing = session.participants.find(
      (p) => p.id === body.participantId
    );
    if (existing) return NextResponse.json(existing);
  }

  // Cap the room. New joiners past the limit are turned away.
  if (session.participants.length >= MAX_PARTICIPANTS) {
    return NextResponse.json(
      { error: `This jam is full (max ${MAX_PARTICIPANTS} people).` },
      { status: 409 }
    );
  }

  const participant = await addParticipant(id, name, color);
  if (!participant) {
    return NextResponse.json(
      { error: "Could not add participant" },
      { status: 500 }
    );
  }
  return NextResponse.json(participant);
}
