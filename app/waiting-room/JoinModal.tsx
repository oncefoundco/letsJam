"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function JoinModal() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    try {
      const stored = localStorage.getItem(`participant.${sessionId}`);
      if (!stored) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [sessionId]);

  useEffect(() => {
    if (open) {
      // Defer focus so the input is mounted.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !sessionId || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // Include any existing participantId from localStorage so the server can dedupe.
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
      // Carry the signed-in user's chosen profile color so their avatar matches
      // what they picked in setup. Guests (not signed in) fall back to the palette.
      let color: string | undefined;
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const c = user?.user_metadata?.color;
        if (typeof c === "string") color = c;
      } catch {
        // not signed in or auth unavailable — palette fallback is fine
      }
      const res = await fetch(`/api/sessions/${sessionId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, participantId: existingId, color }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      const participant = await res.json();
      localStorage.setItem(
        `participant.${sessionId}`,
        JSON.stringify(participant)
      );
      window.dispatchEvent(new Event("jam:participant-changed"));

      // If the host already kicked things off while this person was
      // typing, drop them straight into /session — skipping the 3-2-1
      // countdown they missed.
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

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-modal-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-[440px] rounded-3xl bg-white p-8 shadow-xl"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        <h2
          id="join-modal-title"
          className="text-[22px] font-semibold leading-tight text-[#1a1a1a]"
        >
          What should we call you?
        </h2>
        <p className="mt-2 text-[14px] leading-snug text-black/60">
          The room will see this name next to your avatar.
        </p>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={60}
          className="mt-6 w-full rounded-2xl bg-[#f5f5f5] p-4 text-[15px] leading-none text-[#1a1a1a] outline-none placeholder:text-black/40 focus:ring-2 focus:ring-[#3c5bcb]/40"
        />
        {error ? (
          <p className="mt-3 text-[13px] text-red-600">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="mt-6 flex w-full items-center justify-center rounded-2xl bg-[#1a1a1a] p-4 text-[14px] font-medium leading-none text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Joining…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
