import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, type Participant } from "@/lib/sessions";
import { WherebyRoom } from "./WherebyRoomClient";
import { ParticipantList } from "@/app/_components/ParticipantList";

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
      <header className="flex items-center">
        <Link href="/" aria-label="Jam home" className="inline-flex">
          <JamLogo />
        </Link>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-6 md:gap-8 lg:flex-row lg:items-stretch">
        <MainColumn roomUrl={session.roomUrl} sessionId={session.id} />
        <Sidebar
          sessionId={session.id}
          topic={session.topic}
          files={session.files}
          participants={session.participants}
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

function JamLogo() {
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
    <aside className="flex h-auto w-full flex-col justify-between gap-8 rounded-3xl bg-white p-6 lg:w-[420px] lg:gap-0 xl:w-[479px]">
      <div className="flex flex-col gap-16">
        <SessionInfo topic={topic} />
        <ParticipantList
          participants={participants}
          sessionId={sessionId}
          label="In the waiting room"
        />
        <SessionContext files={files} />
      </div>
      <AiPanel sessionId={sessionId} />
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

function KebabIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}
