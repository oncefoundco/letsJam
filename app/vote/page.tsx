import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSession,
  type Participant,
  type JamOption,
  type Perspective,
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
import { SynthesizePanel } from "./SynthesizePanel";
import { DotVotePanel } from "./DotVotePanel";
import { VotePanel } from "./VotePanel";

export const metadata = {
  title: "Vote — Jam",
};

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
      <Header sessionId={session.id} hostId={session.participants[0]?.id} />
      <Body
        sessionId={session.id}
        topic={session.topic}
        files={session.files}
        participants={session.participants}
        options={session.options}
        perspectives={session.perspectives}
        round={session.round ?? 1}
        hostId={session.participants[0]?.id}
        decisions={
          session.refineContext && session.refineContext.length > 0
            ? session.refineContext
            : undefined
        }
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
          phase="vote"
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
  options,
  perspectives,
  round,
  hostId,
  decisions,
}: {
  sessionId: string;
  topic: string;
  files: string[];
  participants: Participant[];
  options?: JamOption[];
  perspectives?: Perspective[];
  round: number;
  hostId?: string;
  decisions?: string[];
}) {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-8 lg:px-16 lg:pb-16 lg:pt-8">
      <MainCard
        sessionId={sessionId}
        options={options}
        perspectives={perspectives}
        round={round}
        hostId={hostId}
      />
      <SessionSidebar
        activeStep={ACTIVE_STEP}
        topic={topic}
        decisions={decisions}
        files={files}
        sessionId={sessionId}
        participants={participants}
        participantLabel="In the room"
      />
    </div>
  );
}

function MainCard({
  sessionId,
  options,
  perspectives,
  round,
  hostId,
}: {
  sessionId: string;
  options?: JamOption[];
  perspectives?: Perspective[];
  round: number;
  hostId?: string;
}) {
  // Diamond 1 → dot vote on bucketed options; diamond 2 (round >= 2) → A/B vote
  // on the two perspectives.
  const ab = round >= 2;
  const ready = ab
    ? !!perspectives && perspectives.length > 0
    : !!options && options.length > 0;
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6 rounded-3xl bg-white p-6 md:p-8 lg:p-12">
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
          Vote on your direction
        </h1>
      </div>

      {ready ? (
        ab ? (
          <VotePanel
            sessionId={sessionId}
            perspectives={perspectives!}
            round={round}
            hostId={hostId}
          />
        ) : (
          <DotVotePanel
            sessionId={sessionId}
            options={options!}
            round={round}
            hostId={hostId}
          />
        )
      ) : (
        <SynthesizePanel sessionId={sessionId} />
      )}
    </section>
  );
}

