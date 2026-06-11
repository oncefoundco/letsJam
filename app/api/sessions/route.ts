import { NextResponse } from "next/server";
import {
  createSession,
  createWherebyRoom,
  makeHostParticipant,
} from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";

// Fallback name when there's no signed-in user (e.g. local testing before auth
// is configured). Normally the host's name comes from their Google profile.
const HOST_NAME = "Simon";

export async function POST(req: Request) {
  let body: { topic?: unknown; description?: unknown; files?: unknown };
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

  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : undefined;

  const files = Array.isArray(body.files)
    ? body.files.filter((f): f is string => typeof f === "string")
    : [];

  try {
    // Whereby room creation and the signed-in profile read are independent —
    // run them concurrently rather than waterfalling.
    const [{ roomUrl, hostRoomUrl, roomName }, user] = await Promise.all([
      createWherebyRoom(),
      createClient().then((supabase) => supabase.auth.getUser()).then((r) => r.data.user),
    ]);

    // Auto-register the host as a participant so we skip the name prompt for them.
    // Pull their name/color from the signed-in Google profile when available.
    const meta = user?.user_metadata ?? {};
    const hostName =
      (meta.display_name as string) ||
      (meta.full_name as string) ||
      (meta.name as string) ||
      HOST_NAME;
    const hostColor = meta.color as string | undefined;
    const host = makeHostParticipant(hostName, hostColor);

    const id = crypto.randomUUID();
    // Persist the room with the host already in it (single-statement insert).
    // created_by ties the jam to the signed-in host for their Previous Jams
    // history; guests (no auth) simply leave it null.
    await createSession({
      id,
      createdBy: user?.id,
      topic,
      description,
      files,
      roomUrl,
      hostRoomUrl,
      roomName,
      createdAt: Date.now(),
      participants: [host],
      reflections: [],
    });
    return NextResponse.json({ id, host });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create session", detail: msg },
      { status: 500 }
    );
  }
}
