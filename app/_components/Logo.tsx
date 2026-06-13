export function Logo({
  className,
  light = false,
}: {
  className?: string;
  // light: white "jam" with a soft shadow, for use over photos/video. The drum
  // is a colour emoji, so it reads on any background and is unaffected.
  light?: boolean;
}) {
  return (
    <div className={`inline-flex items-center gap-[5px] ${className ?? ""}`}>
      <span
        aria-hidden
        className="-mr-[1px] -rotate-[10deg] text-[27px] leading-none"
      >
        🥁
      </span>
      <span
        className={`text-[28px] leading-[0.9] tracking-[-1.12px] ${
          light
            ? "text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.35)]"
            : "text-black"
        }`}
        style={{ fontFamily: "var(--font-logo)" }}
      >
        jam
      </span>
    </div>
  );
}
