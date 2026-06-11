"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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
  lead: string;
  image: string;
  bg: string;
};

const PHASES: Phase[] = [
  {
    key: "Converse",
    lead: "Talk the problem through out loud while Jam quietly captures the decisions you're actually making.",
    image: "/landing/slide-converse.png",
    bg: "#fcfad9",
  },
  {
    key: "Diverge",
    lead: "Everyone writes their own take first, so no one just nods along with whoever's loudest.",
    image: "/landing/slide-diverge.png",
    bg: "#d2efdb",
  },
  {
    key: "Collaborate",
    lead: "Priorities go up at once, Jam groups the overlaps, and you vote on what a good answer has to nail.",
    image: "/landing/slide-collaborate.png",
    bg: "#dbe9fb",
  },
  {
    key: "Decide",
    lead: "Weigh the options against what matters and vote. If a few still feel off, you go again.",
    image: "/landing/slide-decide.png",
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
          className="relative h-[100svh] min-h-[600px] w-full overflow-hidden"
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
              <Image
                src={p.image}
                alt={`${p.key} — ${p.lead}`}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-contain"
              />
            </div>
          ))}

          {/* Display-only tabs: per-phase descriptions; active is bright with a
              filling line, the rest a dim, empty track. */}
          <div className="absolute inset-x-0 bottom-0 z-[2] px-4 pb-7 sm:px-6 lg:px-10 lg:pb-10">
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

            {/* Mobile: active phase's copy, then a row of progress segments. */}
            <div className="lg:hidden">
              <div className="relative min-h-[5rem]">
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
                      className="text-[18px] font-medium leading-none text-black"
                      style={dmSans}
                    >
                      {p.key}
                    </p>
                    <p
                      className="mt-2 text-[13px] leading-[1.4] text-black/60"
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
