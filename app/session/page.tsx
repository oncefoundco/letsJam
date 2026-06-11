import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { getSession } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";
import { WherebyRoom } from "./WherebyRoomClient";
import { JoinGate } from "@/app/waiting-room/JoinGate";
import { SessionSidebar } from "@/app/_components/SessionSidebar";
import { SessionTimerControls } from "@/app/_components/SessionTimerControls";
import { Logo } from "@/app/_components/Logo";
import { ControlButton, HeaderControls } from "@/app/_components/HeaderControls";
import { PageGuide } from "@/app/_components/PageGuide";

export const metadata = {
  title: "Session — Jam",
};

const PROMPT_TEXT =
  "What's your read on this? What would you do, and why? Be specific — your thinking is what the AI uses to find the real choice the room faces.";

export default async function SessionPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = await searchParams;
  if (!sessionId) notFound();
  // getSession (Redis/Postgres) and auth (Supabase Auth API) are independent
  // — run them concurrently so the page pays one round trip, not two.
  // Late joiners who land straight on the call (meeting already started) must
  // sign in and set their name + color, same as the waiting-room gate. Existing
  // participants have a localStorage record, so the gate stays out of their way.
  const [session, userResult] = await Promise.all([
    getSession(sessionId),
    createClient().then((c) => c.auth.getUser()),
  ]);
  if (!session) notFound();
  const user = userResult.data.user;
  const meta = user?.user_metadata ?? {};
  const authed = Boolean(user);
  const initialName =
    (meta.display_name as string) ||
    (meta.full_name as string) ||
    (meta.name as string) ||
    "";
  const initialColor =
    typeof meta.color === "string" ? (meta.color as string) : undefined;
  // The second (solution) call reuses this route; the round tells the stepper
  // which "Discuss" we're on. (Keyed off the round, not narrowedIdeas presence,
  // so the rare round bump that skips narrowing still reads as diamond 2.)
  const isRound2 = (session.round ?? 1) >= 2;

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-background p-6 md:gap-8 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" aria-label="Jam home" className="inline-flex">
          <Logo />
        </Link>
        <HeaderControls>
          <ControlButton aria-label="Time remaining">
            <ClockIcon className="size-[18px]" />
          </ControlButton>
          <SessionTimerControls
            sessionId={session.id}
            phase="discussion"
            hostId={session.participants[0]?.id}
          />
        </HeaderControls>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-6 md:gap-8 lg:flex-row lg:items-stretch">
        <MainColumn roomUrl={session.roomUrl} sessionId={session.id} />
        <SessionSidebar
          activeStep={isRound2 ? 4 : 1}
          topic={session.topic}
          description={session.description}
          decisions={
            session.narrowedIdeas && session.narrowedIdeas.length > 0
              ? session.narrowedIdeas
              : undefined
          }
          files={session.files}
          sessionId={session.id}
          participants={session.participants}
          participantLabel="In the room"
        />
      </div>
      <PageGuide>
        {isRound2
          ? "This is the second call. Talk through the option the room chose and how to sharpen it. When the host moves on, you'll each propose your solution privately."
          : "This is the live call. Talk the challenge through as a group. When the host moves the room on, you'll each reflect privately before anything is shared."}
      </PageGuide>
      <Suspense fallback={null}>
        <JoinGate
          sessionId={session.id}
          authed={authed}
          initialName={initialName}
          initialColor={initialColor}
          loginNext={`/session?session=${session.id}`}
          redirectToSessionWhenStarted={false}
        />
      </Suspense>
    </div>
  );
}

function MainColumn({
  roomUrl,
  sessionId,
}: {
  roomUrl: string;
  sessionId: string;
}) {
  return (
    <div className="flex min-h-[60vh] min-w-0 flex-1 flex-col lg:min-h-0">
      <WherebyRoom roomUrl={roomUrl} sessionId={sessionId} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- temporarily hidden; restore when ready
function AiPanel({ sessionId }: { sessionId: string }) {
  const onwardHref = `/self-reflection?session=${sessionId}`;
  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-[#1a1a1a] p-8">
      <div className="flex items-center justify-between">
        <p
          className="text-[18px] leading-none text-white"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          4:24s remaining
        </p>
        <Link
          href={onwardHref}
          className="text-[18px] leading-none text-white/60 transition-colors hover:text-white"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          End Session
        </Link>
      </div>

      <div
        className="flex flex-col gap-4 text-[12px] leading-[1.4] text-white/50"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        <p>Decisions Surfaced:</p>
        <ol className="flex list-decimal flex-col gap-4 pl-5">
          <li className="text-white">{PROMPT_TEXT}</li>
          <li className="text-white">{PROMPT_TEXT}</li>
          <li className="text-white">{PROMPT_TEXT}</li>
        </ol>
      </div>

      <button
        type="button"
        aria-label="More options"
        className="mx-auto grid h-6 w-6 place-items-center text-white/60"
      >
        <KebabIcon />
      </button>
    </div>
  );
}

function KebabIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}
