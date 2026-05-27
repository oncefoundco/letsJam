import { NextResponse } from "next/server";
import {
  getSession,
  getSessionIdByRoomName,
  setSummary,
} from "@/lib/sessions";
import { fetchTranscript, verifyWherebySignature } from "@/lib/whereby";
import { summarizeTranscript } from "@/lib/summary";

type WherebyEvent = {
  id?: string;
  type?: string;
  data?: {
    roomName?: string;
    roomSessionId?: string;
    transcriptionId?: string;
    [key: string]: unknown;
  };
};

export async function POST(req: Request) {
  const rawBody = await req.text();

  const secret = process.env.WHEREBY_WEBHOOK_SECRET;
  if (secret) {
    const ok = verifyWherebySignature(
      rawBody,
      req.headers.get("Whereby-Signature"),
      secret
    );
    if (!ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: WherebyEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Log so we can confirm the real payload shape on the first live delivery.
  console.log("[whereby webhook]", event.type, JSON.stringify(event.data));

  // Ack everything that isn't a finished transcription.
  if (event.type !== "transcription.finished") {
    return NextResponse.json({ ok: true });
  }

  const roomName = event.data?.roomName;
  const transcriptionId = event.data?.transcriptionId;
  if (!roomName || !transcriptionId) {
    console.warn("[whereby webhook] missing roomName/transcriptionId");
    return NextResponse.json({ ok: true });
  }

  const sessionId = await getSessionIdByRoomName(roomName);
  if (!sessionId) {
    console.warn("[whereby webhook] no session for room", roomName);
    return NextResponse.json({ ok: true });
  }
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ ok: true });
  }

  try {
    const transcript = await fetchTranscript(transcriptionId);
    const summary = await summarizeTranscript(session.topic, transcript);
    await setSummary(sessionId, summary);
    console.log("[whereby webhook] summary stored for", sessionId);
  } catch (err) {
    // Ack with 200 anyway so Whereby doesn't auto-disable the endpoint on retries.
    console.error("[whereby webhook] summarize failed", err);
  }

  return NextResponse.json({ ok: true });
}
