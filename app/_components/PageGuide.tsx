"use client";

import Image from "next/image";
import { useState } from "react";

/*
 * A per-page "what's happening" explainer, per the Figma comps (section
 * "R4R"): a centered card over a dimmed, blurred backdrop with a
 * page-specific illustration, a display title, a line of context, and a
 * "Got it" button. It auto-opens each time the page mounts (per product
 * decision); a persistent "?" button bottom-right reopens it. Sits below
 * the join/invite modals (z-40 < z-50).
 */

const FONT = { fontFamily: "var(--font-public-sans)" } as const;
const DISPLAY = { fontFamily: "var(--font-queens)" } as const;

export function PageGuide({
  title = "What's happening",
  image,
  children,
}: {
  title?: string;
  /** Path to the page's illustration panel (424×319 comp asset). */
  image?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const close = () => setOpen(false);

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[rgba(36,36,36,0.6)] p-6 backdrop-blur-[2px]"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className="lj-pop flex w-[min(488px,calc(100vw-3rem))] flex-col items-center gap-8 rounded-2xl bg-white p-8 shadow-[0_32px_48px_-12px_rgba(0,0,0,0.35)]"
          >
            {image ? (
              <Image
                src={image}
                alt=""
                width={424}
                height={319}
                className="w-full rounded-2xl"
                priority
              />
            ) : null}
            <div className="flex w-full flex-col items-center gap-[21px]">
              <div className="flex w-full flex-col gap-[10px]">
                <h2
                  className="text-[32px] leading-none tracking-[-0.8px] text-black md:text-[40px]"
                  style={DISPLAY}
                >
                  {title}
                </h2>
                <p
                  className="text-[16px] leading-[1.3] tracking-[-0.32px] text-black"
                  style={FONT}
                >
                  {children}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-12 w-[min(308px,100%)] items-center justify-center rounded-2xl bg-[#1a1a1a] px-6 text-[18px] leading-none text-white transition-colors hover:bg-black"
                style={FONT}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="What's happening on this page"
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-40 grid h-11 w-11 place-items-center rounded-full bg-[#1a1a1a] text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c5bcb]/50"
        style={FONT}
      >
        <span className="text-[17px] font-medium leading-none">?</span>
      </button>
    </>
  );
}
