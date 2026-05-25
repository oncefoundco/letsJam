import Link from "next/link";

export const metadata = {
  title: "Waiting room — Together",
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

const ACTIVE_STEP = 1;

type Participant = {
  initial: string;
  name: string;
  bg: string;
  invited?: boolean;
};

const PARTICIPANTS: Participant[] = [
  { initial: "S", name: "Simon (You)", bg: "#9fd5f1" },
  { initial: "M", name: "Maya", bg: "#f9f6b8" },
  { initial: "T", name: "Theo (Invited)", bg: "#d4f0da", invited: true },
  { initial: "P", name: "Priya (Invited)", bg: "#b9caf5", invited: true },
  { initial: "S", name: "Sam (Invited)", bg: "#ffd9fd", invited: true },
];

export default function WaitingRoomPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <Body />
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center gap-3 px-6 py-6 md:px-12 lg:px-16">
      <Link href="/" className="inline-flex" aria-label="Together home">
        <Logo />
      </Link>
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
    <section className="flex min-w-0 flex-1 items-center justify-center">
      <div className="flex w-full max-w-[640px] flex-col items-center gap-11">
        <div className="flex flex-col items-center gap-2">
          <p
            className="text-[14px] font-medium leading-none text-black"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            Waiting to start
          </p>
          <h1
            className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
            style={{ fontFamily: "var(--font-queens)" }}
          >
            Start time 3:30pm
          </h1>
        </div>

        <VideoPreview />

        <div className="flex w-full flex-col gap-4 sm:flex-row sm:gap-6">
          <SecondaryButton>Invite team</SecondaryButton>
          <SecondaryButton href="/session">Join the waiting room</SecondaryButton>
        </div>

        <HowItWorks />
      </div>
    </section>
  );
}

function VideoPreview() {
  return (
    <div className="relative w-full max-w-[366px]">
      <div className="absolute -left-16 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3">
        <IconButton ariaLabel="Toggle microphone">
          <MicIcon />
        </IconButton>
        <IconButton ariaLabel="Toggle camera">
          <VideoIcon />
        </IconButton>
      </div>
      <div className="relative aspect-[547/443] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-700 to-neutral-900">
        {/* Placeholder for the local video preview */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-white/10 text-white/70">
            <CameraEmoji />
          </div>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  ariaLabel,
}: {
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="grid h-[56px] w-[56px] place-items-center rounded-full bg-white shadow-sm transition-colors hover:bg-neutral-100"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
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

function HowItWorks() {
  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl bg-white p-6">
      <p
        className="text-[14px] font-medium leading-none text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        How this works
      </p>
      <ol className="flex flex-col gap-3 text-[12px] leading-[1.5] text-black" style={{ fontFamily: "var(--font-public-sans)" }}>
        <li>1.&nbsp;&nbsp;Each person writes privately — 5 minutes, nobody sees anyone else&apos;s take.</li>
        <li>2.&nbsp;&nbsp;The AI reads the room — synthesizes submissions into two real paths.</li>
        <li>3.&nbsp;&nbsp;The team votes — one vote each, or vote to refine if neither lands.</li>
      </ol>
    </div>
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
          className="text-[24px] leading-[1.25] text-black"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {TOPIC}
        </p>
      </div>

      <Timeline />

      <InWaitingRoom />

      <SessionContext />
    </aside>
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

function InWaitingRoom() {
  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-[14px] font-medium leading-none text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        In the waiting room
      </p>
      <ul className="flex flex-col gap-4 px-3">
        {PARTICIPANTS.map((p) => (
          <li
            key={p.name}
            className={`flex items-center gap-4 ${p.invited ? "opacity-40" : ""}`}
          >
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

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 10l5-3v10l-5-3v-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function CameraEmoji() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 10l5-3v10l-5-3v-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
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
