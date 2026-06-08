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
import { PageGuide } from "@/app/_components/PageGuide";

export const metadata = {
  title: "Vote — Jam",
};

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
        description={session.description}
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
  description,
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
  description?: string;
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
        participants={participants}
      />
      <SessionSidebar
        activeStep={round >= 2 ? 6 : 3}
        topic={topic}
        description={description}
        decisions={decisions}
        files={files}
        sessionId={sessionId}
        participants={participants}
        participantLabel="In the room"
      />
      <PageGuide>
        {round >= 2
          ? "Vote to lock the decision. Back the perspective you'd stand behind, weighed against your priorities. If two or more feel something's missing, the room refines and goes once more."
          : "Spend your dots on the options you'd back. Pile them on one or spread them out. The option with the most dots becomes the room's direction."}
      </PageGuide>
    </div>
  );
}

function MainCard({
  sessionId,
  options,
  perspectives,
  round,
  hostId,
  participants,
}: {
  sessionId: string;
  options?: JamOption[];
  perspectives?: Perspective[];
  round: number;
  hostId?: string;
  participants: Participant[];
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
        {ab ? (
          <>
            <h1
              className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
              style={{ fontFamily: "var(--font-queens)" }}
            >
              Vote to lock our decision
            </h1>
            <p
              className="max-w-[860px] text-[14px] font-medium leading-[1.4] text-black"
              style={{ fontFamily: "var(--font-public-sans)" }}
            >
              Jam pulled everyone&apos;s answers into these. Vote for the one
              you&apos;d back, weighed against the three priorities you agreed
              on. If two or more of you feel something&apos;s been missed,
              we&apos;ll go one more round before it&apos;s locked.
            </p>
          </>
        ) : (
          <>
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
          </>
        )}
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
            participants={participants}
          />
        )
      ) : (
        <SynthesizePanel sessionId={sessionId} />
      )}
    </section>
  );
}

