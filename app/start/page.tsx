import Link from "next/link";
import { Suspense } from "react";
import { StartForm } from "./StartForm";
import { Logo } from "@/app/_components/Logo";
import { AuthGate } from "./AuthGate";
import { SignupTease } from "./SignupTease";
import { createClient } from "@/lib/supabase/server";
import { PageGuide } from "@/app/_components/PageGuide";
import { loadHostJams, type HostJamSummary } from "@/lib/sessionStore";

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

  // The host's jam history for the Previous Jams rail. Best-effort: a DB
  // hiccup here shouldn't take down the create form.
  const jams = user ? await loadHostJams(user.id).catch(() => []) : [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      {/* Before sign-in, show a populated tease of the real screen behind the
          auth modal. Once signed in, render the live, interactive form. */}
      {authed ? <Body jams={jams} /> : <SignupTease />}
      {authed ? (
        <PageGuide>
          Set up your Jam: name the challenge, describe it, add who&apos;s
          joining and any files for context, then invite your team. Once
          they&apos;re in, you&apos;ll run a short structured session together.
        </PageGuide>
      ) : null}
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

function Body({ jams }: { jams: HostJamSummary[] }) {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-11 lg:px-16 lg:pb-16 lg:pt-8">
      <MainCard />
      <PreviousJams jams={jams} />
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

// Fallback line for jams that haven't landed on a decision yet.
const STATUS_LABELS: Record<string, string> = {
  active: "In progress — no decision yet",
  waiting: "Never started",
  scheduled: "Scheduled",
  draft: "Draft",
  archived: "Archived",
};

// "June 18th, 2026" — long month + ordinal day, matching the card's date pill.
function jamDate(ts: number): string {
  const d = new Date(ts);
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(d);
  return `${month} ${day}${suffix}, ${d.getFullYear()}`;
}

function PreviousJams({ jams }: { jams: HostJamSummary[] }) {
  return (
    <aside className="flex w-full flex-col gap-6 lg:w-auto lg:flex-1 lg:self-stretch">
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
      {jams.length === 0 ? (
        <p
          className="mt-4 text-[18px] italic leading-[1.5] text-[#1a1a1a]"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          No jams yet. The ones you run will show up here.
        </p>
      ) : (
        <ul className="flex w-full flex-col gap-4">
          {jams.map((jam) => (
            <li key={jam.id}>
              <JamCard jam={jam} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function JamCard({ jam }: { jam: HostJamSummary }) {
  return (
    <Link
      href={`/jam/${jam.id}`}
      className="flex flex-col gap-5 rounded-3xl bg-white p-6 transition-colors hover:bg-neutral-50 md:p-7"
      style={{ fontFamily: "var(--font-public-sans)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-[#f5f5f5] px-4 py-2.5 text-[14px] leading-none text-[#1a1a1a]">
          {jamDate(jam.createdAt)}
        </span>
        {jam.participants.length ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold leading-none text-[#1a1a1a]">
              Attendees
            </span>
            {jam.participants.map((p, i) => (
              <span
                key={i}
                className="rounded-full px-3 py-1.5 text-[12px] leading-none text-[#1a1a1a]"
                style={{ backgroundColor: p.bg }}
              >
                {p.name}
              </span>
            ))}
          </span>
        ) : null}
      </div>
      <p className="truncate text-[22px] leading-[1.2] text-[#1a1a1a] md:text-[26px]">
        Q: {jam.title}
      </p>
      {jam.result ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-[#f5f5f5] p-5">
          <p className="text-[16px] font-semibold leading-[1.3] text-[#1a1a1a]">
            {jam.result.title}
          </p>
          {jam.result.body ? (
            <p className="line-clamp-4 text-[13px] leading-[1.6] text-[#1a1a1a]/70">
              {jam.result.body}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-[15px] italic leading-none text-[#1a1a1a]/40">
          {STATUS_LABELS[jam.status] ?? "No decision yet"}
        </p>
      )}
    </Link>
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
