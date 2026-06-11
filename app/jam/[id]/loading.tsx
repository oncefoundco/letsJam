import {
  Pulse,
  SkeletonCard,
  SkeletonHeader,
} from "@/app/_components/skeletons";

// Instant skeleton for /jam/[id] — mirrors RecapView's column layout: logo
// header, big recap title, then stacked section cards.
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkeletonHeader />
      <div className="flex flex-1 flex-col gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-11 lg:px-16 lg:pb-16 lg:pt-8">
        <main className="flex min-w-0 flex-1 animate-pulse flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Pulse className="h-11 w-2/3 md:h-12" />
            <Pulse className="h-4 w-40" />
          </div>
          <SkeletonCard className="w-full p-8">
            <Pulse className="h-5 w-44" />
            <Pulse className="mt-4 h-4 w-full" />
            <Pulse className="mt-2 h-4 w-5/6" />
            <Pulse className="mt-2 h-4 w-4/6" />
          </SkeletonCard>
          <SkeletonCard className="w-full p-8">
            <Pulse className="h-5 w-36" />
            <div className="mt-4 flex gap-2">
              <span className="h-9 w-9 rounded-full bg-neutral-200" />
              <span className="h-9 w-9 rounded-full bg-neutral-200" />
              <span className="h-9 w-9 rounded-full bg-neutral-200" />
            </div>
            <Pulse className="mt-4 h-4 w-full" />
            <Pulse className="mt-2 h-4 w-3/4" />
          </SkeletonCard>
        </main>
      </div>
    </div>
  );
}
