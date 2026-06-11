"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Reveal } from "@/app/_components/Reveal";

/*
 * The four moves of a Jam, as an auto-advancing feature carousel (everyday.io
 * pattern). Each slide is a near full-screen mockup with the active phase's
 * headline up top and the per-phase descriptions in the bottom tabs — the
 * active tab is bright, reveals its phase mark (▶ ■ ● ◆), and its underline
 * fills over the slide duration as the progress indicator. Every mockup is a
 * light app window on a dark studio backdrop, so a top/bottom gradient keeps the
 * white headline + tabs legible while the centered window stays clear.
 * Auto-advance runs continuously (no hover/focus pause); prefers-reduced-motion
 * disables it (tabs still work) and the progress bar shows full.
 *
 * Copy reused from the prior PhaseWalkthrough; images are letsJam-branded
 * placeholder mockups (public/landing/mock-*.png) pending real product shots.
 */

const EASE = "cubic-bezier(0.25, 1, 0.5, 1)";
const SLIDE_MS = 6000;

const dmSans = { fontFamily: "var(--font-dm-sans)" } as const;

type Shape = "triangle" | "square" | "circle" | "diamond";

type Phase = {
  key: string;
  title: string;
  lead: string;
  image: string;
  alt: string;
  icon: Shape;
};

const PHASES: Phase[] = [
  {
    key: "Converse",
    title: "Start by getting it all on the table.",
    lead: "Talk the problem through out loud while Jam quietly captures the decisions you're actually making.",
    image: "/landing/mock-converse.png",
    alt: "The letsJam call: the team talking the problem through",
    icon: "triangle",
  },
  {
    key: "Diverge",
    title: "Then reflect on what actually matters.",
    lead: "Everyone writes their own take first, so no one just nods along with whoever's loudest.",
    image: "/landing/mock-diverge.png",
    alt: "A private space to write down your own thinking",
    icon: "square",
  },
  {
    key: "Collaborate",
    title: "Shape the options together.",
    lead: "Priorities go up at once, Jam groups the overlaps, and you vote on what a good answer has to nail.",
    image: "/landing/mock-collaborate.png",
    alt: "Dot-voting to shape the options together",
    icon: "circle",
  },
  {
    key: "Decide",
    title: "Make a call the whole room's behind.",
    lead: "Weigh the options against what matters and vote. If a few still feel off, you go again.",
    image: "/landing/mock-decide.png",
    alt: "The decision the whole room is behind",
    icon: "diamond",
  },
];

// Each phase's mark: ▶ Converse, ■ Diverge, ● Collaborate, ◆ Decide.
function PhaseIcon({
  shape,
  className,
  style,
}: {
  shape: Shape;
  className?: string;
  style?: React.CSSProperties;
}) {
  const p = { className, style, viewBox: "0 0 24 24", fill: "currentColor" } as const;
  switch (shape) {
    case "triangle":
      return (
        <svg {...p} aria-hidden>
          <path d="M6 3.5l14.5 8.5L6 20.5z" />
        </svg>
      );
    case "square":
      return (
        <svg {...p} aria-hidden>
          <rect x="4" y="4" width="16" height="16" rx="3" />
        </svg>
      );
    case "circle":
      return (
        <svg {...p} aria-hidden>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "diamond":
      return (
        <svg {...p} aria-hidden>
          <path d="M12 2.2l9.8 9.8-9.8 9.8L2.2 12z" />
        </svg>
      );
  }
}

function ProgressBar({
  active,
  reduced,
  activeKey,
}: {
  active: boolean;
  reduced: boolean;
  activeKey: number;
}) {
  return (
    <span className="block h-[2px] w-full overflow-hidden bg-white/25">
      <span
        key={active ? `on-${activeKey}` : "off"}
        className="block h-full w-full origin-left bg-white"
        style={
          active
            ? reduced
              ? { transform: "scaleX(1)" }
              : { animation: `lj-phase-progress ${SLIDE_MS}ms linear both` }
            : { transform: "scaleX(0)" }
        }
      />
    </span>
  );
}

export function PhaseCarousel() {
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Auto-advance — keeps running regardless of hover/focus. Re-runs on each
  // slide change so a manual tap also resets the clock; reduced-motion disables.
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(
      () => setActive((a) => (a + 1) % PHASES.length),
      SLIDE_MS,
    );
    return () => clearTimeout(t);
  }, [active, reduced]);

  return (
    <Reveal as="section" className="px-3 pb-24 lg:px-4">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="The four moves of a Jam"
        className="relative aspect-[4/5] w-full overflow-hidden bg-[#0c0c0e] sm:aspect-[16/10] lg:aspect-auto lg:h-[100svh] lg:min-h-[640px]"
      >
        {/* Slides: crossfade between the mockups. */}
        {PHASES.map((p, i) => (
          <div
            key={p.key}
            aria-hidden={i !== active}
            className="absolute inset-0"
            style={{
              opacity: i === active ? 1 : 0,
              transition: `opacity 800ms ${EASE}`,
            }}
          >
            <Image
              src={p.image}
              alt={p.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}

        {/* Legibility: darken the top and bottom bands (headline + tabs) while
            leaving the centered app window clear. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.05)_26%,rgba(0,0,0,0.05)_66%,rgba(0,0,0,0.65)_100%)]"
        />

        {/* Foreground: headline up top, tabs at the bottom. */}
        <div className="relative z-[2] flex h-full flex-col">
          {/* Top copy — the active phase headline. */}
          <div className="px-6 pt-10 text-center sm:pt-14 lg:px-12 lg:pt-16">
            <div className="relative mx-auto min-h-[3.5rem] max-w-[48rem] sm:min-h-[4.5rem] lg:min-h-[5rem]">
              {PHASES.map((p, i) => (
                <h2
                  key={p.key}
                  aria-hidden={i !== active}
                  className="heading-display absolute inset-x-0 top-0 text-[clamp(1.875rem,4vw,3.5rem)] leading-[0.96] text-white [text-wrap:balance]"
                  style={{
                    opacity: i === active ? 1 : 0,
                    transition: `opacity 700ms ${EASE}`,
                  }}
                >
                  {p.title}
                </h2>
              ))}
            </div>
          </div>

          <div className="flex-1" />

          {/* Tabs — per-phase descriptions; active is bright + shows its mark. */}
          <nav
            aria-label="Jam phases"
            className="px-4 pb-7 sm:px-6 lg:px-10 lg:pb-10"
          >
            {/* Desktop: all four, name + description + mark + progress. */}
            <div className="mx-auto hidden max-w-[1240px] grid-cols-4 gap-8 lg:grid">
              {PHASES.map((p, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={isActive}
                    aria-label={`Show ${p.key}`}
                    className="flex h-full flex-col items-start text-left outline-none transition-opacity duration-300 focus-visible:opacity-100"
                    style={{ opacity: isActive ? 1 : 0.5 }}
                  >
                    {/* Mark appears next to the name on the active tab; its
                        slot is always reserved so the name never shifts. */}
                    <span className="flex items-center gap-2.5">
                      <PhaseIcon
                        shape={p.icon}
                        className="h-4 w-4 flex-none text-white transition-opacity duration-300"
                        style={{ opacity: isActive ? 1 : 0 }}
                      />
                      <span
                        className="text-[18px] font-medium leading-none text-white"
                        style={dmSans}
                      >
                        {p.key}
                      </span>
                    </span>
                    <span
                      className="mt-3 text-[13px] leading-[1.4] text-white/75"
                      style={dmSans}
                    >
                      {p.lead}
                    </span>
                    {/* Progress bar, pinned to the bottom (unchanged). */}
                    <span className="mt-auto w-full pt-5">
                      <ProgressBar
                        active={isActive}
                        reduced={reduced}
                        activeKey={active}
                      />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mobile: active phase's mark + copy, then a row of progress segments. */}
            <div className="lg:hidden">
              <div className="relative min-h-[6.5rem]">
                {PHASES.map((p, i) => (
                  <div
                    key={p.key}
                    aria-hidden={i !== active}
                    className="absolute inset-0"
                    style={{
                      opacity: i === active ? 1 : 0,
                      transition: `opacity 500ms ${EASE}`,
                      pointerEvents: i === active ? "auto" : "none",
                    }}
                  >
                    <p
                      className="flex items-center gap-2.5 text-[18px] font-medium leading-none text-white"
                      style={dmSans}
                    >
                      <PhaseIcon
                        shape={p.icon}
                        className="h-4 w-4 flex-none text-white"
                      />
                      {p.key}
                    </p>
                    <p
                      className="mt-2 text-[13px] leading-[1.4] text-white/75"
                      style={dmSans}
                    >
                      {p.lead}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                {PHASES.map((p, i) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Show ${p.key}`}
                    className="min-w-0 flex-1 py-1 outline-none"
                  >
                    <ProgressBar
                      active={i === active}
                      reduced={reduced}
                      activeKey={active}
                    />
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </Reveal>
  );
}
