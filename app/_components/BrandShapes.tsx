"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Decorative brand slabs behind the landing surface. The yellow spark sits
 * static behind the hero; the two blue slabs by the phase walkthrough RISE
 * into place when scrolled into view — left first, then the right one after a
 * beat (a staggered entrance, not both at once). Mirrors the Reveal pattern:
 * SSR / no-JS / reduced-motion render them in their final resting state, so
 * nothing depends on the animation to be visible.
 */
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const RISE_MS = 760; // how long each slab takes to rise
// The right slab starts only once the left has finished its climb — a clean
// hand-off on the tail of the left, read as two beats, not a simultaneous lift.
const RIGHT_DELAY = RISE_MS;

export function BrandShapes() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    // Already on screen at mount → show without animating (no late pop-in).
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Each blue slab keeps its rotation while rising from below + fading in.
  const rise = (deg: number, delay: number) =>
    ({
      transform: shown
        ? `rotate(${deg}deg) translateY(0)`
        : `rotate(${deg}deg) translateY(64px)`,
      opacity: shown ? 1 : 0,
      transition: `transform ${RISE_MS}ms ${EASE} ${delay}ms, opacity ${RISE_MS}ms ${EASE} ${delay}ms`,
      willChange: "transform, opacity",
    }) as const;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block"
    >
      {/* warm spark behind the hero — static */}
      <div
        className="absolute rounded-[50px] bg-[var(--color-jam-yellow)]"
        style={{ top: "-10%", right: "-6%", width: "52%", height: "22%", transform: "rotate(-16deg)" }}
      />
      {/* observer anchor sits at the blue band so the rise triggers there */}
      <div ref={ref} className="absolute" style={{ top: "20%", left: 0, right: 0, height: "1px" }} />
      {/* left blue — rises first */}
      <div
        className="absolute rounded-[50px] bg-[var(--color-jam-blue)]"
        style={{ top: "20%", left: "-12%", width: "46%", height: "16%", ...rise(-16, 0) }}
      />
      {/* right blue — rises after the left, and its top begins where the left
          slab ends (left is top 20% + height 16% = 36%), so the two read as one
          continuous stepped diagonal rather than two slabs at the same level. */}
      <div
        className="absolute rounded-[50px] bg-[var(--color-jam-blue)]"
        style={{ top: "36%", right: "-12%", width: "46%", height: "16%", ...rise(16, RIGHT_DELAY) }}
      />
    </div>
  );
}
