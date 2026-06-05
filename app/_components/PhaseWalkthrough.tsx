"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/*
 * PhaseWalkthrough — the four-step methodology, told as one pinned canvas.
 *
 * On a wide viewport with motion allowed, the section becomes a tall scroll
 * track with a sticky stage: the legend (Converse / Diverge / Collaborate /
 * Decide) drives the active phase, the title and product visual crossfade in,
 * and the legend marks where you are. The legend is also clickable to jump.
 *
 * On a narrow viewport, or when the visitor prefers reduced motion (or has no
 * JS), it degrades to the four stacked cards from the comp — every phase
 * visible, no pinning, no scroll hijacking. That stacked layout is the SSR /
 * first-paint baseline, so content is never gated on a class-triggered reveal.
 */

const dmSans = { fontFamily: "var(--font-dm-sans)" } as const;
const publicSans = { fontFamily: "var(--font-public-sans)" } as const;

// Exponential ease-out. No bounce, no elastic (per the design system).
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type Phase = {
  key: string;
  title: React.ReactNode;
  body: string;
  visual: React.ReactNode;
};

const PHASES: Phase[] = [
  {
    key: "Converse",
    title: (
      <>
        Start by talking
        <br />
        it out.
      </>
    ),
    body: "A short, time-boxed discussion to surface what's really going on. While you talk, the decisions you're actually making get pulled into a list, so you leave with calls to make, not a transcript.",
    visual: (
      <Image
        src="/landing/feature-converse.png"
        alt="A letsJam video call with the team talking it out"
        fill
        sizes="(min-width: 1024px) 900px, 100vw"
        className="object-cover"
      />
    ),
  },
  {
    key: "Diverge",
    title: "Reflect by yourself on what matters.",
    body: "Everyone writes their take privately against the same prompt. Nothing is visible until the timer's up, so the room sees what each person actually thinks, not what they say after hearing someone else.",
    visual: <ReflectVisual />,
  },
  {
    key: "Collaborate",
    title: "Align on what matters most.",
    body: "Once everyone's thinking is on the table, you don't end up with twenty half-formed opinions or one watered-down compromise. You get real options to choose between, each shaped by whose thinking shaped it.",
    visual: <AlignVisual />,
  },
  {
    key: "Decide",
    title: "Decide on the best way forward.",
    body: "Vote openly, commit publicly. If two people aren't on board, it goes back for another round. If you're in the minority, you write down why, and that travels with the decision so nobody relitigates it in Slack on Thursday.",
    visual: <DecideVisual />,
  },
];

export function PhaseWalkthrough() {
  const sectionRef = useRef<HTMLElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [active, setActive] = useState(0);
  const reducedRef = useRef(false);

  // Decide once mounted whether to run the pinned experience. Wide viewport +
  // motion allowed only; otherwise we keep the stacked baseline that SSR drew.
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedRef.current = motion.matches;
      // Run the pinned experience at every width; only reduced-motion opts out
      // (it gets the stacked fallback below).
      setEnhanced(!motion.matches);
    };
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  // Map scroll position within the track to the active phase index.
  useEffect(() => {
    if (!enhanced) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = sectionRef.current;
        if (!el) return;
        const total = el.offsetHeight - window.innerHeight;
        const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), total);
        const p = total > 0 ? scrolled / total : 0;
        const idx = Math.min(PHASES.length - 1, Math.floor(p * PHASES.length));
        setActive((prev) => (prev === idx ? prev : idx));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enhanced]);

  const jump = useCallback((i: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const target = el.offsetTop + ((i + 0.5) / PHASES.length) * total;
    window.scrollTo({
      top: target,
      behavior: reducedRef.current ? "auto" : "smooth",
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="How a Jam session works"
      className="relative px-6 md:px-8 lg:px-12 xl:px-[80px]"
      style={enhanced ? { height: `${PHASES.length * 100}vh` } : undefined}
    >
      <h2 className="sr-only">How a Jam session works</h2>

      {enhanced ? (
        <div className="sticky top-0 flex h-[100svh] items-center">
          <div className="mx-auto flex w-full max-w-[1758px] flex-col items-stretch gap-5 lg:flex-row lg:gap-8 xl:gap-[72px]">
            <Legend active={active} onJump={jump} />
            <div className="relative min-w-0 flex-1 rounded-[24px] bg-white p-6 md:p-10 lg:rounded-[32px] xl:p-16">
              <div className="relative h-[clamp(420px,62svh,600px)] w-full">
                {PHASES.map((phase, i) => (
                  <div
                    key={phase.key}
                    aria-hidden={i !== active}
                    className="absolute inset-0 flex flex-col justify-center gap-5 lg:flex-row lg:justify-start lg:gap-12 xl:gap-24"
                    style={{
                      opacity: i === active ? 1 : 0,
                      transform: i === active ? "none" : "translateY(12px)",
                      transition: `opacity 600ms ${EASE}, transform 600ms ${EASE}`,
                      pointerEvents: i === active ? "auto" : "none",
                    }}
                  >
                    <PhaseText phase={phase} />
                    <PhaseVisual phase={phase} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-[1758px] flex-col gap-16 py-12 lg:gap-28 lg:py-20">
          {PHASES.map((phase, i) => (
            <div
              key={phase.key}
              className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-[72px]"
            >
              <StaticLegend active={i} />
              <div className="min-w-0 flex-1 rounded-[28px] bg-white p-6 md:p-10 lg:rounded-[32px] lg:p-16">
                <div className="flex flex-col gap-8 lg:h-[480px] lg:flex-row lg:gap-24">
                  <PhaseText phase={phase} />
                  <PhaseVisual phase={phase} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PhaseText({ phase }: { phase: Phase }) {
  return (
    <div className="flex flex-col gap-3 lg:h-full lg:w-[420px] lg:shrink-0 lg:justify-between lg:gap-8">
      <h3 className="heading-display text-[clamp(1.5rem,6.5vw,3.5rem)] leading-[0.85] text-black [text-wrap:balance]">
        {phase.title}
      </h3>
      <p
        className="max-w-[440px] text-[14px] leading-[1.4] tracking-[-0.16px] text-[color:var(--color-muted-ink)] lg:text-[18px] lg:leading-[1.25]"
        style={dmSans}
      >
        {phase.body}
      </p>
    </div>
  );
}

function PhaseVisual({ phase }: { phase: Phase }) {
  return (
    <div className="relative min-h-0 min-w-0 flex-1">
      <div className="relative mx-auto h-full w-full overflow-hidden rounded-[20px] lg:rounded-[24px]">
        <div className="relative aspect-[930/576] h-full max-h-full w-full lg:absolute lg:inset-0 lg:aspect-auto">
          {phase.visual}
        </div>
      </div>
    </div>
  );
}

function Legend({
  active,
  onJump,
}: {
  active: number;
  onJump: (i: number) => void;
}) {
  return (
    <nav
      aria-label="Session phases"
      className="flex shrink-0 flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1 self-center lg:w-[150px] lg:flex-col lg:flex-nowrap lg:items-start lg:justify-center lg:gap-7"
    >
      {PHASES.map((phase, i) => {
        const on = i === active;
        return (
          <button
            key={phase.key}
            type="button"
            onClick={() => onJump(i)}
            aria-current={on ? "step" : undefined}
            className="group flex items-center gap-3 text-left focus-visible:outline-none"
          >
            <span
              aria-hidden
              className="hidden h-[2px] w-7 shrink-0 origin-left rounded-full bg-black lg:block"
              style={{
                transform: `scaleX(${on ? 1 : 0.43})`,
                opacity: on ? 1 : 0.25,
                transition: `transform 500ms ${EASE}, opacity 500ms ${EASE}`,
              }}
            />
            <span
              className="whitespace-nowrap text-[14px] leading-[0.9] text-black lg:text-[20px]"
              style={{
                ...publicSans,
                opacity: on ? 1 : 0.3,
                transition: `opacity 500ms ${EASE}`,
              }}
            >
              {phase.key}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// Static legend for the stacked fallback. On mobile each card shows only its
// own step (a single labelled marker), so the legend never wraps into broken-
// looking navigation. On desktop it's the full vertical list from the comp,
// with the active phase lit and the rest dimmed.
function StaticLegend({ active }: { active: number }) {
  return (
    <>
      <div className="flex shrink-0 items-center gap-3 lg:hidden">
        <span aria-hidden className="h-[2px] w-7 shrink-0 rounded-full bg-black" />
        <span className="text-[18px] leading-[0.9] text-black" style={publicSans}>
          {PHASES[active].key}
        </span>
      </div>
      <div className="hidden shrink-0 lg:flex lg:w-[108px] lg:flex-col lg:justify-center lg:gap-6">
        {PHASES.map((phase, i) => (
          <span
            key={phase.key}
            className={`text-[20px] leading-[0.9] text-black ${
              i === active ? "" : "opacity-30"
            }`}
            style={publicSans}
          >
            {phase.key}
          </span>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Product vignettes — clean, on-brand mockups standing in for screens  */
/* we don't have shots of yet. Paper surfaces, ink text, one blue spark. */
/* ------------------------------------------------------------------ */

function VisualFrame({
  wash,
  children,
}: {
  wash: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      className="flex h-full w-full items-center justify-center p-6 sm:p-10 lg:p-14"
      style={{ background: wash }}
    >
      {children}
    </div>
  );
}

function Bar({ w, dim = false }: { w: string; dim?: boolean }) {
  return (
    <span
      className="block h-[7px] rounded-full"
      style={{ width: w, background: dim ? "rgba(3,3,3,0.12)" : "rgba(3,3,3,0.22)" }}
    />
  );
}

// Diverge: three private reflections, locked until the timer ends.
function ReflectVisual() {
  return (
    <VisualFrame wash="var(--color-jam-blue)">
      <div className="flex w-full max-w-[460px] flex-col gap-4 rounded-[20px] bg-white/85 p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <span
            className="text-[14px] text-black/55"
            style={dmSans}
          >
            Reflecting privately
          </span>
          <span
            className="rounded-full bg-[#ebeffa] px-3 py-1 text-[13px] font-medium tabular-nums text-[#3c5bcb]"
            style={dmSans}
          >
            01:48
          </span>
        </div>
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="flex items-center gap-3 rounded-[14px] bg-[#f5f5f5] px-4 py-3"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/10 text-black/40">
              <LockGlyph />
            </span>
            <span className="flex flex-1 flex-col gap-[6px]">
              <Bar w="78%" />
              <Bar w="52%" dim />
            </span>
          </div>
        ))}
      </div>
    </VisualFrame>
  );
}

// Collaborate: scattered thinking grouped into a few real options.
function AlignVisual() {
  const buckets: { label: string; cards: number }[] = [
    { label: "Speed", cards: 2 },
    { label: "Quality", cards: 3 },
    { label: "Cost", cards: 1 },
  ];
  return (
    <VisualFrame wash="var(--color-jam-yellow)">
      <div className="grid w-full max-w-[520px] grid-cols-3 gap-3 sm:gap-4">
        {buckets.map((bucket) => (
          <div
            key={bucket.label}
            className="flex flex-col gap-2 rounded-[16px] bg-white/85 p-3 sm:p-4"
          >
            <span
              className="text-[13px] font-medium text-black"
              style={dmSans}
            >
              {bucket.label}
            </span>
            {Array.from({ length: bucket.cards }).map((_, i) => (
              <span
                key={i}
                className="flex flex-col gap-[5px] rounded-[10px] bg-[#f5f5f5] px-3 py-[10px]"
              >
                <Bar w="86%" />
                <Bar w="60%" dim />
              </span>
            ))}
          </div>
        ))}
      </div>
    </VisualFrame>
  );
}

// Decide: open dot-vote, one option pulling ahead.
function DecideVisual() {
  const options = [
    { dots: 5, lead: true },
    { dots: 3, lead: false },
    { dots: 1, lead: false },
  ];
  return (
    <VisualFrame wash="var(--color-jam-blue)">
      <div className="flex w-full max-w-[460px] flex-col gap-3 rounded-[20px] bg-white/85 p-5 sm:p-7">
        {options.map((opt, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-[14px] px-4 py-3"
            style={{
              background: opt.lead ? "#ebeffa" : "#f5f5f5",
              boxShadow: opt.lead ? "inset 0 0 0 1.5px rgba(60,91,203,0.35)" : "none",
            }}
          >
            <span className="flex flex-1 flex-col gap-[6px]">
              <Bar w={opt.lead ? "70%" : "58%"} />
              <Bar w="40%" dim />
            </span>
            <span className="flex shrink-0 items-center gap-[5px]">
              {Array.from({ length: 5 }).map((_, d) => (
                <span
                  key={d}
                  className="h-[10px] w-[10px] rounded-full"
                  style={{
                    background: d < opt.dots ? "#3c5bcb" : "rgba(3,3,3,0.10)",
                  }}
                />
              ))}
            </span>
          </div>
        ))}
      </div>
    </VisualFrame>
  );
}

function LockGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
