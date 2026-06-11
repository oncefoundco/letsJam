import type { ReactNode } from "react";
import { Logo } from "@/app/_components/Logo";

// Shared building blocks for per-route loading.tsx skeletons. Each dynamic
// page composes these to mirror its real layout, so the prefetched fallback
// paints instantly on navigation and the real page streams in without a
// layout jump. (/start and /settings keep their earlier bespoke skeletons.)

// Header with the real Logo (it's static, so rendering it keeps the brand
// mark stable across the transition). `controls` adds a pulse pill matching
// the HeaderControls footprint (42px round buttons). The default className
// is the standard page-header padding; /session passes "" because its
// header sits inside the page's own p-6/p-8 shell.
export function SkeletonHeader({
  controls = false,
  className = "px-6 py-6 md:px-12 lg:px-16",
}: {
  controls?: boolean;
  className?: string;
}) {
  return (
    <header
      className={`flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <span className="inline-flex">
        <Logo />
      </span>
      {controls ? (
        <div className="flex items-center gap-[4px]">
          <span className="h-[42px] w-[42px] animate-pulse rounded-full bg-neutral-200" />
          <span className="h-[42px] w-[120px] animate-pulse rounded-full bg-neutral-200" />
        </div>
      ) : null}
    </header>
  );
}

// Matches SessionSidebar's footprint (aside, white rounded-3xl, fixed lg/xl
// widths) so the right rail doesn't shift when the real sidebar arrives.
export function SkeletonSidebar() {
  return (
    <aside className="flex w-full flex-col gap-8 self-stretch rounded-3xl bg-white p-6 lg:w-[420px] xl:w-[479px]">
      <div className="flex w-full flex-col gap-6 rounded-2xl bg-[#f4f4f4] p-6">
        <Pulse className="h-4 w-24" />
        <Pulse className="h-7 w-3/4" />
        <Pulse className="h-4 w-1/2" />
      </div>
      <div className="flex flex-col gap-3">
        <Pulse className="h-4 w-32" />
        <div className="flex gap-2">
          <span className="h-9 w-9 animate-pulse rounded-full bg-neutral-200" />
          <span className="h-9 w-9 animate-pulse rounded-full bg-neutral-200" />
          <span className="h-9 w-9 animate-pulse rounded-full bg-neutral-200" />
        </div>
      </div>
    </aside>
  );
}

// White card container, same radius the app's cards use.
export function SkeletonCard({
  className = "",
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-[24px] bg-white ${className}`}>
      {children}
    </div>
  );
}

// A single pulse bar. Size/shape via className (h-*, w-*, rounded-*).
export function Pulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-neutral-200 ${className}`} />;
}
