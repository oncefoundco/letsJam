import type { ComponentProps, ReactNode } from "react";

/** Groups header control pills with the design's 4px gap. */
export function HeaderControls({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-[4px] ${className ?? ""}`}>
      {children}
    </div>
  );
}

/** Dark circular icon button — the redesigned header control pill. */
export function ControlButton({
  className,
  children,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={`flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#373737] text-white transition-colors hover:bg-[#454545] sm:h-[42px] sm:w-[42px] ${
        className ?? ""
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Dark text pill — used for the timer and status labels. */
export function StatusPill({
  children,
  muted,
  className,
}: {
  children: ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex h-[36px] items-center justify-center rounded-full bg-[#373737] px-[14px] py-[12px] text-[15px] font-medium leading-none tracking-[-0.18px] sm:h-[42px] sm:px-[18px] sm:text-[18px] ${
        muted ? "text-white/60" : "text-white"
      } ${className ?? ""}`}
      style={{ fontFamily: "var(--font-public-sans)" }}
    >
      {children}
    </div>
  );
}

export function VideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="2"
        y="6"
        width="14"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M16 10l5-3v10l-5-3v-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 14a4 4 0 010-5.66l3-3a4 4 0 015.66 5.66l-1.5 1.5M14 10a4 4 0 010 5.66l-3 3a4 4 0 01-5.66-5.66l1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <rect x="3" y="2" width="2.5" height="10" rx="0.6" />
      <rect x="8.5" y="2" width="2.5" height="10" rx="0.6" />
    </svg>
  );
}
