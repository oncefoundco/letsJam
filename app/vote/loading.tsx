import {
  Pulse,
  SkeletonCard,
  SkeletonHeader,
  SkeletonSidebar,
} from "@/app/_components/skeletons";

// Instant skeleton for /vote — mirrors page.tsx: header with controls,
// options column (three option cards), session sidebar.
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkeletonHeader controls />
      <div className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-8 lg:px-16 lg:pb-16 lg:pt-8">
        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <Pulse className="h-8 w-72" />
          <SkeletonCard className="w-full p-6">
            <Pulse className="h-5 w-56" />
            <Pulse className="mt-3 h-4 w-full" />
            <Pulse className="mt-2 h-4 w-4/6" />
          </SkeletonCard>
          <SkeletonCard className="w-full p-6">
            <Pulse className="h-5 w-48" />
            <Pulse className="mt-3 h-4 w-full" />
            <Pulse className="mt-2 h-4 w-3/6" />
          </SkeletonCard>
          <SkeletonCard className="w-full p-6">
            <Pulse className="h-5 w-52" />
            <Pulse className="mt-3 h-4 w-full" />
            <Pulse className="mt-2 h-4 w-4/6" />
          </SkeletonCard>
        </section>
        <SkeletonSidebar />
      </div>
    </div>
  );
}
