"use client";

import { useLayoutEffect, useRef, useState } from "react";

const SCALE = 2.6; // how large the logo is at the centered "splash" size

/**
 * Brand splash that plays on every landing-page load as one continuous gesture:
 * the logo assembles big & centered, then flies up and scales down to land
 * exactly on the header logo's slot, where the real header logo is revealed and
 * the splash unmounts. No crossfade — the splash logo *becomes* the nav.
 *
 * The flight is a measured FLIP. The traveling logo is positioned (fixed) over
 * the header logo's box, so its resting state is plain transform:none. We read
 * that box, compute the transform that makes the logo appear big & centered,
 * apply it inline as the start state, then add .is-flying to glide to none —
 * so it lands on the header pixel-for-pixel with no jump.
 *
 * Renders in the SSR HTML; the opaque .lj-intro__bg covers the first painted
 * frame so nothing flashes. Reduced motion skips the whole thing.
 */
export function LogoIntro() {
  const [visible, setVisible] = useState(true);
  const logoRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const target = document.querySelector<HTMLElement>("[data-logo-target]");
    const logo = logoRef.current;

    // No motion, or nothing to fly to: show the header logo, drop the splash.
    if (reduced || !target || !logo) {
      setVisible(false);
      return;
    }

    const root = document.documentElement;
    // Two gates: -active hides the header logo until landing; -hold pauses the
    // hero entrance until the logo starts flying. Both set before first paint.
    root.classList.add("lj-intro-active", "lj-intro-hold");

    // FLIP: position the logo over the header slot (done via inline layout
    // below), then derive the start transform from the measured boxes.
    const t = target.getBoundingClientRect();
    const restCx = t.left + t.width / 2;
    const restCy = t.top + t.height / 2;
    const dx = window.innerWidth / 2 - restCx;
    const dy = window.innerHeight / 2 - restCy;

    logo.style.left = `${t.left}px`;
    logo.style.top = `${t.top}px`;
    logo.style.width = `${t.width}px`;
    logo.style.height = `${t.height}px`;
    logo.style.transform = `translate(${dx}px, ${dy}px) scale(${SCALE})`;

    // Next frame: enable the flight. Two rAFs so the start transform paints
    // first, otherwise the transition has nothing to animate from.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => logo.classList.add("is-flying"));
    });

    // The instant the flight begins (delay elapsed), let the hero entrance run
    // so it animates while the logo descends and the background fades.
    const onTakeoff = (e: TransitionEvent) => {
      if (e.propertyName === "transform") root.classList.remove("lj-intro-hold");
    };
    const finish = () => {
      root.classList.remove("lj-intro-active", "lj-intro-hold"); // reveal header logo
      setVisible(false); // unmount splash — they coincide, so the swap is invisible
    };
    const fallback = setTimeout(finish, 1500);
    const onLanded = (e: TransitionEvent) => {
      if (e.propertyName === "transform") finish();
    };
    logo.addEventListener("transitionstart", onTakeoff);
    logo.addEventListener("transitionend", onLanded);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(fallback);
      logo.removeEventListener("transitionstart", onTakeoff);
      logo.removeEventListener("transitionend", onLanded);
      root.classList.remove("lj-intro-active", "lj-intro-hold");
    };
  }, []);

  if (!visible) return null;

  return (
    <div aria-hidden className="lj-intro fixed inset-0 z-[100]">
      <div className="lj-intro__bg absolute inset-0 bg-background" />
      {/* fixed box, placed over the header logo by the effect; scale(1) here so
          its natural size matches the header logo exactly */}
      <div ref={logoRef} className="lj-intro__logo fixed">
        <div className="relative inline-grid grid-cols-[max-content]">
          <p
            className="lj-intro__jam col-start-1 row-start-1 ml-[42px] text-[28px] leading-[0.9] tracking-[-1.12px] text-black"
            style={{ fontFamily: "var(--font-logo)" }}
          >
            jam
          </p>
          <div className="col-start-1 row-start-1 flex h-[26.51px] w-[39.158px] items-center justify-center">
            <div className="lj-intro__pill">
              <div className="flex items-center justify-center rounded-full bg-[var(--color-jam-blue)] px-1 py-[2px]">
                <span
                  className="text-[18px] leading-[0.9] text-black"
                  style={{ fontFamily: "var(--font-logo)" }}
                >
                  lets
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
