import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSession, type Participant } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";
import { VideoPreview } from "./VideoPreviewClient";
import { InviteModal } from "./InviteModal";
import { JoinGate } from "./JoinGate";
import { MainCardActions } from "./MainCardActions";
import { StartTime } from "./StartTime";
import { SessionSidebar } from "@/app/_components/SessionSidebar";
import { Logo } from "@/app/_components/Logo";

export const metadata = {
  title: "Waiting room — Jam",
};

const ACTIVE_STEP = 0;

export default async function WaitingRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = await searchParams;
  if (!sessionId) notFound();
  const session = await getSession(sessionId);
  if (!session) notFound();

  // Joiners must sign in and set name + color — same gate as the host.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = user?.user_metadata ?? {};
  const authed = Boolean(user);
  const initialName =
    (meta.display_name as string) ||
    (meta.full_name as string) ||
    (meta.name as string) ||
    "";
  const initialColor =
    typeof meta.color === "string" ? (meta.color as string) : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <Body
        sessionId={session.id}
        topic={session.topic}
        files={session.files}
        participants={session.participants}
        createdAt={session.createdAt}
      />
      <InviteModal />
      <Suspense fallback={null}>
        <JoinGate
          sessionId={session.id}
          authed={authed}
          initialName={initialName}
          initialColor={initialColor}
        />
      </Suspense>
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center gap-3 px-6 py-6 md:px-12 lg:px-16">
      <Link href="/" className="inline-flex" aria-label="Jam home">
        <Logo />
      </Link>
    </header>
  );
}

function Body({
  sessionId,
  topic,
  files,
  participants,
  createdAt,
}: {
  sessionId: string;
  topic: string;
  files: string[];
  participants: Participant[];
  createdAt: number;
}) {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-8 lg:px-16 lg:pb-16 lg:pt-8">
      <MainCard
        sessionId={sessionId}
        hostId={participants[0]?.id}
        createdAt={createdAt}
      />
      <SessionSidebar
        activeStep={ACTIVE_STEP}
        topic={topic}
        files={files}
        sessionId={sessionId}
        participants={participants}
        participantLabel="In the waiting room"
      />
    </div>
  );
}

function MainCard({
  sessionId,
  hostId,
  createdAt,
}: {
  sessionId: string;
  hostId?: string;
  createdAt: number;
}) {
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
            <StartTime createdAt={createdAt} />
          </h1>
        </div>

        <VideoPreview />

        <MainCardActions sessionId={sessionId} hostId={hostId} />

        <HowItWorks />
      </div>
    </section>
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

