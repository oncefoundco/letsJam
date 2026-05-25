import Link from "next/link";
import { UploadContext } from "./UploadContext";

export const metadata = {
  title: "Start a New Session — Together",
};

export default function StartSessionPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <Body />
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-6 md:px-12 lg:px-16">
      <Link href="/" className="inline-flex" aria-label="Together home">
        <Logo />
      </Link>
      <div className="flex items-center gap-3">
        <div className="flex h-[46px] items-center justify-center rounded-full bg-white px-6 py-3">
          <span
            className="text-[15px] leading-none text-black/30"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            Session pending
          </span>
        </div>
        <button
          type="button"
          aria-label="Start video"
          className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white transition-colors hover:bg-neutral-100"
        >
          <VideoIcon />
        </button>
        <button
          type="button"
          aria-label="Copy invite link"
          className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white transition-colors hover:bg-neutral-100"
        >
          <LinkIcon />
        </button>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="relative inline-grid grid-cols-[max-content]">
      <p
        className="col-start-1 row-start-1 ml-[20px] text-[22px] leading-[0.9] tracking-[-0.88px] text-black"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        Together
      </p>
      <div className="col-start-1 row-start-1 flex h-[18px] w-[22px] items-center justify-center">
        <div className="-rotate-15">
          <span
            className="text-[14px] leading-[0.9] tracking-[-0.28px] text-black"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            try
          </span>
        </div>
      </div>
    </div>
  );
}

function Body() {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-8 lg:px-16 lg:pb-16 lg:pt-8">
      <MainCard />
      <Sidebar />
    </div>
  );
}

function MainCard() {
  return (
    <section className="flex min-w-0 flex-1 flex-col justify-between gap-12 rounded-3xl bg-white p-8 md:p-12">
      <div className="flex flex-col gap-6">
        <h1
          className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
          style={{ fontFamily: "var(--font-queens)" }}
        >
          Start a New Session
        </h1>

        <Field label="Define your challenge">
          <textarea
            className="h-[156px] w-full resize-none rounded-2xl bg-[#f5f5f5] p-4 text-[15px] leading-[1.5] text-[#1a1a1a] outline-none placeholder:text-black/40 focus:ring-2 focus:ring-[#3c5bcb]/40"
            placeholder="Why is our enterprise expansion stalling, and what should we do about it in Q1?"
            style={{ fontFamily: "var(--font-public-sans)" }}
          />
        </Field>

        <Field label="Upload context">
          <UploadContext />
        </Field>

        <Field label="Start time">
          <div className="flex flex-wrap items-center gap-3">
            <TimePill label="Immediately" active />
            <TimePill label="Schedule" />
            <TimePill label="Draft" />
          </div>
        </Field>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <PrimaryButton href="/waiting-room">Draft Session</PrimaryButton>
        <PrimaryButton href="/waiting-room">Invite team</PrimaryButton>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <label
        className="text-[14px] font-medium leading-none text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function TimePill({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-full p-3 text-[14px] leading-none transition-colors ${
        active
          ? "bg-[#1a1a1a] text-white"
          : "bg-[#f5f5f5] text-black hover:bg-neutral-200"
      }`}
      style={{ fontFamily: "var(--font-public-sans)" }}
    >
      {label}
    </button>
  );
}

function PrimaryButton({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  const className =
    "flex flex-1 items-center justify-center rounded-2xl bg-[#1a1a1a] p-4 text-[14px] font-medium leading-none text-white transition-colors hover:bg-black";
  const style = { fontFamily: "var(--font-inter)" };
  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={className} style={style}>
      {children}
    </button>
  );
}

function Sidebar() {
  return (
    <aside className="flex w-full flex-col gap-8 rounded-3xl bg-white p-6 lg:w-[420px] xl:w-[479px]">
      <div className="flex flex-col gap-4">
        <p
          className="text-[14px] font-medium leading-none text-black"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          Session
        </p>
        <p
          className="text-[12px] leading-none text-black"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          No challenge yet — fill in the brief.
        </p>
      </div>

      <Timeline />

      <div className="flex flex-col gap-4">
        <p
          className="text-[14px] font-medium leading-none text-black"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          In the room
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <ParticipantAvatar initial="S" />
            <span
              className="text-[14px] leading-none text-black"
              style={{ fontFamily: "var(--font-public-sans)" }}
            >
              Simon (You)
            </span>
          </div>
          <p
            className="text-[12px] leading-none text-black"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            Start the session to invite your team
          </p>
        </div>
      </div>
    </aside>
  );
}

const TIMELINE_STEPS = [
  "Setup",
  "Waiting room",
  "Self Reflection",
  "Synthesize",
  "Vote",
  "The call",
];

function Timeline() {
  const activeIndex = 0;
  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-[14px] font-medium leading-none text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        Timeline
      </p>
      <ol className="flex flex-col">
        {TIMELINE_STEPS.map((label, idx) => {
          const active = idx === activeIndex;
          return (
            <li
              key={label}
              className={`flex items-center gap-4 rounded-lg px-3 py-2 ${
                active ? "bg-[#f5f5f5]" : ""
              }`}
            >
              <StepIndicator number={idx + 1} active={active} />
              <span
                className="text-[14px] leading-none text-[#1a1a1a]"
                style={{ fontFamily: "var(--font-public-sans)" }}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepIndicator({
  number,
  active,
}: {
  number: number;
  active?: boolean;
}) {
  return (
    <span
      className={`grid h-6 w-6 place-items-center rounded-full text-[10px] leading-none ${
        active ? "bg-[#e85d3c] text-white" : "bg-[#f5f5f5] text-black"
      }`}
      style={{ fontFamily: "var(--font-public-sans)" }}
    >
      {number}
    </span>
  );
}

function ParticipantAvatar({ initial }: { initial: string }) {
  return (
    <span
      className="grid h-6 w-6 place-items-center rounded-full bg-[#9fd5f1] text-[10px] leading-none text-black"
      style={{ fontFamily: "var(--font-public-sans)" }}
    >
      {initial}
    </span>
  );
}

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 10l5-3v10l-5-3v-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 14a4 4 0 010-5.66l3-3a4 4 0 015.66 5.66l-1.5 1.5M14 10a4 4 0 010 5.66l-3 3a4 4 0 01-5.66-5.66l1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

