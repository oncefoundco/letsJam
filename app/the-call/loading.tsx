import {
  Pulse,
  SkeletonCard,
  SkeletonHeader,
} from "@/app/_components/skeletons";

// Instant skeleton for /the-call — mirrors page.tsx: logo header and one
// centered decision card. (No sidebar on this route.)
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkeletonHeader />
      <div className="flex flex-1 flex-col items-stretch px-6 pb-12 pt-4 md:px-12 lg:px-16 lg:pb-16 lg:pt-8">
        <div className="flex flex-1 items-center justify-center">
          <SkeletonCard className="w-full max-w-[720px] p-10">
            <Pulse className="mx-auto h-4 w-32" />
            <Pulse className="mx-auto mt-5 h-10 w-3/4" />
            <Pulse className="mx-auto mt-6 h-4 w-full" />
            <Pulse className="mx-auto mt-2 h-4 w-5/6" />
            <Pulse className="mx-auto mt-2 h-4 w-2/3" />
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}
