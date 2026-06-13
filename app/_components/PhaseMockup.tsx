/*
 * The per-phase app-window mockup. Fresh exports of the current Figma phase
 * screens (file b7H9ai9yIYUXAHMJ31HyQV, node 143:1704 et al.) — the earlier
 * SVGs were stale (e.g. missing the call-tile silhouettes). Each is designed on
 * paper-grey (#f4f4f4); the walkthrough crops them to its panel with
 * object-cover.
 */

const SRC: Record<string, string> = {
  Converse: "/landing/phase-converse-v2.png",
  Diverge: "/landing/phase-diverge-v2.png",
  Collaborate: "/landing/phase-collaborate-v2.png",
  Decide: "/landing/phase-decide-v2.png",
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
      style={{ aspectRatio: "933 / 643" }}
    />
  );
}
