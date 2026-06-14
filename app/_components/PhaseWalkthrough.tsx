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
  const stageRef = useRef<HTMLDivElement>(null);
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
        const stage = stageRef.current;
        if (!el || !stage) return;
        // The pinned scroll distance is the track height minus the *sticky
        // stage* height — NOT window.innerHeight. On mobile innerHeight shrinks
        // and grows as the address bar shows/hides during a scroll, which moved
        // this denominator underneath us and made the active index flip back
        // and forth at a card boundary (the "shake"). The stage is sized in svh
        // (a stable unit), so measuring it keeps the mapping put.
        const total = el.offsetHeight - stage.offsetHeight;
        const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), total);
        const p = total > 0 ? scrolled / total : 0;
        const pos = p * PHASES.length; // 0..PHASES.length, in card units
        // Hysteresis: only cross into the next/previous card once we're a little
        // past the boundary, so a few px of momentum wobble can't toggle it.
        const MARGIN = 0.12;
        setActive((prev) => {
          let next = prev;
          if (pos >= prev + 1 + MARGIN) next = Math.floor(pos);
          else if (pos < prev - MARGIN) next = Math.floor(pos);
          return Math.min(PHASES.length - 1, Math.max(0, next));
        });
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
    const stageH = stageRef.current?.offsetHeight ?? window.innerHeight;
    const total = el.offsetHeight - stageH;
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
      {enhanced ? (
        <div
          ref={stageRef}
          className="sticky top-0 flex h-[100svh] flex-col items-stretch justify-center gap-16 lg:gap-28"
        >
          <SectionHeading />
          <div className="mx-auto flex w-full max-w-[1758px] flex-col items-stretch gap-5 lg:flex-row lg:gap-6 xl:gap-10">
            <Legend active={active} onJump={jump} />
            <div className="relative min-w-0 flex-1 rounded-[24px] bg-white p-6 md:p-10 lg:rounded-[32px] xl:p-16">
              <div className="relative h-[clamp(360px,52svh,520px)] w-full">
                {PHASES.map((phase, i) => (
                  <div
                    key={phase.key}
                    aria-hidden={i !== active}
                    className="absolute inset-0 flex flex-col justify-center gap-5 lg:flex-row lg:justify-start lg:gap-6 xl:gap-8"
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
        <div className="mx-auto flex max-w-[1758px] flex-col gap-12 py-12 lg:gap-16 lg:py-20">
          <SectionHeading />
          {PHASES.map((phase, i) => (
            <div
              key={phase.key}
              className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-10"
            >
              <StaticLegend active={i} />
              <div className="min-w-0 flex-1 rounded-[28px] bg-white p-6 md:p-10 lg:rounded-[32px] lg:p-16">
                <div className="flex flex-col gap-8 lg:h-[440px] lg:flex-row lg:gap-8">
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

// The section title shown above the phases ("How does it work?"), centered.
// Doubles as the section's accessible heading (the section keeps its
// aria-label too).
function SectionHeading() {
  return (
    <h2
      className="heading-display text-center text-[clamp(2.5rem,7vw,5rem)] leading-[0.9] tracking-[-0.03em] text-black"
      style={{ fontWeight: 300 }}
    >
      How does it work?
    </h2>
  );
}

function PhaseText({ phase }: { phase: Phase }) {
  return (
    <div className="flex flex-col gap-3 lg:h-full lg:w-[300px] lg:shrink-0 lg:justify-between lg:gap-8 xl:w-[330px]">
      <h3 className="heading-display text-[clamp(1.5rem,5vw,2.5rem)] leading-[0.9] text-black [text-wrap:balance]">
        {phase.title}
      </h3>
      <p
        className="max-w-[440px] text-[13px] leading-[1.45] tracking-[-0.14px] text-[color:var(--color-muted-ink)] lg:text-[15px] lg:leading-[1.4]"
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
      className="flex shrink-0 flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1 self-center lg:w-[120px] lg:flex-col lg:flex-nowrap lg:items-start lg:justify-start lg:gap-4 lg:self-start"
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
              className="whitespace-nowrap text-[14px] leading-[0.9] text-black lg:text-[15px]"
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
      <div className="hidden shrink-0 lg:flex lg:w-[120px] lg:flex-col lg:justify-start lg:gap-4">
        {PHASES.map((phase, i) => (
          <span
            key={phase.key}
            className={`text-[15px] leading-[0.9] text-black ${
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
