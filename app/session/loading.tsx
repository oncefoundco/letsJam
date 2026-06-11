import {
  SkeletonCard,
  SkeletonHeader,
  SkeletonSidebar,
} from "@/app/_components/skeletons";

// Instant skeleton for /session — mirrors page.tsx's p-6/p-8 shell: header
// with timer controls, large video column, session sidebar. className="" on
// the header because the page shell provides the padding.
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col gap-6 bg-background p-6 md:gap-8 md:p-8">
      <SkeletonHeader controls className="" />
      <div className="flex min-h-0 flex-1 flex-col gap-6 md:gap-8 lg:flex-row lg:items-stretch">
        <section className="flex min-w-0 flex-1">
          <SkeletonCard className="min-h-[420px] w-full rounded-3xl" />
        </section>
        <SkeletonSidebar />
      </div>
    </div>
  );
}
