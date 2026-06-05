"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Scroll reveal that can't flash. The trick: it never hides content that is
 * already on screen. On mount it measures position — anything in or near the
 * viewport shows instantly (no animation, no blink), and only genuinely
 * below-the-fold elements arm the hidden state and fade/rise in via
 * IntersectionObserver as you scroll to them. SSR and no-JS render visible,
 * and prefers-reduced-motion opts out entirely.
 */

const EASE = "cubic-bezier(0.25, 1, 0.5, 1)";

type RevealProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  as?: React.ElementType;
};

export function Reveal({
  children,
  className,
  style,
  delay = 0,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    // Already in view at load → show immediately, never hide (prevents the
    // visible→hidden→fade blink). Only below-fold content gets the reveal.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      setShown(true);
      return;
    }

    setArmed(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hidden = armed && !shown;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(22px)" : "none",
        transition: `opacity 700ms ${EASE} ${delay}ms, transform 700ms ${EASE} ${delay}ms`,
        willChange: armed ? "opacity, transform" : undefined,
      }}
    >
      {children}
    </Tag>
  );
}
