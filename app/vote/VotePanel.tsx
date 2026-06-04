"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Outcome, Perspective, VoteChoice } from "@/lib/sessions";
import { useSessionChannel } from "@/lib/realtime";
import { MorphTrain } from "@/app/_components/MorphTrain";

// Realtime Broadcast drives sync now; this is only a safety net for dropped
// websockets / missed messages / reconnects, so it can be slow.
const FALLBACK_POLL_MS = 15000;

type VoteStatus = {
  round: number;
  total: number;
  voted: number;
  allVoted: boolean;
  tally: { A: number; B: number; refine: number };
  voterIds: string[];
  outcome: Outcome | null;
};

export function VotePanel({
  sessionId,
  perspectives,
  round,
  hostId,
}: {
  sessionId: string;
  perspectives: Perspective[];
  round: number;
  hostId?: string;
}) {
  const router = useRouter();
  const [meId, setMeId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"voting" | "waiting">("voting");
  const [refineOpen, setRefineOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [myChoice, setMyChoice] = useState<VoteChoice | null>(null);
  const [status, setStatus] = useState<VoteStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigated = useRef(false);

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

  const isHost = !!meId && !!hostId && meId === hostId;

  const route = useCallback(
    (s: VoteStatus) => {
      if (navigated.current) return false;
      if (s.outcome) {
        navigated.current = true;
        router.push(`/the-call?session=${sessionId}`);
        return true;
      }
      if (s.round > round) {
        navigated.current = true;
        router.push(`/self-reflection?session=${sessionId}`);
        return true;
      }
      return false;
    },
    [router, sessionId, round]
  );

  const refresh = useCallback(async (): Promise<VoteStatus | null> => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/votes`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = (await res.json()) as VoteStatus;
      setStatus(data);
      return data;
    } catch {
      return null;
    }
  }, [sessionId]);

  // On mount: if we already voted this round (or it's resolved), reflect that.
  useEffect(() => {
    if (!meId) return;
    (async () => {
      const data = await refresh();
      if (!data) return;
      if (route(data)) return;
      if (data.voterIds.includes(meId)) setPhase("waiting");
    })();
  }, [meId, refresh, route]);

  // broadcast() comes from the channel hook below, but sync() (the hook's own
  // handler) needs to call it — hold it in a ref to break the cycle.
  const broadcastRef = useRef<(round: number) => void>(() => {});

  // Pull fresh state, navigate if the round moved on, and — if I'm the host —
  // nudge resolution once everyone has voted. Used by both the Realtime handler
  // and the slow fallback poll. resolve is idempotent and route() guards against
  // double-navigation, so it's safe to call from either trigger.
  const sync = useCallback(async () => {
    const data = await refresh();
    if (!data) return;
    if (route(data)) return;
    if (isHost && data.allVoted && !data.outcome && data.round === round) {
      await fetch(`/api/sessions/${sessionId}/votes/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => {});
      // Tell the room the round resolved so everyone navigates without waiting
      // for their fallback poll.
      broadcastRef.current(round);
      const after = await refresh();
      if (after) route(after);
    }
  }, [refresh, route, isHost, round, sessionId]);

  // Realtime: a peer's vote (or a resolution) pings the channel → refetch once.
  // Host auto-resolve now fires from here instead of the old 3s poll tick.
  const broadcast = useSessionChannel(sessionId, sync);
  useEffect(() => {
    broadcastRef.current = broadcast;
  }, [broadcast]);

  // Safety-net poll while waiting, for dropped/missed websocket messages. Keeps
  // the page in sync even if Realtime never connects — just on a slow cadence.
  useEffect(() => {
    if (phase !== "waiting") return;
    const handle = setInterval(() => {
      void sync();
    }, FALLBACK_POLL_MS);
    return () => clearInterval(handle);
  }, [phase, sync]);

  async function cast(choice: VoteChoice, voteReason?: string) {
    if (busy) return;
    if (!meId) {
      setError("We lost track of who you are — reload and rejoin.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: meId, choice, reason: voteReason }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      setMyChoice(choice);
      setPhase("waiting");
      // Notify the room so everyone refetches instantly instead of waiting on
      // the slow fallback poll.
      broadcast(round);
      const data = await refresh();
      if (data) {
        if (route(data)) return;
        if (isHost && data.allVoted && !data.outcome && data.round === round) {
          await fetch(`/api/sessions/${sessionId}/votes/resolve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }).catch(() => {});
          broadcast(round);
          const after = await refresh();
          if (after) route(after);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setBusy(false);
    }
  }

  async function resolveNow() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/sessions/${sessionId}/votes/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      // Tell the room the round resolved so participants navigate immediately.
      broadcast(round);
      const data = await refresh();
      if (data) route(data);
    } catch {
      // ignore; next poll retries
    } finally {
      setBusy(false);
    }
  }

  if (phase === "waiting") {
    const voted = status?.voted ?? 0;
    const total = status?.total ?? 0;
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl bg-[#f5f5f5] p-12 text-center"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        <MorphTrain size={18} className="mb-1" />
        <p className="text-[15px] text-[#1a1a1a]">
          {myChoice === "refine" ? "Refine requested" : "Vote in"} — waiting for
          others…
        </p>
        <p className="text-[13px] text-black/55">
          {voted} of {total} have voted.
        </p>
        {isHost ? (
          <button
            type="button"
            onClick={resolveNow}
            disabled={busy}
            className="mt-2 rounded-xl bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black disabled:opacity-60"
          >
            Resolve now
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {error ? (
        <p
          className="text-[13px] text-red-600"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {error}
        </p>
      ) : null}
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
        {perspectives.slice(0, 2).map((p, i) => (
          <PerspectiveCard
            key={p.label}
            label={p.label}
            title={p.title}
            body={p.body}
            attribution={p.attribution}
            ctaLabel={`Vote ${String.fromCharCode(65 + i)}`}
            disabled={busy}
            onVote={() => cast(i === 0 ? "A" : "B")}
          />
        ))}
        <RefineCard
          open={refineOpen}
          reason={reason}
          busy={busy}
          onOpen={() => setRefineOpen(true)}
          onReason={setReason}
          onSubmit={() => cast("refine", reason)}
        />
      </div>
    </div>
  );
}

function PerspectiveCard({
  label,
  title,
  body,
  attribution,
  ctaLabel,
  disabled,
  onVote,
}: {
  label: string;
  title: string;
  body: string;
  attribution: string;
  ctaLabel: string;
  disabled: boolean;
  onVote: () => void;
}) {
  return (
    <article className="flex h-full flex-col justify-between gap-6 rounded-2xl bg-[#f5f5f5] p-4 lg:min-h-[420px]">
      <div className="flex flex-col gap-6">
        <p
          className="text-[14px] font-medium leading-none text-[#e96748]"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {label}
        </p>
        <h2
          className="text-[18px] font-medium leading-snug text-black"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {title}
        </h2>
        <p
          className="text-[12px] leading-[1.5] text-[#1a1a1a]"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {body}
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <div
          className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-[12px]"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          <p className="leading-none text-[#1a1a1a]/50">Whose thinking</p>
          <p className="leading-[1.5] text-[#1a1a1a]">{attribution}</p>
        </div>
        <button
          type="button"
          onClick={onVote}
          disabled={disabled}
          className="flex w-full items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-[9px] text-[14px] font-medium leading-none text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {ctaLabel}
        </button>
      </div>
    </article>
  );
}

function RefineCard({
  open,
  reason,
  busy,
  onOpen,
  onReason,
  onSubmit,
}: {
  open: boolean;
  reason: string;
  busy: boolean;
  onOpen: () => void;
  onReason: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <article className="flex h-full flex-col gap-6 rounded-2xl bg-[#f5f5f5] p-4 lg:min-h-[420px]">
      <h2
        className="text-[18px] font-medium leading-snug text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        Neither, we need to refine
      </h2>
      {open ? (
        <textarea
          value={reason}
          onChange={(e) => onReason(e.target.value)}
          autoFocus
          placeholder="What's missing? What would make the next round sharper?"
          className="flex-1 resize-none rounded-2xl bg-white p-4 text-[12px] leading-[1.5] text-[#1a1a1a] outline-none placeholder:text-[#7a7a7a]"
          style={{ fontFamily: "var(--font-public-sans)" }}
        />
      ) : (
        <div className="flex flex-1 flex-col gap-3 rounded-2xl bg-white p-4 text-[12px] leading-[1.5] text-[#1a1a1a]">
          <p style={{ fontFamily: "var(--font-public-sans)" }}>
            What&apos;s missing? What would make the next round sharper?
          </p>
          <p className="italic" style={{ fontFamily: "var(--font-public-sans)" }}>
            (Refinement triggers if 2 or more vote for it. Refine votes require a
            written reason.)
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={open ? onSubmit : onOpen}
        disabled={busy || (open && !reason.trim())}
        className="flex w-full items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-[9px] text-[14px] font-medium leading-none text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        {open ? "Submit refine" : "Refine"}
      </button>
    </article>
  );
}
