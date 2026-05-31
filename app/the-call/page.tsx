import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/sessions";
import { Confetti } from "./Confetti";
import { Logo } from "@/app/_components/Logo";

export const metadata = {
  title: "The call — Jam",
};

// The chosen direction, from either the dot vote (`decision`) or the legacy
// A/B vote (`outcome.perspective`).
type Decision = { label: string; title: string; body: string; attribution: string };

export default async function TheCallPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = await searchParams;
  if (!sessionId) notFound();
  const session = await getSession(sessionId);
  if (!session) notFound();

  const decision: Decision | null = session.decision
    ? {
        label: "The room's call",
        title: session.decision.option.title,
        body: session.decision.option.body,
        attribution: session.decision.option.attribution,
      }
    : session.outcome?.perspective ?? null;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Header />
      <Body sessionId={session.id} decision={decision} />
      {decision ? <Confetti /> : null}
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-6 md:px-12 lg:px-16">
      <Link href="/" className="inline-flex" aria-label="Jam home">
        <Logo />
      </Link>
    </header>
  );
}

function Body({
  sessionId,
  decision,
}: {
  sessionId: string;
  decision: Decision | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-stretch px-6 pb-12 pt-4 md:px-12 lg:px-16 lg:pb-16 lg:pt-8">
      <MainCard sessionId={sessionId} decision={decision} />
    </div>
  );
}

function MainCard({
  sessionId,
  decision,
}: {
  sessionId: string;
  decision: Decision | null;
}) {
  return (
    <section className="relative mx-auto flex w-full max-w-3xl min-w-0 flex-1 flex-col gap-8 rounded-3xl bg-white p-6 md:p-8 lg:p-12">
      <div className="flex flex-col gap-4">
        <p
          className="text-[14px] font-medium leading-none text-[#e96748]"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          The call
        </p>
        <h1
          className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
          style={{ fontFamily: "var(--font-queens)" }}
        >
          {decision ? "The room decided" : "No decision yet"}
        </h1>
      </div>

      {decision ? (
        <Decision decision={decision} />
      ) : (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl bg-[#f5f5f5] p-12 text-center"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          <p className="text-[15px] text-[#1a1a1a]">
            This session hasn&apos;t resolved a vote yet.
          </p>
          <Link
            href={`/vote?session=${sessionId}`}
            className="mt-2 rounded-xl bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
          >
            Back to vote
          </Link>
        </div>
      )}
    </section>
  );
}

function Decision({ decision }: { decision: Decision }) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-[#f5f5f5] p-6 md:p-8">
      <p
        className="text-[14px] font-medium leading-none text-[#e96748]"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        {decision.label}
      </p>
      <h2
        className="text-[24px] font-medium leading-snug text-black md:text-[28px]"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        {decision.title}
      </h2>
      <p
        className="text-[15px] leading-[1.6] text-[#1a1a1a]"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        {decision.body}
      </p>
      <div
        className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-[13px]"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        <p className="leading-none text-[#1a1a1a]/50">Whose thinking</p>
        <p className="leading-[1.5] text-[#1a1a1a]">{decision.attribution}</p>
      </div>
    </div>
  );
}

