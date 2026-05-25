import Link from "next/link";

export const metadata = {
  title: "Refine — Together",
};

const DEFAULT_TOPIC =
  "Why is our enterprise expansion stalling, and what should we do about it in Q1?";

const PREVIOUS_THINKING =
  "What's your read on this? What would you do, and why? Be specific — your thinking is what the AI uses to find the real choice the room faces.";

const TIMELINE_STEPS = [
  "Setup",
  "Waiting Room",
  "Self Reflection",
  "Synthesize",
  "Vote",
  "The call",
];

const ACTIVE_STEP = 2;

type Participant = {
  initial: string;
  name: string;
  bg: string;
};

const PARTICIPANTS: Participant[] = [
  { initial: "S", name: "Simon (You)", bg: "#9fd5f1" },
  { initial: "M", name: "Maya", bg: "#f9f6b8" },
  { initial: "T", name: "Theo (Completed)", bg: "#d4f0da" },
  { initial: "P", name: "Priya", bg: "#b9caf5" },
  { initial: "S", name: "Sam", bg: "#ffd9fd" },
];

export default async function RefinePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const sessionTopic = topic?.trim() || DEFAULT_TOPIC;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <Body topic={sessionTopic} />
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
        <button
          type="button"
          aria-label="Toggle camera"
          className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[#f5f5f5] transition-colors hover:bg-neutral-200"
        >
          <VideoIcon />
        </button>
        <button
          type="button"
          aria-label="Copy invite link"
          className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[#f5f5f5] transition-colors hover:bg-neutral-200"
        >
          <LinkIcon />
        </button>
        <div className="flex h-[46px] items-center gap-6 rounded-full bg-[#232323] px-6">
          <span
            className="text-[15px] leading-none text-white"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            4:24s remaining
          </span>
          <button
            type="button"
            className="text-[15px] leading-none text-white transition-opacity hover:opacity-80"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            Pause
          </button>
        </div>
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

function Body({ topic }: { topic: string }) {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-8 lg:px-16 lg:pb-16 lg:pt-8">
      <MainCard topic={topic} />
      <Sidebar topic={topic} />
    </div>
  );
}

function MainCard({ topic }: { topic: string }) {
  const onwardHref = `/vote?topic=${encodeURIComponent(topic)}`;
  return (
    <section className="flex min-w-0 flex-1 flex-col justify-between gap-12 rounded-3xl bg-white p-8 md:p-12">
      <div className="flex flex-col gap-6">
        <p
          className="text-[14px] font-medium leading-none text-black"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          What&apos;s your take?
        </p>
        <h1
          className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
          style={{ fontFamily: "var(--font-queens)" }}
        >
          {topic}
        </h1>

        <PreviousThinkingCard text={PREVIOUS_THINKING} />

        <ReflectionInput />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          className="flex w-[228px] items-center justify-center rounded-2xl bg-white p-4 text-[14px] font-medium leading-none text-black ring-1 ring-inset ring-black/10 transition-colors hover:bg-neutral-100"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          Pass
        </button>
        <Link
          href={onwardHref}
          className="flex flex-1 items-center justify-center rounded-2xl bg-[#1a1a1a] p-4 text-[14px] font-medium leading-none text-white transition-colors hover:bg-black"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          Submit
        </Link>
      </div>
    </section>
  );
}

function PreviousThinkingCard({ text }: { text: string }) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl bg-[#1a1a1a] p-4 text-[12px]"
      style={{ fontFamily: "var(--font-public-sans)" }}
    >
      <p className="leading-none text-white/50">Whose thinking</p>
      <p className="leading-[1.5] text-white">{text}</p>
    </div>
  );
}

function ReflectionInput() {
  return (
    <div className="flex h-[342px] flex-col justify-between rounded-2xl bg-[#f5f5f5] p-4">
      <textarea
        className="w-full flex-1 resize-none bg-transparent text-[15px] leading-[1.5] text-[#1a1a1a] outline-none placeholder:text-[#7a7a7a]"
        defaultValue="What's your read on this? What would you do, and why? Be specific — your thinking is what the AI uses to find the real choice the room faces."
        style={{ fontFamily: "var(--font-public-sans)" }}
      />
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#b5b5b5]" aria-hidden>
            🔒
          </span>
          <p
            className="text-[12px] text-[#7a7a7a]"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            Private until everyone is in
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl bg-white px-4 py-2 text-[14px] font-medium leading-none text-[#1a1a1a] transition-colors hover:bg-neutral-100"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          Refine
        </button>
      </div>
    </div>
  );
}

function Sidebar({ topic }: { topic: string }) {
  return (
    <aside className="flex w-full flex-col gap-8 rounded-3xl bg-white p-6 lg:w-[420px] xl:w-[479px]">
      <SessionInfo topic={topic} />
      <Timeline />
      <InTheRoom />
      <SessionContext />
    </aside>
  );
}

function SessionInfo({ topic }: { topic: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-[14px] font-medium leading-none text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        Session
      </p>
      <p
        className="text-[24px] leading-[1.25] text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        {topic}
      </p>
    </div>
  );
}

function Timeline() {
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
          const active = idx === ACTIVE_STEP;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
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

function InTheRoom() {
  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-[14px] font-medium leading-none text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        In the room
      </p>
      <ul className="flex flex-col gap-4">
        {PARTICIPANTS.map((p) => (
          <li key={p.name} className="flex items-center gap-4">
            <ParticipantAvatar initial={p.initial} bg={p.bg} />
            <span
              className="text-[14px] leading-none text-black"
              style={{ fontFamily: "var(--font-public-sans)" }}
            >
              {p.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ParticipantAvatar({ initial, bg }: { initial: string; bg: string }) {
  return (
    <span
      className="grid h-6 w-6 place-items-center rounded-full text-[10px] leading-none text-black"
      style={{ backgroundColor: bg, fontFamily: "var(--font-public-sans)" }}
    >
      {initial}
    </span>
  );
}

function SessionContext() {
  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-[14px] font-medium leading-none text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        Session Context
      </p>
      <div className="flex flex-wrap gap-3">
        <ContextChip name="2026-CRM-deals.csv" />
        <ContextChip name="2026-CRM-deals.csv" />
      </div>
    </div>
  );
}

function ContextChip({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center gap-3 rounded-full bg-black/5 p-3 text-[14px] leading-none text-black"
      style={{ fontFamily: "var(--font-public-sans)" }}
    >
      <DocIcon />
      {name}
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

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
