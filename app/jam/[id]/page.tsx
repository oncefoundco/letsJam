import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Logo } from "@/app/_components/Logo";
import { createClient } from "@/lib/supabase/server";
import { loadSession } from "@/lib/sessionStore";
import { currentRound, dotColorsByOption, tallyDots } from "@/lib/sessions";
import { REFINE_OPTION_ID } from "@/lib/voting";
import { RecapView, type RecapData } from "./RecapView";

export const metadata = {
  title: "Jam Recap — Jam",
};

// The host's look-back page for a single jam: what the room decided, what
// everyone brought, how the vote fell, and why it refined (when it did).
// Reads Postgres directly (loadSession) — the source of truth — so the recap
// outlives the 24h Redis cache. Owner-gated via jams.created_by.
export default async function JamRecapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/start");

  // A malformed id makes the uuid cast throw — treat it like a missing jam.
  const session = await loadSession(id).catch(() => null);
  // created_by is only written for signed-in hosts; jams without it (guests,
  // pre-history jams) have no owner to show a recap to.
  if (!session || !session.createdBy || session.createdBy !== user.id) {
    notFound();
  }

  const round = currentRound(session);
  const decided = Boolean(session.decision || session.outcome);

  // Dot-vote shape: tallies + per-voter colored dots, same helpers the live
  // vote screen uses, so the recap echoes what the room saw.
  const tally = tallyDots(session);
  const colors = dotColorsByOption(session);
  const totalDots = Object.values(tally).reduce((sum, d) => sum + d, 0);

  const options = (session.options ?? [])
    .map((o) => ({
      id: o.id,
      title: o.title,
      body: o.body || undefined,
      attribution: o.attribution || undefined,
      dots: tally[o.id] ?? 0,
      colors: colors[o.id] ?? [],
      winner: session.decision?.option.id === o.id,
    }))
    .sort((a, b) => b.dots - a.dots);

  // A/B shape: this round's votes per perspective, with voter names.
  const votes = (session.votes ?? []).filter(
    (v) => v.round === (session.outcome?.round ?? round)
  );
  const perspectives = (session.perspectives ?? []).map((p, i) => {
    const slot: "A" | "B" = i === 0 ? "A" : "B";
    const forIt = votes.filter((v) => v.choice === slot);
    return {
      slot,
      label: p.label,
      title: p.title,
      body: p.body,
      attribution: p.attribution,
      votes: forIt.length,
      voters: forIt.map((v) => v.name),
      winner: session.outcome?.choice === slot,
    };
  });

  let result: RecapData["result"];
  if (session.decision) {
    const o = session.decision.option;
    result = {
      title: o.title,
      body: o.body || undefined,
      attribution: o.attribution || undefined,
      round: session.decision.round,
      dots: tally[o.id] ?? 0,
      totalDots,
    };
  } else if (session.outcome?.perspective) {
    const p = session.outcome.perspective;
    result = {
      title: p.title,
      body: p.body || undefined,
      attribution: p.attribution || undefined,
      round: session.outcome.round,
      votes: votes.filter((v) => v.choice === session.outcome!.choice).length,
      votesTotal: votes.length,
    };
  }

  const data: RecapData = {
    id: session.id,
    topic: session.topic,
    description: session.description,
    dateLabel: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(session.createdAt)),
    statusLabel: decided
      ? "Decided"
      : session.startedAt
        ? "In progress"
        : "Waiting",
    decided,
    rounds: round,
    participants: session.participants.map((p) => ({ name: p.name, bg: p.bg })),
    files: session.files ?? [],
    result,
    reflections: (() => {
      const bgById = new Map(session.participants.map((p) => [p.id, p.bg]));
      return (session.reflections ?? []).map((r) => ({
        name: r.name,
        bg: bgById.get(r.participantId) ?? "#cccccc",
        text: r.text,
        passed: r.passed,
      }));
    })(),
    options,
    refineDots: tally[REFINE_OPTION_ID] ?? 0,
    perspectives,
    refineContext: session.refineContext ?? [],
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <RecapView data={data} />
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-6 md:px-12 lg:px-16">
      <Link href="/" className="inline-flex" aria-label="Jam home">
        <Logo />
      </Link>
      <Link
        href="/start"
        className="shrink-0 rounded-full bg-white px-4 py-3 text-[14px] leading-none text-black transition-colors hover:bg-neutral-100"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        ← Previous Jams
      </Link>
    </header>
  );
}
