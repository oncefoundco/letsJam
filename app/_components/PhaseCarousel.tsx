"use client";

import { useEffect, useState } from "react";
import { PhaseMockup } from "@/app/_components/PhaseMockup";
import { Reveal } from "@/app/_components/Reveal";

/*
 * The four moves of a Jam, as an auto-advancing feature carousel. Each slide is
 * a Figma-designed phase screen (pastel background, headline + app-window
 * mockup baked in) shown on its matching pastel; the per-phase descriptions
 * live in the display-only bottom tabs, where the active tab is bright and its
 * underline fills over the slide duration. Auto-advance runs continuously;
 * prefers-reduced-motion disables it and shows the bar full.
 */

const EASE = "cubic-bezier(0.25, 1, 0.5, 1)";
const SLIDE_MS = 6000;
const dmSans = { fontFamily: "var(--font-dm-sans)" } as const;

type Phase = {
  key: string;
  title: string;
  lead: string;
  bg: string;
};

const PHASES: Phase[] = [
  {
    key: "Converse",
    title: "Start by getting it all on the table",
    lead: "Talk the problem through out loud while Jam quietly captures the decisions you're actually making.",
    bg: "#fcfad9",
  },
  {
    key: "Diverge",
    title: "Then reflect on what actually matters",
    lead: "Everyone writes their own take first, so no one just nods along with whoever's loudest.",
    bg: "#d2efdb",
  },
  {
    key: "Collaborate",
    title: "Shape the options together",
    lead: "Priorities go up at once, Jam groups the overlaps, and you vote on what a good answer has to nail.",
    bg: "#dbe9fb",
  },
  {
    key: "Decide",
    title: "Make a call the whole room is behind",
    lead: "Weigh the options against what matters and vote. If a few still feel off, you go again.",
    bg: "#f8dfdd",
  },
];

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
    <span className="block h-[2px] w-full overflow-hidden bg-black/15">
      {active ? (
        <span
          key={activeKey}
          className="block h-full w-full origin-left bg-black"
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
      <style>{`@keyframes lj-phase-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
      <Reveal as="section" className="w-full">
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="The four moves of a Jam"
          className="relative h-[82svh] min-h-[500px] w-full overflow-hidden lg:h-[100svh] lg:min-h-[600px]"
        >
          {/* Slides: crossfade between the phase screens on their pastel bg. */}
          {PHASES.map((p, i) => (
            <div
              key={p.key}
              aria-hidden={i !== active}
              className="absolute inset-0"
              style={{
                backgroundColor: p.bg,
                opacity: i === active ? 1 : 0,
                transition: `opacity 700ms ${EASE}`,
              }}
            >
              <div className="flex h-full flex-col items-center px-6 pt-[clamp(2rem,7vh,5.5rem)] pb-[11rem] lg:pb-[clamp(7.5rem,20vh,12rem)]">
                <h2 className="heading-display w-full max-w-[18ch] self-start whitespace-normal text-left text-[clamp(2.5rem,11vw,3.25rem)] leading-[1.05] tracking-[-0.02em] text-black [text-wrap:balance] lg:max-w-none lg:self-center lg:whitespace-nowrap lg:text-center lg:text-[clamp(1.25rem,5vw,2.875rem)] lg:leading-[1.05]">
                  {p.title}
                </h2>
                {/* The window is centered in the space between the headline and
                    the bottom (Decide/Converse) section — pb above matches the
                    copy block's height, so the gaps above and below are equal. */}
                <div className="flex w-full flex-1 items-center justify-center lg:mt-[clamp(1.5rem,4vh,3rem)]">
                  <PhaseMockup variant={p.key} />
                </div>
              </div>
            </div>
          ))}

          {/* Display-only tabs: per-phase descriptions; active is bright with a
              filling line, the rest a dim, empty track. */}
          <div className="absolute inset-x-0 bottom-0 z-[2] px-6 pb-7 lg:px-10 lg:pb-10">
            {/* Desktop: all four. */}
            <div className="mx-auto hidden max-w-[1240px] grid-cols-4 gap-8 lg:grid">
              {PHASES.map((p, i) => {
                const isActive = i === active;
                return (
                  <div
                    key={p.key}
                    aria-current={isActive}
                    className="flex h-full flex-col items-start text-left transition-opacity duration-300"
                    style={{ opacity: isActive ? 1 : 0.45 }}
                  >
                    <span
                      className="text-[18px] font-medium leading-none text-black"
                      style={dmSans}
                    >
                      {p.key}
                    </span>
                    <span
                      className="mt-3 text-[13px] leading-[1.4] text-black/60"
                      style={dmSans}
                    >
                      {p.lead}
                    </span>
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

            {/* Mobile: active phase's copy, then a row of progress segments.
                Left edge tracks the SVG window (px-6 + max-w-[860px]). */}
            <div className="mx-auto w-full max-w-[860px] lg:hidden">
              <div className="relative min-h-[8rem]">
                {PHASES.map((p, i) => (
                  <div
                    key={p.key}
                    aria-hidden={i !== active}
                    className="absolute inset-0"
                    style={{
                      opacity: i === active ? 1 : 0,
                      transition: `opacity 500ms ${EASE}`,
                    }}
                  >
                    <p
                      className="text-[clamp(1.5rem,5vw,2rem)] font-medium leading-none text-black"
                      style={dmSans}
                    >
                      {p.key}
                    </p>
                    <p
                      className="mt-3 max-w-[42ch] text-[clamp(1.125rem,4.5vw,1.5rem)] leading-[1.35] text-black/60 [text-wrap:balance]"
                      style={dmSans}
                    >
                      {p.lead}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                {PHASES.map((p, i) => (
                  <div key={p.key} className="min-w-0 flex-1">
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
      </Reveal>
    </>
  );
}
