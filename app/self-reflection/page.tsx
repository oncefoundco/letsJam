import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, type Participant } from "@/lib/sessions";
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
import { PageGuide } from "@/app/_components/PageGuide";

export const metadata = {
  title: "Self reflection — Jam",
};


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
        description={session.description}
        files={session.files}
        participants={session.participants}
        refineContext={session.refineContext}
        round={session.round ?? 1}
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
  description,
  files,
  participants,
  refineContext,
  round,
  hostId,
}: {
  sessionId: string;
  topic: string;
  description?: string;
  files: string[];
  participants: Participant[];
  refineContext?: string[];
  round: number;
  hostId?: string;
}) {
  // Diamond 1 (round 1) is the 3-priorities reflection; Diamond 2 (round 2+) is
  // a single-take "propose your solution". A round that's been sent back for
  // refinement carries the room's concerns (refineContext).
  const single = round >= 2;
  const refining = !!refineContext && refineContext.length > 0;
  return (
    <div className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-8 lg:px-16 lg:pb-16 lg:pt-8">
      <MainCard
        sessionId={sessionId}
        hostId={hostId}
        single={single}
        refining={refining}
        refineContext={refineContext}
      />
      <SessionSidebar
        activeStep={single ? 5 : 2}
        topic={topic}
        description={description}
        decisions={refining ? refineContext : undefined}
        files={files}
        sessionId={sessionId}
        participants={participants}
        participantLabel="In the room"
      />
      <PageGuide>
        {!single
          ? "Reflect privately. Write the three things any answer has to solve. Nothing's shared until everyone's in, then your lists get combined and voted on."
          : refining
            ? "The room asked for another pass. Read what came up, then sharpen your answer with it in mind. You'll vote once more after."
            : "Reflect privately. Propose the one solution you'd back. Once everyone's in, your answers become the options the room votes on."}
      </PageGuide>
    </div>
  );
}

function MainCard({
  sessionId,
  hostId,
  single,
  refining,
  refineContext,
}: {
  sessionId: string;
  hostId?: string;
  single?: boolean;
  refining?: boolean;
  refineContext?: string[];
}) {
  const onwardHref = `/vote?session=${sessionId}`;
  return (
    <section className="flex min-w-0 flex-1 flex-col justify-between gap-12 rounded-3xl bg-white p-6 md:p-8 lg:p-12">
      <div className="flex flex-col gap-6">
        {!single ? (
          <div className="flex flex-col gap-3">
            <h1
              className="text-[32px] leading-[1.05] tracking-[-0.96px] text-[#1a1a1a] md:text-[40px]"
              style={{ fontFamily: "var(--font-queens)" }}
            >
              What are the 3 things our answer needs to solve?
            </h1>
            <p
              className="max-w-[640px] text-[15px] leading-[1.5] text-black/60"
              style={{ fontFamily: "var(--font-public-sans)" }}
            >
              Write the three most important things any solution has to address.
              Just your own view for now; everyone&apos;s lists get combined and
              voted on next.
            </p>
          </div>
        ) : refining ? (
          <div className="flex flex-col gap-4">
            <h1
              className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
              style={{ fontFamily: "var(--font-queens)" }}
            >
              Let&apos;s refine and go again
            </h1>
            <p
              className="max-w-[860px] text-[14px] font-medium leading-[1.4] text-black"
              style={{ fontFamily: "var(--font-public-sans)" }}
            >
              A couple of you felt something was missed, so we&apos;re taking one
              more pass. Take a look at what came up below, then tweak your answer
              with it in mind. We&apos;ll vote once more after.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h1
              className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
              style={{ fontFamily: "var(--font-queens)" }}
            >
              Propose your solution.
            </h1>
            <p
              className="max-w-[760px] text-[14px] font-medium leading-[1.4] text-black"
              style={{ fontFamily: "var(--font-public-sans)" }}
            >
              Now the fun part: what would you actually do? Write the one
              solution you&apos;d back, and make sure it answers the three things
              the room agreed on. Just your own call for now; everyone sees them
              once you&apos;re all in.
            </p>
          </div>
        )}

        {refining && refineContext && refineContext.length > 0 ? (
          <div
            className="flex flex-col gap-[10px] rounded-2xl bg-[#1a1a1a] p-4 text-[12px]"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            <p className="leading-none text-white/50">Raised by the room</p>
            {refineContext.map((reason, i) => (
              <p key={i} className="leading-[1.5] text-white">
                {reason}
              </p>
            ))}
          </div>
        ) : null}

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

