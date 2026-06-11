import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Logo } from "@/app/_components/Logo";
import { createClient } from "@/lib/supabase/server";
import {
  loadDecidedAt,
  loadJamHistory,
  loadSession,
  type RoundHistory,
} from "@/lib/sessionStore";
import { currentRound } from "@/lib/sessions";
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

  // Auth and the recap load are independent — run them concurrently. A
  // malformed id makes the uuid cast throw — treat it like a missing jam.
  const [userResult, session] = await Promise.all([
    createClient().then((c) => c.auth.getUser()),
    loadSession(id).catch(() => null),
  ]);
  const user = userResult.data.user;
  if (!user) redirect("/start");
  // created_by is only written for signed-in hosts; jams without it (guests,
  // pre-history jams) have no owner to show a recap to.
  if (!session || !session.createdBy || session.createdBy !== user.id) {
    notFound();
  }

  const round = currentRound(session);
  const decided = Boolean(session.decision || session.outcome);

  // The round-by-round history (every round's ideas/options/dots now survive
  // round advances) and when the room decided.
  const [history, decidedAtMs] = await Promise.all([
    loadJamHistory(id),
    decided ? loadDecidedAt(id) : Promise.resolve(undefined),
  ]);

  const participantById = new Map(
    session.participants.map((p) => [p.id, { name: p.name, bg: p.bg }])
  );

  // One round's reflections, with each person's individual ideas where they
  // exist (3-takes rows); the joined reflection text stays the fallback.
  const toReflections = (h?: RoundHistory): RecapData["reflections"] => {
    if (!h) return [];
    const ideasByParticipant = new Map<
      string,
      { text: string; refine: boolean }[]
    >();
    for (const idea of h.ideas) {
      const list = ideasByParticipant.get(idea.participantId) ?? [];
      list.push({ text: idea.text, refine: idea.refine });
      ideasByParticipant.set(idea.participantId, list);
    }
    return h.reflections.map((r) => {
      const who = participantById.get(r.participantId);
      return {
        name: who?.name ?? "Someone",
        bg: who?.bg ?? "#cccccc",
        text: r.text,
        passed: r.passed,
        submittedAtMs: r.submittedAtMs,
        ideas: ideasByParticipant.get(r.participantId),
      };
    });
  };

  // One round's option cards with tallies, per-voter colored dots, and the
  // named who-voted-where breakdown.
  const toOptions = (
    h?: RoundHistory
  ): { options: RecapData["options"]; refineDots: number; totalDots: number } => {
    const tally: Record<string, number> = {};
    const colors: Record<string, string[]> = {};
    const voters: Record<string, { name: string; bg: string; dots: number }[]> =
      {};
    for (const d of h?.dots ?? []) {
      const who = participantById.get(d.participantId);
      tally[d.optionId] = (tally[d.optionId] ?? 0) + d.dots;
      (colors[d.optionId] ??= []).push(
        ...Array(d.dots).fill(who?.bg ?? "#cccccc")
      );
      (voters[d.optionId] ??= []).push({
        name: who?.name ?? "Someone",
        bg: who?.bg ?? "#cccccc",
        dots: d.dots,
      });
    }
    const options = (h?.options ?? [])
      .map((o) => ({
        id: o.id,
        title: o.title,
        body: o.body || undefined,
        attribution: o.attribution || undefined,
        dots: tally[o.id] ?? 0,
        colors: colors[o.id] ?? [],
        voters: (voters[o.id] ?? []).sort((a, b) => b.dots - a.dots),
        winner: h?.decisionOptionId === o.id,
      }))
      .sort((a, b) => b.dots - a.dots);
    return {
      options,
      refineDots: tally[REFINE_OPTION_ID] ?? 0,
      totalDots: Object.values(tally).reduce((sum, d) => sum + d, 0),
    };
  };

  const currentH = history.find((h) => h.round === round);
  const { options, refineDots, totalDots } = toOptions(currentH);

  // Earlier rounds become their own timeline blocks, oldest first.
  const pastRounds: RecapData["pastRounds"] = history
    .filter((h) => h.round < round)
    .map((h) => {
      const o = toOptions(h);
      return {
        round: h.round,
        reflections: toReflections(h),
        options: o.options,
        refineDots: o.refineDots,
      };
    })
    .filter((pr) => pr.reflections.length || pr.options.length);

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
      voters: forIt.map((v) => ({ name: v.name, votedAtMs: v.votedAt })),
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
      dots: options.find((x) => x.id === o.id)?.dots ?? 0,
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
    startedAtMs: session.startedAt,
    decidedAtMs,
    participants: session.participants.map((p) => ({ name: p.name, bg: p.bg })),
    files: session.files ?? [],
    result,
    reflections: toReflections(currentH),
    options,
    refineDots,
    pastRounds,
    perspectives,
    narrowedIdeas: session.narrowedIdeas ?? [],
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
