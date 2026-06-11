import { NextResponse, after } from "next/server";
import {
  createSession,
  createWherebyRoom,
  makeHostParticipant,
} from "@/lib/sessions";
import { insertInvitees } from "@/lib/sessionStore";
import { sendJamInvites } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Cap to keep a single batch sane; well above any real "Who will be joining?" list.
const MAX_INVITES = 50;

// Fallback name when there's no signed-in user (e.g. local testing before auth
// is configured). Normally the host's name comes from their Google profile.
const HOST_NAME = "Simon";

export async function POST(req: Request) {
  let body: {
    topic?: unknown;
    description?: unknown;
    files?: unknown;
    emails?: unknown;
  };
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

  // The "Who will be joining?" emails. Validate, de-dupe (case-insensitive),
  // and cap so a bad list can't fan out a huge batch.
  const emails = Array.isArray(body.emails)
    ? [
        ...new Set(
          body.emails
            .filter((e): e is string => typeof e === "string")
            .map((e) => e.trim().toLowerCase())
            .filter((e) => EMAIL_RE.test(e))
        ),
      ].slice(0, MAX_INVITES)
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

    // Persist invitees and email each a "Join Jam" link. Deferred via after()
    // so the host's redirect isn't blocked, and wrapped so a Resend failure
    // (e.g. the sending domain not yet verified) never fails jam creation — the
    // invite modal's copy-link stays as the fallback.
    if (emails.length > 0) {
      const origin =
        req.headers.get("origin") ??
        process.env.NEXT_PUBLIC_APP_URL ??
        new URL(req.url).origin;
      const joinUrl = `${origin}/waiting-room?session=${id}`;
      after(async () => {
        try {
          await insertInvitees(id, emails);
        } catch (err) {
          console.error(`Failed to persist invitees for ${id}:`, err);
        }
        try {
          await sendJamInvites(
            emails.map((to) => ({ to, hostName, topic, joinUrl }))
          );
        } catch (err) {
          console.error(`Failed to send Jam invites for ${id}:`, err);
        }
      });
    }

    return NextResponse.json({ id, host });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create session", detail: msg },
      { status: 500 }
    );
  }
}
