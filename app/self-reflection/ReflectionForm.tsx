"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const POLL_MS = 3000;

export function ReflectionForm({
  sessionId,
  onwardHref,
  hostId,
}: {
  sessionId: string;
  onwardHref: string;
  hostId?: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // null = still editing; once set, we've submitted and are gating on others.
  const [gate, setGate] = useState<{ submitted: number; total: number } | null>(
    null
  );
  const [meId, setMeId] = useState<string | null>(null);

  const participantId = useCallback((): string | null => {
    try {
      const stored = localStorage.getItem(`participant.${sessionId}`);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as { id?: string };
      return typeof parsed.id === "string" ? parsed.id : null;
    } catch {
      return null;
    }
  }, [sessionId]);

  useEffect(() => {
    setMeId(participantId());
  }, [participantId]);

  const isHost = !!meId && !!hostId && meId === hostId;

  const draftKey = `reflection-draft.${sessionId}`;

  // Restore an unsubmitted draft after a reload so typed text isn't lost.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) setText((prev) => prev || saved);
    } catch {
      // ignore (private browsing / storage unavailable)
    }
  }, [draftKey]);

  // Poll the reflection phase the whole time — while editing AND while gating.
  // Advance the whole room to the vote when everyone has submitted OR options
  // exist (the host hit "Start vote anyway"); otherwise keep the gate count
  // fresh. Polling on the form view is what lets non-submitters follow a forced
  // start instead of getting stranded.
  useEffect(() => {
    const pid = participantId();
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/status`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          submitted: number;
          total: number;
          allSubmitted: boolean;
          optionsReady: boolean;
          submittedIds: string[];
        };
        if (cancelled) return;
        if (data.allSubmitted || data.optionsReady) {
          router.push(onwardHref);
          return;
        }
        if (pid && data.submittedIds.includes(pid)) {
          setGate({ submitted: data.submitted, total: data.total });
        }
      } catch {
        // ignore transient failures
      }
    };
    tick();
    const handle = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [sessionId, participantId, router, onwardHref]);

  async function submit({ passed }: { passed: boolean }) {
    if (submitting) return;
    const pid = participantId();
    if (!pid) {
      setError("We lost track of who you are — reload and rejoin.");
      return;
    }
    if (!passed && !text.trim()) {
      setError("Write your take, or hit Pass.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/reflections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: pid, text: text.trim(), passed }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      // Submitted — the draft has served its purpose.
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      const status = await fetch(`/api/sessions/${sessionId}/status`, {
        cache: "no-store",
      });
      const data = (await status.json().catch(() => null)) as {
        submitted: number;
        total: number;
        allSubmitted: boolean;
        optionsReady: boolean;
      } | null;
      if (data?.allSubmitted || data?.optionsReady) {
        router.push(onwardHref);
        return;
      }
      setGate(
        data
          ? { submitted: data.submitted, total: data.total }
          : { submitted: 1, total: 1 }
      );
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setSubmitting(false);
    }
  }

  async function startVoteAnyway() {
    try {
      await fetch(`/api/sessions/${sessionId}/synthesize`, { method: "POST" });
    } catch {
      // /vote will synthesize on arrival if this didn't take
    }
    router.push(onwardHref);
  }

  if (gate) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex h-[342px] flex-col items-center justify-center gap-4 rounded-2xl bg-[#f5f5f5] p-8 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-[#e85d3c]" />
          <p
            className="text-[15px] text-[#1a1a1a]"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            Waiting for others…
          </p>
          <p
            className="text-[13px] text-black/55"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            {gate.submitted} of {gate.total} have weighed in. The paths appear
            once everyone&apos;s in.
          </p>
        </div>
        {isHost ? (
          <button
            type="button"
            onClick={startVoteAnyway}
            className="flex w-full items-center justify-center rounded-2xl bg-[#1a1a1a] p-4 text-[14px] font-medium leading-none text-white transition-colors hover:bg-black"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            Start vote anyway
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-[342px] flex-col justify-between rounded-2xl bg-[#f5f5f5] p-4">
        <textarea
          value={text}
          onChange={(e) => {
            const value = e.target.value;
            setText(value);
            try {
              localStorage.setItem(draftKey, value);
            } catch {
              // ignore (private browsing / storage full)
            }
          }}
          placeholder="What's your read on this? What would you do, and why? Be specific — your thinking is what the AI uses to find the real choice the room faces."
          className="w-full flex-1 resize-none bg-transparent text-[15px] leading-[1.5] text-[#1a1a1a] outline-none placeholder:text-[#7a7a7a]"
          style={{ fontFamily: "var(--font-public-sans)" }}
        />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#b5b5b5]" aria-hidden>
              🔒
            </span>
            <p
              className="text-[12px] text-[#7a7a7a]"
              style={{ fontFamily: "var(--font-public-sans)" }}
            >
              Private until everyone is in
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <p
          className="text-[13px] text-red-600"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {error}
        </p>
      ) : null}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => submit({ passed: true })}
          disabled={submitting}
          className="flex w-[228px] items-center justify-center rounded-2xl bg-white p-4 text-[14px] font-medium leading-none text-black ring-1 ring-inset ring-black/10 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          Pass
        </button>
        <button
          type="button"
          onClick={() => submit({ passed: false })}
          disabled={submitting}
          className="flex flex-1 items-center justify-center rounded-2xl bg-[#1a1a1a] p-4 text-[14px] font-medium leading-none text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
