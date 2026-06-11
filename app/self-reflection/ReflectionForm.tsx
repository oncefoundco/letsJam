"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MorphTrain } from "@/app/_components/MorphTrain";

const POLL_MS = 3000;

// Up to three takes per person, each with a "refine" flag (this idea needs
// another round before it's worth voting on). Empty slots are dropped on submit.
type Idea = { text: string; refine: boolean };
const EMPTY_IDEAS: Idea[] = [
  { text: "", refine: false },
  { text: "", refine: false },
  { text: "", refine: false },
];

export function ReflectionForm({
  sessionId,
  onwardHref,
  hostId,
  single = false,
}: {
  sessionId: string;
  onwardHref: string;
  hostId?: string;
  // Diamond 2's second reflection is a single take (not the 3-idea form); it
  // feeds the A/B perspectives vote. Posts the legacy single `text`.
  single?: boolean;
}) {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>(() =>
    EMPTY_IDEAS.map((i) => ({ ...i }))
  );
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

  // Restore an unsubmitted draft after a reload so typed ideas aren't lost.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as unknown;
      if (Array.isArray(parsed)) {
        setIdeas((prev) =>
          prev.map((slot, i) => {
            const raw = parsed[i] as { text?: unknown; refine?: unknown } | undefined;
            return {
              text: typeof raw?.text === "string" ? raw.text : slot.text,
              refine: raw?.refine === true,
            };
          })
        );
      }
    } catch {
      // ignore (private browsing / corrupt draft)
    }
  }, [draftKey]);

  const updateIdea = useCallback(
    (index: number, patch: Partial<Idea>) => {
      setIdeas((prev) => {
        const next = prev.map((slot, i) =>
          i === index ? { ...slot, ...patch } : slot
        );
        try {
          localStorage.setItem(draftKey, JSON.stringify(next));
        } catch {
          // ignore (private browsing / storage full)
        }
        return next;
      });
    },
    [draftKey]
  );

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
          perspectivesReady: boolean;
          submittedIds: string[];
        };
        if (cancelled) return;
        // optionsReady covers diamond 1's forced start; perspectivesReady covers
        // diamond 2's, whose synthesis builds perspectives instead of options.
        if (data.allSubmitted || data.optionsReady || data.perspectivesReady) {
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
    const filled = ideas
      .map((i) => ({ text: i.text.trim(), refine: i.refine }))
      .filter((i) => i.text.length > 0);
    if (!passed && filled.length === 0) {
      setError("Write at least one idea, or hit Pass.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/reflections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          single
            ? { participantId: pid, text: filled[0]?.text ?? "", passed }
            : { participantId: pid, ideas: filled, passed }
        ),
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
        perspectivesReady: boolean;
      } | null;
      if (data?.allSubmitted || data?.optionsReady || data?.perspectivesReady) {
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
          <MorphTrain size={18} className="mb-1" />
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
      {single ? (
        <div className="flex min-h-[342px] flex-col justify-between rounded-2xl bg-[#f5f5f5] p-4">
          <textarea
            value={ideas[0].text}
            onChange={(e) => updateIdea(0, { text: e.target.value })}
            className="w-full flex-1 resize-none bg-transparent text-[15px] leading-[1.5] text-[#1a1a1a] outline-none"
            style={{ fontFamily: "var(--font-public-sans)" }}
          />
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[13px] text-[#b5b5b5]" aria-hidden>
              🔒
            </span>
            <p
              className="text-[12px] text-[#7a7a7a]"
              style={{ fontFamily: "var(--font-public-sans)" }}
            >
              Stays private: only Jam&apos;s summary is shared with the room.
            </p>
          </div>
        </div>
      ) : (
      <div className="flex flex-col gap-5">
        {ideas.map((idea, i) => (
          <div key={i} className="flex flex-col gap-2">
            <p
              className="text-[14px] font-medium leading-none text-black"
              style={{ fontFamily: "var(--font-public-sans)" }}
            >
              Priority {i + 1}
            </p>
            <div className="flex min-h-[112px] flex-col justify-between gap-3 rounded-2xl bg-[#f5f5f5] p-4">
              <textarea
                value={idea.text}
                onChange={(e) => updateIdea(i, { text: e.target.value })}
                className="w-full flex-1 resize-none bg-transparent text-[15px] leading-[1.5] text-[#1a1a1a] outline-none"
                style={{ fontFamily: "var(--font-public-sans)" }}
              />
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#b5b5b5]" aria-hidden>
                  🔒
                </span>
                <p
                  className="text-[12px] text-[#7a7a7a]"
                  style={{ fontFamily: "var(--font-public-sans)" }}
                >
                  Stays private: only Jam&apos;s summary is shared with the room.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

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
