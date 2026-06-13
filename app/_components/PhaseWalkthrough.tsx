"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhaseMockup } from "@/app/_components/PhaseMockup";

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

// The stacked walkthrough gives the mockup its own panel: the window fills the
// panel (object-cover) anchored top-left, so it reads large and the right
// sidebar / bottom edge bleed off — matching the near-full-bleed window in the
// Figma comp, rather than a small letterboxed object-contain image.
const MOCKUP_CLASS = "h-full w-full select-none object-cover object-left-top";

type Phase = {
  key: string;
  title: React.ReactNode;
  body: string;
  visual: React.ReactNode;
};

const PHASES: Phase[] = [
  {
    key: "Converse",
    title: "Start by getting it all on the table.",
    body: "Every meeting kicks off with someone's version of the problem, and it's never quite the whole picture. So you just talk it through — keep it short. And while you're talking, Jam's quietly pulling out the decisions you're actually making, so you don't walk away with a page of notes and nothing decided.",
    visual: <PhaseMockup variant="Converse" className={MOCKUP_CLASS} />,
  },
  {
    key: "Diverge",
    title: "Then reflect on what actually matters.",
    body: "Here's the bit most meetings skip. Before the room rallies around anything, everyone goes quiet and writes down what they think on their own — so nobody's just nodding along with whoever's loudest. First time round, it's your three priorities for the problem. Later on, it's your one best solution.",
    visual: <PhaseMockup variant="Diverge" className={MOCKUP_CLASS} />,
  },
  {
    key: "Collaborate",
    title: "Now shape the options together.",
    body: "This is the part that makes the rest work. Everyone's priorities go up at once, Jam groups the ones that are really the same thing, and you vote down to the three the solution has to nail. So you've agreed what good actually looks like before anyone's pitched a single idea.",
    visual: <PhaseMockup variant="Collaborate" className={MOCKUP_CLASS} />,
  },
  {
    key: "Decide",
    title: "And make a call the whole room's behind.",
    body: "Most decisions are just the loudest person's preference dressed up as agreement — and they fall apart the second someone pushes back later. So here you weigh the solutions against those three things and vote. And if a couple of people still feel something's off, you go again. Nothing's final till everyone's actually been heard.",
    visual: <PhaseMockup variant="Decide" className={MOCKUP_CLASS} />,
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
              <div className="relative h-[clamp(360px,52svh,520px)] w-full">
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
                <div className="flex flex-col gap-8 lg:h-[440px] lg:flex-row lg:gap-24">
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
  // The panel has its own height (taller on mobile via the clamp; on desktop it
  // self-stretches to the row), clips the overflow, and lets the mockup fill it
  // from the top via object-cover (see MOCKUP_CLASS).
  return (
    <div className="relative h-[clamp(240px,58vw,360px)] w-full min-w-0 overflow-hidden rounded-[20px] lg:h-auto lg:flex-1 lg:self-stretch lg:rounded-[24px]">
      {phase.visual}
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
            className="group flex items-center text-left focus-visible:outline-none"
          >
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
      <div className="flex shrink-0 items-center lg:hidden">
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
