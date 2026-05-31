import Link from "next/link";
import { Suspense } from "react";
import { StartForm } from "./StartForm";
import { Logo } from "@/app/_components/Logo";
import { AuthGate } from "./AuthGate";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Start a New Jam — Jam",
};

export default async function StartSessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const meta = user?.user_metadata ?? {};
  const authed = Boolean(user);
  const needsProfile = authed && !(meta.display_name && meta.color);
  // Prefill the name field from the Google identity when we have it.
  const initialName =
    (meta.display_name as string) ||
    (meta.full_name as string) ||
    (meta.name as string) ||
    "";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <Body />
      <Suspense fallback={null}>
        <AuthGate
          authed={authed}
          needsProfile={needsProfile}
          initialName={initialName}
        />
      </Suspense>
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-6 md:px-12 lg:px-16">
      <Link href="/" className="inline-flex" aria-label="Jam home">
        <Logo />
      </Link>
      <Link
        href="/settings"
        aria-label="Settings"
        className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-neutral-100"
      >
        <SettingsIcon />
      </Link>
    </header>
  );
}

function Body() {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-11 lg:px-16 lg:pb-16 lg:pt-8">
      <MainCard />
      <PreviousJams />
    </div>
  );
}

function MainCard() {
  return (
    <section className="flex min-w-0 flex-1 flex-col justify-between gap-12 rounded-3xl bg-white p-6 md:p-8 lg:p-12">
      <StartForm />
    </section>
  );
}

function PreviousJams() {
  return (
    <aside className="flex w-full flex-col items-center gap-6 lg:w-auto lg:flex-1 lg:self-stretch">
      <div className="flex w-full items-start justify-between gap-4">
        <h2
          className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
          style={{ fontFamily: "var(--font-queens)" }}
        >
          Previous Jams
        </h2>
        <button
          type="button"
          className="shrink-0 rounded-full bg-white p-3 text-[14px] leading-none text-black transition-colors hover:bg-neutral-100"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          Filter by date
        </button>
      </div>
      <p
        className="mt-4 text-[18px] italic leading-[1.5] text-[#1a1a1a]"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        No previous jams found.
      </p>
    </aside>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
