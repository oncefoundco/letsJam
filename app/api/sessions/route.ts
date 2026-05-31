import { NextResponse } from "next/server";
import {
  addParticipant,
  createWherebyRoom,
  linkRoomToSession,
  saveSession,
} from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";

// Fallback name when there's no signed-in user (e.g. local testing before auth
// is configured). Normally the host's name comes from their Google profile.
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
      reflections: [],
    });
    // Reverse index so the transcription webhook (which only knows roomName) finds us.
    await linkRoomToSession(roomName, id);
    // Auto-register the host as a participant so we skip the name prompt for them.
    // Pull their name/color from the signed-in Google profile when available.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const meta = user?.user_metadata ?? {};
    const hostName =
      (meta.display_name as string) ||
      (meta.full_name as string) ||
      (meta.name as string) ||
      HOST_NAME;
    const hostColor = meta.color as string | undefined;
    const host = await addParticipant(id, hostName, hostColor);
    return NextResponse.json({ id, host });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create session", detail: msg },
      { status: 500 }
    );
  }
}
