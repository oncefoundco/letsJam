import { NextResponse } from "next/server";
import {
  addParticipant,
  createWherebyRoom,
  linkRoomToSession,
  saveSession,
} from "@/lib/sessions";

const HOST_NAME = "Simon";

export async function POST(req: Request) {
  let body: { topic?: unknown; files?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const topic =
    typeof body.topic === "string" && body.topic.trim().length > 0
      ? body.topic.trim()
      : null;
  if (!topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  const files = Array.isArray(body.files)
    ? body.files.filter((f): f is string => typeof f === "string")
    : [];

  try {
    const { roomUrl, hostRoomUrl, roomName } = await createWherebyRoom();
    const id = crypto.randomUUID();
    await saveSession({
      id,
      topic,
      files,
      roomUrl,
      hostRoomUrl,
      roomName,
      createdAt: Date.now(),
      participants: [],
    });
    // Reverse index so the transcription webhook (which only knows roomName) finds us.
    await linkRoomToSession(roomName, id);
    // Auto-register the host as a participant so we skip the name prompt for them.
    // TODO: when Google OAuth lands, replace HOST_NAME with the authed user's name.
    const host = await addParticipant(id, HOST_NAME);
    return NextResponse.json({ id, host });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create session", detail: msg },
      { status: 500 }
    );
  }
}
