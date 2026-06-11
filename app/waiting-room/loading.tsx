import {
  Pulse,
  SkeletonCard,
  SkeletonHeader,
  SkeletonSidebar,
} from "@/app/_components/skeletons";

// Instant skeleton for /waiting-room — mirrors page.tsx: logo header,
// centered main card (start time, video preview, actions, how-it-works),
// session sidebar.
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkeletonHeader />
      <div className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-8 lg:px-16 lg:pb-16 lg:pt-8">
        <section className="flex min-w-0 flex-1 items-center justify-center">
          <div className="flex w-full max-w-[640px] flex-col items-center gap-11">
            <div className="flex flex-col items-center gap-3">
              <Pulse className="h-4 w-28" />
              <Pulse className="h-10 w-48" />
            </div>
            <Pulse className="aspect-video w-full rounded-2xl" />
            <Pulse className="h-12 w-48 rounded-full" />
            <SkeletonCard className="w-full p-6">
              <Pulse className="h-4 w-28" />
              <div className="mt-4 flex flex-col gap-3">
                <Pulse className="h-3 w-full" />
                <Pulse className="h-3 w-5/6" />
                <Pulse className="h-3 w-4/6" />
              </div>
            </SkeletonCard>
          </div>
        </section>
        <SkeletonSidebar />
      </div>
    </div>
  );
}
