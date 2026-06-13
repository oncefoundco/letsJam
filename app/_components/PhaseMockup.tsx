/*
 * The per-phase app-window mockup for the PhaseCarousel. Each is an
 * outline-text SVG exported from the Figma phase screens (file
 * b7H9ai9yIYUXAHMJ31HyQV) — same 2035×1250 window across all four, crisp at any
 * size. The dark bezel is part of the art and the corners are transparent, so
 * the window sits cleanly on the slide's pastel. Headline text and the
 * display-only bottom tabs live in the carousel, not in these images.
 */

const SRC: Record<string, string> = {
  Converse: "/landing/phase-converse.svg",
  Diverge: "/landing/phase-diverge.svg",
  Collaborate: "/landing/phase-collaborate.svg",
  Decide: "/landing/phase-decide.svg",
};

export function PhaseMockup({
  variant,
  className = "mx-auto max-h-full w-full max-w-[860px] select-none object-contain",
}: {
  variant: string;
  // The carousel keeps the centered 860px cap (default); the stacked
  // walkthrough passes a fill class so the window grows to its column width.
  className?: string;
}) {
  return (
    <img
      src={SRC[variant] ?? SRC.Converse}
      alt=""
      aria-hidden
      draggable={false}
      className={className}
      style={{ aspectRatio: "2035 / 1250" }}
    />
  );
}
