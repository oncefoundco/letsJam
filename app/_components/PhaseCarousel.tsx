"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Reveal } from "@/app/_components/Reveal";

/*
 * The four moves of a Jam, as an auto-advancing feature carousel. Each slide is
 * a full-bleed image with a centered caption; a frosted strip + gradient keep
 * the white type legible over any photo. The bottom tabs double as the progress
 * indicator — the active one's underline fills over the slide duration. Pauses
 * on hover/focus; under prefers-reduced-motion it doesn't auto-advance (tabs
 * still work) and the progress bar shows full instead of animating.
 *
 * Copy + images are reused from the prior PhaseWalkthrough for now.
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
    image: "/landing/feature-converse.png",
    alt: "A letsJam video call with the team talking it out",
  },
  {
    key: "Diverge",
    title: "Then reflect on what actually matters.",
    lead: "Everyone writes their own take first, so no one just nods along with whoever's loudest.",
    image: "/landing/personal-space.png",
    alt: "A quiet, personal space to write down your own thinking",
  },
  {
    key: "Collaborate",
    title: "Shape the options together.",
    lead: "Priorities go up at once, Jam groups the overlaps, and you vote on what a good answer has to nail.",
    image: "/landing/hero-collage.png",
    alt: "The team aligning on what matters together",
  },
  {
    key: "Decide",
    title: "Make a call the whole room's behind.",
    lead: "Weigh the options against what matters and vote. If a few still feel off, you go again.",
    image: "/landing/hero-photo.png",
    alt: "A team committing to a decision together",
  },
];

export function PhaseCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Respect reduced-motion: no autoplay, no progress animation.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Auto-advance. Re-runs on every slide change (so a manual tab also resets
  // the clock) and stops while paused or under reduced-motion.
  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(
      () => setActive((a) => (a + 1) % PHASES.length),
      SLIDE_MS,
    );
    return () => clearTimeout(t);
  }, [active, paused, reduced]);

  return (
    <Reveal
      as="section"
      className="px-4 pb-24 sm:px-6 md:px-8 lg:px-12 xl:px-[80px] 2xl:px-[117px]"
    >
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="The four moves of a Jam"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[32px] bg-[#e6e6e6] sm:aspect-[4/3] lg:aspect-[16/9]"
      >
        {/* Slides: crossfade between the photos. */}
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
              sizes="(min-width: 1024px) 1200px, 100vw"
              className="object-cover"
            />
          </div>
        ))}

        {/* Legibility: a soft top→bottom darkening for the centered caption, */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.36)_0%,rgba(0,0,0,0.14)_38%,rgba(0,0,0,0.30)_72%,rgba(0,0,0,0.58)_100%)]"
        />
        {/* plus a frosted strip behind the tabs (everyday.io's trick). */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[42%] backdrop-blur-[16px] [-webkit-mask-image:linear-gradient(to_top,#000_0%,rgba(0,0,0,0.75)_45%,transparent_100%)] [mask-image:linear-gradient(to_top,#000_0%,rgba(0,0,0,0.75)_45%,transparent_100%)]"
        />

        {/* Foreground: caption centered above the tab nav. */}
        <div className="relative z-[2] flex h-full flex-col">
          <div className="flex flex-1 items-center justify-center px-6 pt-12 text-center">
            {PHASES.map((p, i) => (
              <div
                key={p.key}
                aria-hidden={i !== active}
                className="absolute max-w-[40rem] px-6"
                style={{
                  opacity: i === active ? 1 : 0,
                  transform: i === active ? "none" : "translateY(8px)",
                  transition: `opacity 800ms ${EASE}, transform 800ms ${EASE}`,
                  pointerEvents: i === active ? "auto" : "none",
                }}
              >
                <p
                  className="text-[14px] font-medium tracking-[0.01em] text-white/75"
                  style={dmSans}
                >
                  {p.key}
                </p>
                <h2 className="heading-display mt-3 text-[clamp(2rem,4.6vw,3.5rem)] leading-[0.92] text-white [text-wrap:balance]">
                  {p.title}
                </h2>
                <p
                  className="mx-auto mt-4 max-w-[34rem] text-[15px] leading-[1.45] text-white/85 sm:text-[17px]"
                  style={dmSans}
                >
                  {p.lead}
                </p>
              </div>
            ))}
          </div>

          {/* Tabs / progress. */}
          <nav
            aria-label="Jam phases"
            className="px-4 pb-5 sm:px-6 lg:px-8 lg:pb-7"
          >
            <div className="mx-auto grid max-w-[1100px] grid-cols-4 gap-2 sm:gap-4">
              {PHASES.map((p, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={isActive}
                    aria-label={`Show ${p.key}`}
                    className="group flex flex-col items-start pt-3 text-left outline-none transition-opacity duration-300 focus-visible:opacity-100"
                    style={{ opacity: isActive ? 1 : 0.55 }}
                  >
                    <span
                      className="mb-3 text-[13px] font-medium leading-none text-white sm:text-[15px]"
                      style={dmSans}
                    >
                      {p.key}
                    </span>
                    <span className="block h-[2px] w-full overflow-hidden bg-white/25">
                      <span
                        key={isActive ? `on-${active}` : `off-${i}`}
                        className="block h-full w-full origin-left bg-white"
                        style={
                          isActive
                            ? reduced
                              ? { transform: "scaleX(1)" }
                              : {
                                  animation: `lj-phase-progress ${SLIDE_MS}ms linear both`,
                                  animationPlayState: paused
                                    ? "paused"
                                    : "running",
                                }
                            : { transform: "scaleX(0)" }
                        }
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </Reveal>
  );
}
