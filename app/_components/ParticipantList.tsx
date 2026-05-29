"use client";

import { useEffect, useState } from "react";
import type { Participant } from "@/lib/sessions";

const POLL_MS = 3000;

export function ParticipantList({
  participants,
  sessionId,
  label,
}: {
  participants: Participant[];
  sessionId: string;
  label: string;
}) {
  const [meId, setMeId] = useState<string | null>(null);
  // Seed from the server-rendered list to avoid a flash, then keep it live so
  // people already on the page see new joiners without a manual reload.
  const [list, setList] = useState<Participant[]>(participants);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`participant.${sessionId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as { id?: string };
        if (typeof parsed.id === "string") setMeId(parsed.id);
      }
    } catch {
      // ignore
    }
  }, [sessionId]);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/participants`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { participants?: Participant[] };
        if (active && Array.isArray(data.participants)) {
          setList(data.participants);
        }
      } catch {
        // transient network error — try again next tick
      }
    }
    // Refresh immediately when this tab's own join completes, and on an interval
    // for joins happening in other people's tabs.
    window.addEventListener("jam:participant-changed", refresh);
    const handle = setInterval(refresh, POLL_MS);
    refresh();
    return () => {
      active = false;
      window.removeEventListener("jam:participant-changed", refresh);
      clearInterval(handle);
    };
  }, [sessionId]);

  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-[14px] font-medium leading-none text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        {label}
      </p>
      {list.length === 0 ? (
        <p
          className="text-[12px] leading-snug text-black/55"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          Waiting for the first person to join…
        </p>
      ) : (
        <ul className="flex flex-col gap-4 px-3">
          {list.map((p) => (
            <li key={p.id} className="flex items-center gap-4">
              <span
                className="grid h-6 w-6 place-items-center rounded-full text-[10px] leading-none text-black"
                style={{
                  backgroundColor: p.bg,
                  fontFamily: "var(--font-public-sans)",
                }}
              >
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span
                className="text-[14px] leading-none text-black"
                style={{ fontFamily: "var(--font-public-sans)" }}
              >
                {p.name}
                {p.id === meId ? " (You)" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
