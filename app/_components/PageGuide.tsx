"use client";

import { useState } from "react";

/*
 * A calm, non-blocking "what's happening" explainer. It auto-opens each time
 * the page mounts (per product decision), can be dismissed with "Got it", and
 * a persistent "?" button reopens it. Fixed bottom-right so it stays clear of
 * page content; sits below modals (z-40 < z-50). Pass the page's orientation
 * copy as children; `title` defaults to "What's happening".
 */

const FONT = { fontFamily: "var(--font-public-sans)" } as const;

export function PageGuide({
  title = "What's happening",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open ? (
        <div
          role="dialog"
          aria-label={title}
          className="lj-pop w-[min(330px,calc(100vw-3rem))] rounded-2xl bg-white p-5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.28)]"
        >
          <div className="flex items-start justify-between gap-3">
            <p
              className="text-[13px] font-semibold leading-none text-black"
              style={FONT}
            >
              {title}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Dismiss"
              className="-mr-1 -mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
            >
              <CloseIcon />
            </button>
          </div>
          <p
            className="mt-3 text-[13px] leading-[1.55] text-[color:var(--color-muted-ink)]"
            style={FONT}
          >
            {children}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium leading-none text-white transition-colors hover:bg-black"
            style={FONT}
          >
            Got it
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="What's happening on this page"
        aria-expanded={open}
        className="grid h-11 w-11 place-items-center rounded-full bg-[#1a1a1a] text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c5bcb]/50"
        style={FONT}
      >
        <span className="text-[17px] font-medium leading-none">?</span>
      </button>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2 2l8 8M10 2l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
