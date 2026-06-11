"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Reveal } from "@/app/_components/Reveal";

/*
 * The four moves of a Jam, as an auto-advancing feature carousel (everyday.io
 * pattern). Each slide is a near full-screen mockup with the active phase's
 * headline up top and the per-phase descriptions in the bottom tabs — the
 * active tab is bright and its underline fills over the slide duration as the
 * progress indicator while the others stay a dim, empty track. Every mockup is a
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

type Phase = {
  key: string;
  title: string;
  lead: string;
  image: string;
  alt: string;
};

const PHASES: Phase[] = [
  {
    key: "Converse",
    title: "Start by getting it all on the table.",
    lead: "Talk the problem through out loud while Jam quietly captures the decisions you're actually making.",
    image: "/landing/mock-converse.png",
    alt: "The letsJam call: the team talking the problem through",
  },
  {
    key: "Diverge",
    title: "Then reflect on what actually matters.",
    lead: "Everyone writes their own take first, so no one just nods along with whoever's loudest.",
    image: "/landing/mock-diverge.png",
    alt: "A private space to write down your own thinking",
  },
  {
    key: "Collaborate",
    title: "Shape the options together.",
    lead: "Priorities go up at once, Jam groups the overlaps, and you vote on what a good answer has to nail.",
    image: "/landing/mock-collaborate.png",
    alt: "Dot-voting to shape the options together",
  },
  {
    key: "Decide",
    title: "Make a call the whole room's behind.",
    lead: "Weigh the options against what matters and vote. If a few still feel off, you go again.",
    image: "/landing/mock-decide.png",
    alt: "The decision the whole room is behind",
  },
];

// The active tab's line fills left-to-right over the slide duration (mirrors
// everyday.io). The fill is rendered ONLY on the active tab and keyed by the
// active index, so it mounts fresh — and replays — on every slide. Inactive
// tabs are just an empty track.
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
    <span className="block h-[2px] w-full overflow-hidden bg-white/20">
      {active ? (
        <span
          key={activeKey}
          className="block h-full w-full origin-left bg-white"
          style={
            reduced
              ? { transform: "scaleX(1)" }
              : {
                  transform: "scaleX(0)",
                  animation: `${SLIDE_MS}ms linear 0s 1 normal forwards lj-phase-progress`,
                }
          }
        />
      ) : null}
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
    <>
      {/* Keyframe shipped with the component so the progress fill never depends
          on globals.css being in the loaded CSS chunk (Turbopack dev can miss
          @keyframes edits without a restart). */}
      <style>{`@keyframes lj-phase-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
      <Reveal as="section" className="w-full">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="The four moves of a Jam"
        className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-[#0c0c0e]"
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

          {/* Tabs — display-only per-phase descriptions; active is bright with a
              filling line (not clickable; the carousel only auto-advances). */}
          <div className="px-4 pb-7 sm:px-6 lg:px-10 lg:pb-10">
            {/* Desktop: all four, name + description + progress line. */}
            <div className="mx-auto hidden max-w-[1240px] grid-cols-4 gap-8 lg:grid">
              {PHASES.map((p, i) => {
                const isActive = i === active;
                return (
                  <div
                    key={p.key}
                    aria-current={isActive}
                    className="flex h-full flex-col items-start text-left transition-opacity duration-300"
                    style={{ opacity: isActive ? 1 : 0.5 }}
                  >
                    <span
                      className="text-[18px] font-medium leading-none text-white"
                      style={dmSans}
                    >
                      {p.key}
                    </span>
                    <span
                      className="mt-3 text-[13px] leading-[1.4] text-white/75"
                      style={dmSans}
                    >
                      {p.lead}
                    </span>
                    {/* Bottom-pinned progress line: the active one fills, the
                        rest stay an empty gray track. */}
                    <span className="mt-auto w-full pt-5">
                      <ProgressBar
                        active={isActive}
                        reduced={reduced}
                        activeKey={active}
                      />
                    </span>
                  </div>
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
                      className="text-[18px] font-medium leading-none text-white"
                      style={dmSans}
                    >
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
                  <div key={p.key} className="min-w-0 flex-1 py-1">
                    <ProgressBar
                      active={i === active}
                      reduced={reduced}
                      activeKey={active}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
    </>
  );
}
