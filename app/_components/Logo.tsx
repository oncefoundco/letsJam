export function Logo({
  className,
  light = false,
}: {
  className?: string;
  // light: white "jam" with a soft shadow, for use over photos/video (the
  // "lets" pill stays light-blue with black text — it reads on any background).
  light?: boolean;
}) {
  return (
    <div
      className={`relative inline-grid grid-cols-[max-content] ${className ?? ""}`}
    >
      <p
        className={`col-start-1 row-start-1 ml-[42px] text-[28px] leading-[0.9] tracking-[-1.12px] ${
          light
            ? "text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.35)]"
            : "text-black"
        }`}
        style={{ fontFamily: "var(--font-logo)" }}
      >
        jam
      </p>
      <div className="col-start-1 row-start-1 flex h-[26.51px] w-[39.158px] items-center justify-center">
        <div className="-rotate-[11.02deg]">
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
  );
}
