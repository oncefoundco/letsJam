import Link from "next/link";
import { notFound } from "next/navigation";
import { ClockIcon } from "@heroicons/react/24/outline";
import { getSession } from "@/lib/sessions";
import { WherebyRoom } from "./WherebyRoomClient";
import { SessionSidebar } from "@/app/_components/SessionSidebar";
import { SessionTimerControls } from "@/app/_components/SessionTimerControls";
import { Logo } from "@/app/_components/Logo";
import { ControlButton, HeaderControls } from "@/app/_components/HeaderControls";

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
  const session = await getSession(sessionId);
  if (!session) notFound();
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
          activeStep={1}
          topic={session.topic}
          decisions={session.summary?.decisions}
          files={session.files}
          sessionId={session.id}
          participants={session.participants}
          participantLabel="In the room"
        />
      </div>
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
      <WherebyRoom
        roomUrl={roomUrl}
        sessionId={sessionId}
        leaveHref={`/self-reflection?session=${sessionId}`}
      />
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
