"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// Serializable view-model computed by the server page (app/jam/[id]/page.tsx).
export type RecapData = {
  id: string;
  topic: string;
  description?: string;
  dateLabel: string;
  statusLabel: string;
  decided: boolean;
  rounds: number;
  participants: { name: string; bg: string }[];
  files: string[];
  // What the room landed on — option (dot vote) or perspective (A/B vote).
  result?: {
    title: string;
    body?: string;
    attribution?: string;
    round: number;
    dots?: number;
    totalDots?: number;
    votes?: number;
    votesTotal?: number;
  };
  reflections: { name: string; bg: string; text: string; passed: boolean }[];
  options: {
    id: string;
    title: string;
    body?: string;
    attribution?: string;
    dots: number;
    colors: string[];
    winner: boolean;
  }[];
  refineDots: number;
  perspectives: {
    slot: "A" | "B";
    label: string;
    title: string;
    body: string;
    attribution: string;
    votes: number;
    voters: string[];
    winner: boolean;
  }[];
  // The top-3 ideas the round-1 dot vote narrowed to (carried into diamond 2).
  narrowedIdeas: string[];
  // Genuine refine reasons — only present when a round was sent back.
  refineContext: string[];
};

const PS = { fontFamily: "var(--font-public-sans)" } as const;
const QUEENS = { fontFamily: "var(--font-queens)" } as const;

type Stage = { id: string; label: string };

export function RecapView({ data }: { data: RecapData }) {
  // Only the sections this jam actually has show up — in the narrative AND in
  // the stage tracker, so the two always mirror each other.
  const stages = useMemo<Stage[]>(() => {
    const s: Stage[] = [
      { id: "decision", label: data.decided ? "The decision" : "Where it stands" },
    ];
    if (data.reflections.length) s.push({ id: "brought", label: "What people brought" });
    if (data.options.length) s.push({ id: "options", label: "The options" });
    if (data.narrowedIdeas.length) s.push({ id: "narrowed", label: "What we narrowed to" });
    if (data.perspectives.length) s.push({ id: "vote", label: "The vote" });
    if (data.refineContext.length) s.push({ id: "refined", label: "Why we refined" });
    return s;
  }, [data]);

  const [active, setActive] = useState("decision");

  // Scroll-spy: the tracker's highlight follows whichever section sits in the
  // upper band of the viewport. Clicking a stage (or prev/next) scrolls there;
  // the observer keeps the highlight honest either way.
  useEffect(() => {
    const els = stages
      .map((s) => document.getElementById(`recap-${s.id}`))
      .filter((el): el is HTMLElement => el !== null);
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting);
        const first = stages.find((s) => visible.get(`recap-${s.id}`));
        if (first) setActive(first.id);
      },
      { rootMargin: "-15% 0px -55% 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [stages]);

  function goTo(id: string) {
    document
      .getElementById(`recap-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function step(delta: number) {
    const i = stages.findIndex((s) => s.id === active);
    const next = stages[i + delta];
    if (next) goTo(next.id);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-11 lg:px-16 lg:pb-16 lg:pt-8">
      {/* ── Left: the narrative ─────────────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1
            className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
            style={QUEENS}
          >
            {data.topic}
          </h1>
          <p className="text-[14px] leading-none text-[#1a1a1a]/50" style={PS}>
            {data.dateLabel}
            {" · "}
            {data.participants.length}{" "}
            {data.participants.length === 1 ? "person" : "people"}
            {" · "}
            {data.rounds} {data.rounds === 1 ? "round" : "rounds"}
          </p>
          {data.description ? (
            <p
              className="text-[15px] leading-[1.5] text-muted-ink"
              style={PS}
            >
              {data.description}
            </p>
          ) : null}
        </div>

        <Section id="decision">
          {data.result ? (
            <div className="flex flex-col gap-4 rounded-3xl bg-jam-yellow p-6 md:p-8">
              <p
                className="text-[12px] font-semibold uppercase leading-none tracking-[0.08em] text-[#1a1a1a]/60"
                style={PS}
              >
                The decision
              </p>
              <p
                className="text-[28px] leading-[1.1] tracking-[-0.5px] text-[#1a1a1a] md:text-[36px]"
                style={QUEENS}
              >
                {data.result.title}
              </p>
              {data.result.body ? (
                <p className="text-[15px] leading-[1.5] text-[#1a1a1a]/80" style={PS}>
                  {data.result.body}
                </p>
              ) : null}
              <p className="text-[13px] leading-none text-[#1a1a1a]/60" style={PS}>
                {data.result.dots != null
                  ? `${data.result.dots} of ${data.result.totalDots} dots`
                  : `${data.result.votes} of ${data.result.votesTotal} votes`}
                {data.result.round > 1 ? ` · decided in round ${data.result.round}` : ""}
                {data.result.attribution ? ` · ${data.result.attribution}` : ""}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-3xl bg-white p-6 md:p-8">
              <p
                className="text-[12px] font-semibold uppercase leading-none tracking-[0.08em] text-[#1a1a1a]/60"
                style={PS}
              >
                Where it stands
              </p>
              <p className="text-[18px] italic leading-[1.5] text-[#1a1a1a]" style={PS}>
                This jam hasn&apos;t reached a decision — it&apos;s{" "}
                {data.statusLabel.toLowerCase()}.
              </p>
            </div>
          )}
        </Section>

        {data.reflections.length ? (
          <Section id="brought">
            <Card title="What people brought">
              <ul className="flex flex-col gap-5">
                {data.reflections.map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Avatar name={r.name} bg={r.bg} />
                    <div className="flex min-w-0 flex-col gap-1">
                      <p
                        className="text-[14px] font-semibold leading-none text-[#1a1a1a]"
                        style={PS}
                      >
                        {r.name}
                      </p>
                      {r.passed ? (
                        <p className="text-[15px] italic leading-[1.5] text-[#1a1a1a]/40" style={PS}>
                          Passed this round
                        </p>
                      ) : (
                        <p className="whitespace-pre-line text-[15px] leading-[1.5] text-muted-ink" style={PS}>
                          {r.text}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </Section>
        ) : null}

        {data.options.length ? (
          <Section id="options">
            <Card title="The options on the table">
              <ul className="flex flex-col gap-3">
                {data.options.map((o) => (
                  <li
                    key={o.id}
                    className={`flex flex-col gap-2 rounded-2xl p-[18px] ${
                      o.winner ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-[15px] font-medium leading-[1.4]" style={PS}>
                        {o.title}
                      </p>
                      {o.winner ? (
                        <span
                          className="shrink-0 rounded-full bg-jam-yellow px-3 py-1.5 text-[11px] font-semibold leading-none text-[#1a1a1a]"
                          style={PS}
                        >
                          Winner
                        </span>
                      ) : null}
                    </div>
                    {o.body ? (
                      <p
                        className={`text-[14px] leading-[1.5] ${o.winner ? "text-white/70" : "text-[#1a1a1a]/60"}`}
                        style={PS}
                      >
                        {o.body}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between gap-4">
                      <Dots colors={o.colors} dim={o.winner} />
                      <span
                        className={`text-[13px] leading-none ${o.winner ? "text-white/70" : "text-[#1a1a1a]/50"}`}
                        style={PS}
                      >
                        {o.dots} {o.dots === 1 ? "dot" : "dots"}
                        {o.attribution ? ` · ${o.attribution}` : ""}
                      </span>
                    </div>
                  </li>
                ))}
                {data.refineDots > 0 ? (
                  <li
                    className="flex items-center justify-between rounded-2xl border border-dashed border-[#1a1a1a]/20 p-[18px] text-[14px] italic text-[#1a1a1a]/50"
                    style={PS}
                  >
                    <span>Let&apos;s refine and go again</span>
                    <span>
                      {data.refineDots} {data.refineDots === 1 ? "dot" : "dots"}
                    </span>
                  </li>
                ) : null}
              </ul>
            </Card>
          </Section>
        ) : null}

        {data.narrowedIdeas.length ? (
          <Section id="narrowed">
            <Card title="What we narrowed to">
              <ul className="flex flex-col gap-4">
                {data.narrowedIdeas.map((idea, i) => (
                  <li
                    key={i}
                    className="border-l-2 border-[#1a1a1a]/15 pl-4 text-[15px] leading-[1.5] text-muted-ink"
                    style={PS}
                  >
                    {idea}
                  </li>
                ))}
              </ul>
            </Card>
          </Section>
        ) : null}

        {data.perspectives.length ? (
          <Section id="vote">
            <Card title="The vote">
              <div className="flex flex-col gap-3">
                {data.perspectives.map((p) => (
                  <div
                    key={p.slot}
                    className={`flex flex-col gap-2 rounded-2xl p-[18px] ${
                      p.winner ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-[13px] font-semibold leading-none" style={PS}>
                        {p.label || `Path ${p.slot}`}
                      </p>
                      {p.winner ? (
                        <span
                          className="shrink-0 rounded-full bg-jam-yellow px-3 py-1.5 text-[11px] font-semibold leading-none text-[#1a1a1a]"
                          style={PS}
                        >
                          Winner
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[15px] font-medium leading-[1.4]" style={PS}>
                      {p.title}
                    </p>
                    {p.body ? (
                      <p
                        className={`text-[14px] leading-[1.5] ${p.winner ? "text-white/70" : "text-[#1a1a1a]/60"}`}
                        style={PS}
                      >
                        {p.body}
                      </p>
                    ) : null}
                    <p
                      className={`text-[13px] leading-[1.4] ${p.winner ? "text-white/70" : "text-[#1a1a1a]/50"}`}
                      style={PS}
                    >
                      {p.votes} {p.votes === 1 ? "vote" : "votes"}
                      {p.voters.length ? ` — ${p.voters.join(", ")}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        ) : null}

        {data.refineContext.length ? (
          <Section id="refined">
            <Card title="Why we refined">
              <ul className="flex flex-col gap-4">
                {data.refineContext.map((reason, i) => (
                  <li
                    key={i}
                    className="border-l-2 border-[#1a1a1a]/15 pl-4 text-[15px] italic leading-[1.5] text-muted-ink"
                    style={PS}
                  >
                    {reason}
                  </li>
                ))}
              </ul>
            </Card>
          </Section>
        ) : null}
      </main>

      {/* ── Right: sticky stage tracker + at-a-glance ───────────────────── */}
      <aside className="w-full lg:w-[340px] lg:shrink-0">
        <div className="flex flex-col gap-6 lg:sticky lg:top-8">
          <div className="flex flex-col gap-5 rounded-3xl bg-white p-6">
            <p
              className="text-[12px] font-semibold uppercase leading-none tracking-[0.08em] text-[#1a1a1a]/60"
              style={PS}
            >
              The flow
            </p>
            <ul className="flex flex-col gap-1">
              {stages.map((s) => {
                const isActive = s.id === active;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goTo(s.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[14px] leading-none transition-colors ${
                        isActive
                          ? "bg-[#f5f5f5] font-semibold text-[#1a1a1a]"
                          : "text-[#1a1a1a]/50 hover:bg-neutral-50 hover:text-[#1a1a1a]"
                      }`}
                      style={PS}
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
                          isActive ? "bg-[#1a1a1a]" : "bg-[#1a1a1a]/20"
                        }`}
                      />
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-3">
              <StepButton
                label="Previous section"
                onClick={() => step(-1)}
                disabled={active === stages[0]?.id}
              >
                ↑
              </StepButton>
              <StepButton
                label="Next section"
                onClick={() => step(1)}
                disabled={active === stages[stages.length - 1]?.id}
              >
                ↓
              </StepButton>
            </div>
          </div>

          <div className="flex flex-col gap-5 rounded-3xl bg-white p-6">
            <p
              className="text-[12px] font-semibold uppercase leading-none tracking-[0.08em] text-[#1a1a1a]/60"
              style={PS}
            >
              At a glance
            </p>
            <dl className="flex flex-col gap-3">
              <GlanceRow label="Status" value={data.statusLabel} />
              <GlanceRow
                label="Rounds"
                value={`${data.rounds} ${data.rounds === 1 ? "round" : "rounds"}`}
              />
              <GlanceRow label="Date" value={data.dateLabel} />
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[14px] leading-none text-[#1a1a1a]/50" style={PS}>
                  People
                </dt>
                <dd className="flex items-center -space-x-1.5">
                  {data.participants.map((p, i) => (
                    <Avatar key={i} name={p.name} bg={p.bg} small ring />
                  ))}
                </dd>
              </div>
              {data.files.length ? (
                <GlanceRow
                  label="Files"
                  value={`${data.files.length} attached`}
                />
              ) : null}
            </dl>
            <Link
              href={`/start?topic=${encodeURIComponent(data.topic)}`}
              className="flex items-center justify-center rounded-2xl bg-[#1a1a1a] py-[18px] text-[14px] font-medium leading-none text-white transition-colors hover:bg-black"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Run a similar jam
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

// Section anchor: scroll-mt clears the viewport band the scroll-spy watches,
// so a clicked stage lands with its heading comfortably in view.
function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={`recap-${id}`} className="scroll-mt-28">
      {children}
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 md:p-8">
      <h2
        className="text-[26px] leading-none tracking-[-0.5px] text-[#1a1a1a] md:text-[30px]"
        style={QUEENS}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Avatar({
  name,
  bg,
  small,
  ring,
}: {
  name: string;
  bg: string;
  small?: boolean;
  ring?: boolean;
}) {
  return (
    <span
      title={name}
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-[#1a1a1a] ${
        small ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-[12px]"
      } ${ring ? "ring-2 ring-white" : ""}`}
      style={{ ...PS, backgroundColor: bg }}
    >
      {(name[0] ?? "?").toUpperCase()}
    </span>
  );
}

// One small circle per dot, in each voter's avatar color — the same motif as
// the live dot-vote screen, so the recap reads as an echo of the session.
function Dots({ colors, dim }: { colors: string[]; dim?: boolean }) {
  if (!colors.length) return <span />;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {colors.map((c, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${dim ? "ring-1 ring-white/30" : ""}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </span>
  );
}

function GlanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[14px] leading-none text-[#1a1a1a]/50" style={PS}>
        {label}
      </dt>
      <dd className="text-[14px] font-medium leading-none text-[#1a1a1a]" style={PS}>
        {value}
      </dd>
    </div>
  );
}

function StepButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-[42px] flex-1 place-items-center rounded-2xl bg-[#f5f5f5] text-[16px] text-[#1a1a1a] transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
