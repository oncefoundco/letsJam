"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { REFINE_OPTION_ID, type JamOption } from "@/lib/voting";

const POLL_MS = 3000;

type DotStatus = {
  round: number;
  total: number;
  done: number;
  allIn: boolean;
  tally: Record<string, number>;
  dotsByOption: Record<string, string[]>;
  dotsPerParticipant: number;
  decided: { round: number; option: JamOption } | null;
  mine: { optionId: string; dots: number }[];
};

export function DotVotePanel({
  sessionId,
  options,
  round,
  hostId,
}: {
  sessionId: string;
  options: JamOption[];
  round: number;
  hostId?: string;
}) {
  const router = useRouter();
  const [meId, setMeId] = useState<string | null>(null);
  const [meColor, setMeColor] = useState<string | null>(null);
  const [alloc, setAlloc] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<DotStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigated = useRef(false);

  const dotsTotal = status?.dotsPerParticipant ?? 5;
  const used = Object.values(alloc).reduce((s, n) => s + n, 0);
  const left = Math.max(0, dotsTotal - used);
  const isHost = !!meId && !!hostId && meId === hostId;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`participant.${sessionId}`);
      const parsed = stored
        ? (JSON.parse(stored) as { id?: string; bg?: string })
        : null;
      setMeId(typeof parsed?.id === "string" ? parsed.id : null);
      setMeColor(typeof parsed?.bg === "string" ? parsed.bg : null);
    } catch {
      setMeId(null);
      setMeColor(null);
    }
  }, [sessionId]);

  const route = useCallback(
    (s: DotStatus) => {
      if (navigated.current) return true;
      if (s.decided) {
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

  const refresh = useCallback(async (): Promise<DotStatus | null> => {
    try {
      const url = meId
        ? `/api/sessions/${sessionId}/votes?pid=${meId}`
        : `/api/sessions/${sessionId}/votes`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      const data = (await res.json()) as DotStatus;
      setStatus(data);
      return data;
    } catch {
      return null;
    }
  }, [sessionId, meId]);

  // Seed my allocation from the server once we know who we are.
  useEffect(() => {
    if (!meId) return;
    (async () => {
      const data = await refresh();
      if (!data) return;
      if (data.mine.length) {
        const seeded: Record<string, number> = {};
        for (const m of data.mine) seeded[m.optionId] = m.dots;
        setAlloc(seeded);
      }
      route(data);
    })();
  }, [meId, refresh, route]);

  // Poll for others' dots + resolution. Host nudges resolve once everyone's in.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const data = await refresh();
      if (cancelled || !data) return;
      if (route(data)) return;
      if (isHost && data.allIn && !data.decided && data.round === round) {
        await fetch(`/api/sessions/${sessionId}/votes/resolve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }).catch(() => {});
        const after = await refresh();
        if (after && !cancelled) route(after);
      }
    };
    const handle = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [refresh, route, isHost, round, sessionId]);

  const persist = useCallback(
    async (next: Record<string, number>) => {
      if (!meId) {
        setError("We lost track of who you are — reload and rejoin.");
        return;
      }
      const allocations = Object.entries(next)
        .filter(([, dots]) => dots > 0)
        .map(([optionId, dots]) => ({ optionId, dots }));
      try {
        const res = await fetch(`/api/sessions/${sessionId}/votes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId: meId, allocations }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Failed (${res.status})`);
        }
        setError(null);
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save your dots");
      }
    },
    [meId, sessionId, refresh]
  );

  const bump = useCallback(
    (optionId: string, delta: number) => {
      const current = alloc[optionId] ?? 0;
      if (delta > 0 && used >= dotsTotal) return;
      const nextVal = Math.max(0, current + delta);
      if (nextVal === current) return;
      const next = { ...alloc };
      if (nextVal === 0) delete next[optionId];
      else next[optionId] = nextVal;
      // Pure update + side-effect kept out of the setState updater (which can
      // run twice in dev StrictMode and would double-POST).
      setAlloc(next);
      persist(next);
    },
    [alloc, used, dotsTotal, persist]
  );

  const cards: { id: string; title: string; body?: string; attribution?: string; refine?: boolean }[] = [
    ...options.map((o) => ({
      id: o.id,
      title: o.title,
      body: o.body,
      attribution: o.attribution,
    })),
    { id: REFINE_OPTION_ID, title: "Neither, we need to refine", refine: true },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 pb-20">
      {error ? (
        <p className="text-[13px] text-red-600" style={{ fontFamily: "var(--font-public-sans)" }}>
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          // Show my own dots optimistically the instant I click, instead of
          // waiting for the POST + refresh round-trip. Others' dots come from
          // the server; my dots are rendered from local `alloc` in my color.
          // Avatar colors are distinct per participant, so dropping my color
          // from the server list and re-adding my local count can't double up.
          const serverDots = status?.dotsByOption?.[card.id] ?? [];
          const others = meColor
            ? serverDots.filter((c) => c !== meColor)
            : serverDots;
          const myDots = Array<string>(alloc[card.id] ?? 0).fill(
            meColor ?? "#62a1f1"
          );
          return (
            <OptionCard
              key={card.id}
              title={card.title}
              body={card.body}
              attribution={card.attribution}
              refine={card.refine}
              dots={[...others, ...myDots]}
              mine={alloc[card.id] ?? 0}
              canAdd={left > 0}
              onAdd={() => bump(card.id, 1)}
              onRemove={() => bump(card.id, -1)}
            />
          );
        })}
      </div>

      <DotsLeft left={left} total={dotsTotal} />
    </div>
  );
}

function OptionCard({
  title,
  body,
  attribution,
  refine,
  dots,
  mine,
  canAdd,
  onAdd,
  onRemove,
}: {
  title: string;
  body?: string;
  attribution?: string;
  refine?: boolean;
  dots: string[];
  mine: number;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="flex min-h-[200px] flex-col justify-between gap-6 rounded-2xl bg-[#f5f5f5] p-4">
      <div className="flex flex-col gap-3">
        <h2
          className="text-[16px] font-medium leading-snug text-black"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {title}
        </h2>
        {body ? (
          <p
            className="text-[12px] leading-[1.5] text-[#1a1a1a]/80"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            {body}
          </p>
        ) : null}
        {attribution ? (
          <p
            className="text-[11px] leading-[1.4] text-[#1a1a1a]/45"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            {attribution}
          </p>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {dots.map((color, i) => (
            <span
              key={i}
              className="h-[18px] w-[18px] rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
          {refine && dots.length === 0 ? (
            <span className="text-[11px] text-black/35" style={{ fontFamily: "var(--font-public-sans)" }}>
              Send it back for another round
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Remove a dot"
            onClick={onRemove}
            disabled={mine === 0}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-[18px] leading-none text-black transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          {mine > 0 ? (
            <span
              className="w-4 text-center text-[13px] tabular-nums text-black"
              style={{ fontFamily: "var(--font-public-sans)" }}
            >
              {mine}
            </span>
          ) : null}
          <button
            type="button"
            aria-label="Add a dot"
            onClick={onAdd}
            disabled={!canAdd}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-[18px] leading-none text-black transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}

function DotsLeft({ left, total }: { left: number; total: number }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-10 flex justify-center">
      <div
        className="flex items-center gap-3 rounded-full bg-[#1a1a1a] px-5 py-3 text-[14px] text-white shadow-lg"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        <span>Votes left</span>
        <span className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${i < left ? "bg-[#62a1f1]" : "bg-white/25"}`}
            />
          ))}
        </span>
        <span className="tabular-nums">
          {left}/{total}
        </span>
      </div>
    </div>
  );
}
