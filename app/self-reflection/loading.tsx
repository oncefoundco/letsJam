import {
  Pulse,
  SkeletonCard,
  SkeletonHeader,
  SkeletonSidebar,
} from "@/app/_components/skeletons";

// Instant skeleton for /self-reflection — mirrors page.tsx: header with
// controls, reflection form card (prompt + three idea rows + submit),
// session sidebar.
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkeletonHeader controls />
      <div className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-8 lg:px-16 lg:pb-16 lg:pt-8">
        <section className="flex min-w-0 flex-1 items-start justify-center">
          <SkeletonCard className="w-full max-w-[640px] p-8">
            <Pulse className="h-8 w-64" />
            <Pulse className="mt-4 h-4 w-full" />
            <Pulse className="mt-2 h-4 w-5/6" />
            <div className="mt-8 flex flex-col gap-4">
              <Pulse className="h-20 w-full rounded-[12px]" />
              <Pulse className="h-20 w-full rounded-[12px]" />
              <Pulse className="h-20 w-full rounded-[12px]" />
            </div>
            <Pulse className="mt-8 h-12 w-full rounded-full" />
          </SkeletonCard>
        </section>
        <SkeletonSidebar />
      </div>
    </div>
  );
}
