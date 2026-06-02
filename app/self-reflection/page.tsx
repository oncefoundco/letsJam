import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSession,
  type Participant,
  type SessionSummary,
} from "@/lib/sessions";
import { SessionSidebar } from "@/app/_components/SessionSidebar";
import { SessionTimerControls } from "@/app/_components/SessionTimerControls";
import { Logo } from "@/app/_components/Logo";
import {
  ControlButton,
  HeaderControls,
  LinkIcon,
  VideoIcon,
} from "@/app/_components/HeaderControls";
import { ReflectionForm } from "./ReflectionForm";

export const metadata = {
  title: "Self reflection — Jam",
};

const ACTIVE_STEP = 2;


export default async function SelfReflectionPage({
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
      <Header sessionId={session.id} hostId={session.participants[0]?.id} />
      <Body
        sessionId={session.id}
        topic={session.topic}
        files={session.files}
        participants={session.participants}
        summary={session.summary}
        refineContext={session.refineContext}
        hostId={session.participants[0]?.id}
      />
    </div>
  );
}

function Header({ sessionId, hostId }: { sessionId: string; hostId?: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-6 md:px-12 lg:px-16">
      <Link href="/" className="inline-flex" aria-label="Jam home">
        <Logo />
      </Link>
      <HeaderControls>
        <ControlButton aria-label="Toggle camera">
          <VideoIcon />
        </ControlButton>
        <ControlButton aria-label="Copy invite link">
          <LinkIcon />
        </ControlButton>
        <SessionTimerControls
          sessionId={sessionId}
          phase="reflection"
          hostId={hostId}
        />
      </HeaderControls>
    </header>
  );
}

function Body({
  sessionId,
  topic,
  files,
  participants,
  summary,
  refineContext,
  hostId,
}: {
  sessionId: string;
  topic: string;
  files: string[];
  participants: Participant[];
  summary?: SessionSummary;
  refineContext?: string[];
  hostId?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-8 lg:px-16 lg:pb-16 lg:pt-8">
      <MainCard
        sessionId={sessionId}
        topic={topic}
        summary={summary}
        hostId={hostId}
        single={!!refineContext && refineContext.length > 0}
      />
      <SessionSidebar
        activeStep={ACTIVE_STEP}
        topic={topic}
        decisions={
          refineContext && refineContext.length > 0
            ? refineContext
            : summary?.decisions
        }
        files={files}
        sessionId={sessionId}
        participants={participants}
        participantLabel="In the room"
        timeline={!!refineContext && refineContext.length > 0}
      />
    </div>
  );
}

function MainCard({
  sessionId,
  topic,
  summary,
  hostId,
  single,
}: {
  sessionId: string;
  topic: string;
  summary?: SessionSummary;
  hostId?: string;
  single?: boolean;
}) {
  const onwardHref = `/vote?session=${sessionId}`;
  return (
    <section className="flex min-w-0 flex-1 flex-col justify-between gap-12 rounded-3xl bg-white p-6 md:p-8 lg:p-12">
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

        <SummarySnippets summary={summary} />

        <ReflectionForm
          sessionId={sessionId}
          onwardHref={onwardHref}
          hostId={hostId}
          single={single}
        />
      </div>
    </section>
  );
}

function SummarySnippets({ summary }: { summary?: SessionSummary }) {
  if (!summary) return null;
  const groups: { label: string; items: string[] }[] = [
    { label: "Decisions", items: summary.decisions },
    { label: "Open questions", items: summary.openQuestions },
    { label: "Where you differed", items: summary.differences },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl bg-[#f5f5f5] p-4"
      style={{ fontFamily: "var(--font-public-sans)" }}
    >
      <p className="text-[12px] font-medium uppercase tracking-wide text-black/50">
        Meeting summary
      </p>
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <p className="text-[12px] font-medium leading-none text-[#e85d3c]">
            {group.label}
          </p>
          <ul className="flex flex-col gap-1.5">
            {group.items.map((item, idx) => (
              <li
                key={idx}
                className="flex gap-2 text-[13px] leading-snug text-[#1a1a1a]"
              >
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-black/30" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

