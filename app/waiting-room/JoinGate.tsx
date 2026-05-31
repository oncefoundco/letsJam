"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LoginModal, ProfileModal } from "@/app/start/AuthGate";

// Gate for people arriving via an invite link. Same experience as the host:
// Google sign-in → name + color → then join this session as a participant.
// Shown over the waiting-room background until they're in.
export function JoinGate({
  sessionId,
  authed,
  initialName,
  initialColor,
}: {
  sessionId: string;
  authed: boolean;
  initialName?: string;
  initialColor?: string;
}) {
  const router = useRouter();
  // null = still checking localStorage; true = already a participant in this jam.
  const [joined, setJoined] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setJoined(Boolean(localStorage.getItem(`participant.${sessionId}`)));
    } catch {
      setJoined(false);
    }
  }, [sessionId]);

  // Auth is required, so show the login gate immediately (no localStorage needed).
  if (!authed) {
    return <LoginModal next={`/waiting-room?session=${sessionId}`} />;
  }

  // Signed in: wait for the localStorage check, and stay out of the way if
  // they've already joined this jam.
  if (joined === null || joined) return null;

  return (
    <ProfileModal
      initialName={initialName}
      initialColor={initialColor}
      submitLabel="Join"
      onComplete={async ({ name, color }) => {
        const supabase = createClient();
        // Remember their choice so it pre-fills next time. Best-effort.
        await supabase.auth
          .updateUser({ data: { display_name: name, color } })
          .catch(() => {});

        // Dedupe against any prior participant id for this session.
        let existingId: string | undefined;
        try {
          const stored = localStorage.getItem(`participant.${sessionId}`);
          if (stored) {
            const parsed = JSON.parse(stored) as { id?: string };
            if (typeof parsed.id === "string") existingId = parsed.id;
          }
        } catch {
          // ignore
        }

        const res = await fetch(`/api/sessions/${sessionId}/participants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, color, participantId: existingId }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Failed (${res.status})`);
        }
        const participant = await res.json();
        try {
          localStorage.setItem(
            `participant.${sessionId}`,
            JSON.stringify(participant)
          );
        } catch {
          // ignore (private browsing / storage full)
        }
        window.dispatchEvent(new Event("jam:participant-changed"));

        // If the host already started while they were signing in, drop them
        // straight into /session — skipping the countdown they missed.
        try {
          const sr = await fetch(`/api/sessions/${sessionId}/status`, {
            cache: "no-store",
          });
          if (sr.ok) {
            const data = (await sr.json()) as { startedAt?: number | null };
            if (data.startedAt) {
              router.push(`/session?session=${sessionId}`);
              return;
            }
          }
        } catch {
          // network blip; fall through to waiting room
        }

        setJoined(true);
        router.refresh();
      }}
    />
  );
}
