import { Logo } from "@/app/_components/Logo";

// Instant skeleton for /start. Prefetched with the route so navigating back
// from settings (or anywhere) paints immediately while the server loads the
// user + jam history (see page.tsx).
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-6 md:px-12 lg:px-16">
        <span className="inline-flex">
          <Logo />
        </span>
        <span className="h-[48px] w-[48px] rounded-full bg-white" />
      </header>
      <div className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-11 lg:px-16 lg:pb-16 lg:pt-8">
        <div className="w-full max-w-[640px] animate-pulse rounded-[24px] bg-white p-8 md:p-10">
          <div className="h-9 w-52 rounded-md bg-neutral-200" />
          <div className="mt-8 h-4 w-32 rounded bg-neutral-200" />
          <div className="mt-3 h-11 w-full rounded-[12px] bg-neutral-100" />
          <div className="mt-6 h-4 w-36 rounded bg-neutral-200" />
          <div className="mt-3 h-40 w-full rounded-[12px] bg-neutral-100" />
          <div className="mt-6 h-4 w-40 rounded bg-neutral-200" />
          <div className="mt-3 flex gap-3">
            <div className="h-10 w-28 rounded-full bg-neutral-100" />
            <div className="h-10 w-24 rounded-full bg-neutral-100" />
            <div className="h-10 w-20 rounded-full bg-neutral-100" />
          </div>
          <div className="mt-8 h-12 w-full rounded-full bg-neutral-200" />
        </div>
        <div className="flex-1 animate-pulse pt-2">
          <div className="h-9 w-48 rounded-md bg-neutral-200" />
          <div className="mt-6 h-4 w-72 rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}
