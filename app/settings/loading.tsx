import { Logo } from "@/app/_components/Logo";

// Instant skeleton for /settings. Prefetched with the route so clicking the
// settings button navigates immediately while the server loads the user +
// team roster (see page.tsx).
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-6 md:px-12 lg:px-16">
        <span className="inline-flex">
          <Logo />
        </span>
        <span className="h-[48px] w-[48px] rounded-full bg-white" />
      </header>
      <div className="flex flex-1 items-start justify-center px-6 pb-12 md:px-12 lg:px-16">
        <div className="w-full max-w-[890px] animate-pulse rounded-[24px] bg-white p-8 md:p-12">
          <div className="h-10 w-56 rounded-md bg-neutral-200" />
          <div className="mt-8 h-4 w-24 rounded bg-neutral-200" />
          <div className="mt-4 h-10 w-64 rounded-[12px] bg-neutral-100" />
          <div className="mt-3 h-10 w-72 rounded-[12px] bg-neutral-100" />
          <div className="mt-10 h-4 w-20 rounded bg-neutral-200" />
          <div className="mt-4 h-10 w-full rounded-[12px] bg-neutral-100" />
          <div className="mt-10 h-4 w-48 rounded bg-neutral-200" />
          <div className="mt-4 flex gap-3">
            <div className="h-10 w-24 rounded-full bg-neutral-100" />
            <div className="h-10 w-24 rounded-full bg-neutral-100" />
            <div className="h-10 w-24 rounded-full bg-neutral-100" />
          </div>
          <div className="mt-10 h-12 w-full rounded-full bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}
