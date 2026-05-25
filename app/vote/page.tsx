import Link from "next/link";

export const metadata = {
  title: "Vote — Together",
};

const TOPIC =
  "Why is our enterprise expansion stalling, and what should we do about it in Q1?";

const TIMELINE_STEPS = [
  "Setup",
  "Waiting Room",
  "Self Reflection",
  "Synthesize",
  "Vote",
  "The call",
];

const ACTIVE_STEP = 4;

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

const PERSPECTIVE_BODY =
  "What's your read on this? What would you do, and why? Be specific — your thinking is what the AI uses to find the real choice the room faces.";

export default function VotePage() {
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
        <div className="flex h-[46px] items-center gap-6 rounded-full bg-[#232323] px-6">
          <button
            type="button"
            className="text-[15px] leading-none text-white transition-opacity hover:opacity-80"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            Pause
          </button>
          <span
            className="text-[15px] leading-none text-white/50"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            4:24s remaining
          </span>
        </div>
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
    <section className="flex min-w-0 flex-1 flex-col gap-6 rounded-3xl bg-white p-8 md:p-12">
      <div className="flex flex-col gap-4">
        <p
          className="text-[14px] font-medium leading-none text-black"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          Time to decide
        </p>
        <h1
          className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
          style={{ fontFamily: "var(--font-queens)" }}
        >
          Vote on your
        </h1>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
        <PerspectiveCard
          label="Perspective A"
          title="Reposition first, the platform story is the gate"
          body={PERSPECTIVE_BODY}
          attribution={PERSPECTIVE_BODY}
          ctaLabel="Vote A"
        />
        <PerspectiveCard
          label="Perspective B"
          title="Reposition first, the platform story is the gate"
          body={PERSPECTIVE_BODY}
          attribution={PERSPECTIVE_BODY}
          ctaLabel="Vote B"
        />
        <RefineCard />
      </div>
    </section>
  );
}

function PerspectiveCard({
  label,
  title,
  body,
  attribution,
  ctaLabel,
}: {
  label: string;
  title: string;
  body: string;
  attribution: string;
  ctaLabel: string;
}) {
  return (
    <article className="flex h-full min-h-[420px] flex-col justify-between gap-6 rounded-2xl bg-[#f5f5f5] p-4">
      <div className="flex flex-col gap-6">
        <p
          className="text-[14px] font-medium leading-none text-[#e96748]"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {label}
        </p>
        <h2
          className="text-[18px] font-medium leading-snug text-black"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {title}
        </h2>
        <p
          className="text-[12px] leading-[1.5] text-[#1a1a1a]"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {body}
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <div
          className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-[12px]"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          <p className="leading-none text-[#1a1a1a]/50">Whose thinking</p>
          <p className="leading-[1.5] text-[#1a1a1a]">{attribution}</p>
        </div>
        <button
          type="button"
          className="flex w-full items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-[9px] text-[14px] font-medium leading-none text-white transition-colors hover:bg-black"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {ctaLabel}
        </button>
      </div>
    </article>
  );
}

function RefineCard() {
  return (
    <article className="flex h-full min-h-[420px] flex-col gap-6 rounded-2xl bg-[#f5f5f5] p-4">
      <h2
        className="text-[18px] font-medium leading-snug text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        Neither, we need to refine
      </h2>
      <div className="flex flex-1 flex-col gap-3 rounded-2xl bg-white p-4 text-[12px] leading-[1.5] text-[#1a1a1a]">
        <p style={{ fontFamily: "var(--font-public-sans)" }}>
          What&apos;s missing? What would make the next round sharper?
        </p>
        <p
          className="italic"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          (Refinement triggers if 2 or more vote for it. Refine votes require a written reason.)
        </p>
      </div>
      <Link
        href="/refine"
        className="flex w-full items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-[9px] text-[14px] font-medium leading-none text-white transition-colors hover:bg-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        Refine
      </Link>
    </article>
  );
}

function Sidebar() {
  return (
    <aside className="flex w-full flex-col gap-8 rounded-3xl bg-white p-6 lg:w-[420px] xl:w-[479px]">
      <SessionInfo />
      <Timeline />
      <InTheRoom />
      <SessionContext />
    </aside>
  );
}

function SessionInfo() {
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
        {TOPIC}
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
