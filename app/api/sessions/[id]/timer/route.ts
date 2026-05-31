import { NextResponse } from "next/server";
import {
  ensurePhaseTimer,
  getSession,
  pausePhaseTimer,
  resumePhaseTimer,
  stopPhaseTimer,
} from "@/lib/sessions";
import type { TimerPhase } from "@/lib/timer";

const ACTIONS = ["ensure", "pause", "resume", "stop"] as const;
type Action = (typeof ACTIONS)[number];
const PHASES: TimerPhase[] = ["discussion", "reflection", "vote"];

// Host-only control of the live phase countdown. The host is participants[0].
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
    action?: unknown;
    participantId?: unknown;
    phase?: unknown;
    durationMs?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action as Action;
  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  // Only the host (first participant) can drive the timer.
  const host = session.participants[0];
  if (!host || body.participantId !== host.id) {
    return NextResponse.json({ error: "not-host" }, { status: 403 });
  }

  let timer;
  if (action === "ensure") {
    const phase = body.phase as TimerPhase;
    if (!PHASES.includes(phase)) {
      return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
    }
    const durationMs =
      typeof body.durationMs === "number" && body.durationMs > 0
        ? body.durationMs
        : undefined;
    timer = await ensurePhaseTimer(id, phase, durationMs);
  } else if (action === "pause") {
    timer = await pausePhaseTimer(id);
  } else if (action === "resume") {
    timer = await resumePhaseTimer(id);
  } else {
    timer = await stopPhaseTimer(id);
  }

  return NextResponse.json({ timer: timer ?? null });
}
