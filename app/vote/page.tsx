import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSession,
  type Participant,
  type Perspective,
} from "@/lib/sessions";
import { ParticipantList } from "@/app/_components/ParticipantList";
import { SynthesizePanel } from "./SynthesizePanel";

export const metadata = {
  title: "Vote — Jam",
};

const TIMELINE_STEPS = [
  "Setup",
  "Waiting Room",
  "Self Reflection",
  "Synthesize",
  "Vote",
  "The call",
];

const ACTIVE_STEP = 4;

export default async function VotePage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = await searchParams;
  if (!sessionId) notFound();
  const session = await getSession(sessionId);
  if (!session) notFound();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <Body
        sessionId={session.id}
        topic={session.topic}
        files={session.files}
        participants={session.participants}
        perspectives={session.perspectives}
      />
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-6 md:px-12 lg:px-16">
      <Link href="/" className="inline-flex" aria-label="Jam home">
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
        className="col-start-1 row-start-1 ml-[34px] text-[22px] leading-[0.9] tracking-[-0.88px] text-black"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        jam
      </p>
      <div className="col-start-1 row-start-1 flex h-[21.2px] w-[31.3px] items-center justify-center">
        <div className="-rotate-[11.02deg]">
          <div className="flex items-center justify-center rounded-full bg-[var(--color-jam-blue)] px-1 py-[2px]">
            <span
              className="text-[14px] leading-[0.9] text-black"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              lets
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Body({
  sessionId,
  topic,
  files,
  participants,
  perspectives,
}: {
  sessionId: string;
  topic: string;
  files: string[];
  participants: Participant[];
  perspectives?: Perspective[];
}) {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-8 lg:px-16 lg:pb-16 lg:pt-8">
      <MainCard sessionId={sessionId} perspectives={perspectives} />
      <Sidebar
        sessionId={sessionId}
        topic={topic}
        files={files}
        participants={participants}
      />
    </div>
  );
}

function MainCard({
  sessionId,
  perspectives,
}: {
  sessionId: string;
  perspectives?: Perspective[];
}) {
  const refineHref = `/refine?session=${sessionId}`;
  const ready = perspectives && perspectives.length >= 2;
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

      {ready ? (
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
          {perspectives!.slice(0, 2).map((p, i) => (
            <PerspectiveCard
              key={p.label}
              label={p.label}
              title={p.title}
              body={p.body}
              attribution={p.attribution}
              ctaLabel={`Vote ${String.fromCharCode(65 + i)}`}
            />
          ))}
          <RefineCard refineHref={refineHref} />
        </div>
      ) : (
        <SynthesizePanel sessionId={sessionId} />
      )}
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

function RefineCard({ refineHref }: { refineHref: string }) {
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
        href={refineHref}
        className="flex w-full items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-[9px] text-[14px] font-medium leading-none text-white transition-colors hover:bg-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        Refine
      </Link>
    </article>
  );
}

function Sidebar({
  sessionId,
  topic,
  files,
  participants,
}: {
  sessionId: string;
  topic: string;
  files: string[];
  participants: Participant[];
}) {
  return (
    <aside className="flex w-full flex-col gap-8 rounded-3xl bg-white p-6 lg:w-[420px] xl:w-[479px]">
      <SessionInfo topic={topic} />
      <Timeline />
      <ParticipantList
        participants={participants}
        sessionId={sessionId}
        label="In the room"
      />
      <SessionContext files={files} />
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

function SessionContext({ files }: { files: string[] }) {
  if (files.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-[14px] font-medium leading-none text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        Session Context
      </p>
      <div className="flex flex-wrap gap-3">
        {files.map((name, idx) => (
          <ContextChip key={`${name}-${idx}`} name={name} />
        ))}
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
