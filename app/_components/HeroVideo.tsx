"use client";

import { useEffect, useState } from "react";

/*
 * Background video for the hero. Serves the portrait clip on phones and the
 * landscape clip on larger screens, picking the source on the client (via
 * matchMedia) so only the matching file is ever downloaded. Before mount we
 * render just the poster — the still paints instantly and is the no-JS
 * fallback; the <video> mounts (keyed by src) once the breakpoint is known.
 */

const MOBILE = { src: "/landing/mobile.mp4", poster: "/landing/hero-mobile.jpg" };
const DESKTOP = { src: "/landing/hero.mp4", poster: "/landing/hero-figma.jpg" };
const MOBILE_QUERY = "(max-width: 767px)";

export function HeroVideo({ className }: { className?: string }) {
  // null until mounted → SSR/first paint shows the poster only.
  const [variant, setVariant] = useState<typeof MOBILE | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const pick = () => setVariant(mq.matches ? MOBILE : DESKTOP);
    pick();
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, []);

  return (
    <video
      key={variant?.src ?? "poster"}
      autoPlay
      loop
      muted
      playsInline
      poster={(variant ?? DESKTOP).poster}
      aria-hidden
      className={className}
    >
      {variant ? <source src={variant.src} type="video/mp4" /> : null}
    </video>
  );
}
