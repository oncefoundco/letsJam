"use client";

// Serializable view-model computed by the server page (app/jam/[id]/page.tsx).
export type RecapData = {
  id: string;
  topic: string;
  description?: string;
  dateLabel: string;
  statusLabel: string;
  decided: boolean;
  rounds: number;
  // Timeline anchors (epoch ms) — when the host pressed Start and when the
  // room decided. Either may be absent (never started / not yet decided).
  startedAtMs?: number;
  decidedAtMs?: number;
  participants: { name: string; bg: string }[];
  files: string[];
  // What the room landed on — option (dot vote) or perspective (A/B vote).
  result?: {
    title: string;
    body?: string;
    attribution?: string;
    round: number;
    dots?: number;
    totalDots?: number;
    votes?: number;
    votesTotal?: number;
  };
  reflections: RecapReflection[];
  options: RecapOption[];
  refineDots: number;
  // Earlier rounds' full story — ideas, options, and the dot vote with named
  // voters — kept now that round advances no longer delete history. Each
  // renders as its own timeline block before the current round's sections.
  pastRounds: {
    round: number;
    reflections: RecapReflection[];
    options: RecapOption[];
    refineDots: number;
  }[];
  perspectives: {
    slot: "A" | "B";
    label: string;
    title: string;
    body: string;
    attribution: string;
    votes: number;
    voters: { name: string; votedAtMs?: number }[];
    winner: boolean;
  }[];
  // The top-3 ideas the round-1 dot vote narrowed to (carried into diamond 2).
  narrowedIdeas: string[];
  // Genuine refine reasons — only present when a round was sent back.
  refineContext: string[];
};

export type RecapReflection = {
  name: string;
  bg: string;
  text: string;
  passed: boolean;
  submittedAtMs?: number;
  // The person's individual takes where they exist; `text` is the joined
  // fallback for jams that predate per-idea rows.
  ideas?: { text: string; refine: boolean }[];
};

export type RecapOption = {
  id: string;
  title: string;
  body?: string;
  attribution?: string;
  dots: number;
  // One entry per dot, in the voter's avatar color — the colors alone say who
  // voted where (the People row in the sidebar is the legend).
  colors: string[];
  winner: boolean;
};

const PS = { fontFamily: "var(--font-public-sans)" } as const;
const QUEENS = { fontFamily: "var(--font-queens)" } as const;

export function RecapView({ data }: { data: RecapData }) {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 pb-12 pt-4 md:px-12 lg:flex-row lg:gap-11 lg:px-16 lg:pb-16 lg:pt-8">
      {/* ── Left: the narrative ─────────────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1
            className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
            style={QUEENS}
          >
            {data.topic}
          </h1>
          <p
            className="text-[14px] leading-[1.6] text-[#1a1a1a]/50"
            style={PS}
            suppressHydrationWarning
          >
            {data.dateLabel}
            {" · "}
            {data.participants.length}{" "}
            {data.participants.length === 1 ? "person" : "people"}
            {" · "}
            {data.rounds} {data.rounds === 1 ? "round" : "rounds"}
            {data.startedAtMs ? ` · started ${fmtClock(data.startedAtMs)}` : ""}
            {data.startedAtMs && data.decidedAtMs
              ? ` → decided ${fmtClock(data.decidedAtMs)} (${fmtDuration(
                  data.decidedAtMs - data.startedAtMs
                )})`
              : ""}
          </p>
          {data.description ? (
            <p
              className="text-[15px] leading-[1.5] text-muted-ink"
              style={PS}
            >
              {data.description}
            </p>
          ) : null}
        </div>

        {data.pastRounds.map((pr) => (
          <Section key={pr.round} id={`round-${pr.round}`}>
            <Card title={`Round ${pr.round} — the dot vote`}>
              {pr.reflections.length ? (
                <div className="flex flex-col gap-4">
                  <SubHeading>What people thought</SubHeading>
                  <ReflectionList items={pr.reflections} />
                </div>
              ) : null}
              {pr.options.length ? (
                <div className="flex flex-col gap-4">
                  <SubHeading>Dot voting results</SubHeading>
                  <OptionList options={pr.options} refineDots={pr.refineDots} />
                </div>
              ) : null}
            </Card>
          </Section>
        ))}

        {data.narrowedIdeas.length ? (
          <Section id="narrowed">
            <Card title="What we narrowed to">
              <ul className="flex flex-col gap-4">
                {data.narrowedIdeas.map((idea, i) => (
                  <li
                    key={i}
                    className="border-l-2 border-[#1a1a1a]/15 pl-4 text-[15px] leading-[1.5] text-muted-ink"
                    style={PS}
                  >
                    {idea}
                  </li>
                ))}
              </ul>
            </Card>
          </Section>
        ) : null}

        {data.refineContext.length ? (
          <Section id="refined">
            <Card title="Why we refined">
              <ul className="flex flex-col gap-4">
                {data.refineContext.map((reason, i) => (
                  <li
                    key={i}
                    className="border-l-2 border-[#1a1a1a]/15 pl-4 text-[15px] italic leading-[1.5] text-muted-ink"
                    style={PS}
                  >
                    {reason}
                  </li>
                ))}
              </ul>
            </Card>
          </Section>
        ) : null}

        {data.reflections.length ? (
          <Section id="brought">
            <Card title="What people thought">
              <ReflectionList items={data.reflections} />
            </Card>
          </Section>
        ) : null}

        {data.options.length ? (
          <Section id="options">
            <Card title="The options on the table">
              <OptionList options={data.options} refineDots={data.refineDots} />
            </Card>
          </Section>
        ) : null}

        {data.perspectives.length ? (
          <Section id="vote">
            <Card title="The vote">
              <div className="flex flex-col gap-3">
                {data.perspectives.map((p) => (
                  <div
                    key={p.slot}
                    className={`flex flex-col gap-2 rounded-2xl bg-[#f5f5f5] p-[18px] text-[#1a1a1a] ${
                      p.winner ? "border-2 border-[#1a1a1a]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-[13px] font-semibold leading-none" style={PS}>
                        {p.label || `Path ${p.slot}`}
                      </p>
                      {p.winner ? (
                        <span
                          className="shrink-0 rounded-full bg-jam-yellow px-3 py-1.5 text-[11px] font-semibold leading-none text-[#1a1a1a]"
                          style={PS}
                        >
                          Winner
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[15px] font-medium leading-[1.4]" style={PS}>
                      {p.title}
                    </p>
                    {p.body ? (
                      <p
                        className="text-[14px] leading-[1.5] text-[#1a1a1a]/60"
                        style={PS}
                      >
                        {p.body}
                      </p>
                    ) : null}
                    <p
                      className="text-[13px] leading-[1.4] text-[#1a1a1a]/50"
                      style={PS}
                      suppressHydrationWarning
                    >
                      {p.votes} {p.votes === 1 ? "vote" : "votes"}
                      {p.voters.length
                        ? ` — ${p.voters
                            .map((v) =>
                              v.votedAtMs
                                ? `${v.name} (${fmtClock(v.votedAtMs)})`
                                : v.name
                            )
                            .join(", ")}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        ) : null}

      </main>

      {/* ── Right: sticky at-a-glance ───────────────────────────────────── */}
      <aside className="w-full lg:w-[340px] lg:shrink-0">
        <div className="flex flex-col gap-6 lg:sticky lg:top-8">
          <DecisionNote data={data} />
          <div className="flex flex-col gap-5 rounded-3xl bg-white p-6">
            <p
              className="text-[12px] font-semibold uppercase leading-none tracking-[0.08em] text-[#1a1a1a]/60"
              style={PS}
            >
              At a glance
            </p>
            <dl className="flex flex-col gap-3">
              <GlanceRow label="Status" value={data.statusLabel} />
              <GlanceRow
                label="Rounds"
                value={`${data.rounds} ${data.rounds === 1 ? "round" : "rounds"}`}
              />
              <GlanceRow label="Date" value={data.dateLabel} />
              {data.startedAtMs && data.decidedAtMs ? (
                <GlanceRow
                  label="Duration"
                  value={`${fmtClock(data.startedAtMs)} – ${fmtClock(
                    data.decidedAtMs
                  )} · ${fmtDuration(data.decidedAtMs - data.startedAtMs)}`}
                />
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[14px] leading-none text-[#1a1a1a]/50" style={PS}>
                  People
                </dt>
                <dd className="flex items-center -space-x-1.5">
                  {data.participants.map((p, i) => (
                    <Avatar key={i} name={p.name} bg={p.bg} small ring />
                  ))}
                </dd>
              </div>
              {data.files.length ? (
                <GlanceRow
                  label="Files"
                  value={`${data.files.length} attached`}
                />
              ) : null}
            </dl>
          </div>
        </div>
      </aside>
    </div>
  );
}

// The outcome, pinned above "At a glance" as a sticky note — slight tilt,
// soft shadow, sharp corners so it reads as paper rather than another card.
function DecisionNote({ data }: { data: RecapData }) {
  return (
    <section id="recap-decision" className="scroll-mt-28">
      {data.result ? (
        <div className="flex -rotate-1 flex-col gap-3 rounded-3xl bg-jam-yellow p-6 transition-transform duration-200 hover:rotate-0">
          <p
            className="text-[12px] font-semibold uppercase leading-none tracking-[0.08em] text-[#1a1a1a]/60"
            style={PS}
          >
            The decision
          </p>
          <p
            className="text-[26px] leading-[1.1] tracking-[-0.5px] text-[#1a1a1a]"
            style={QUEENS}
          >
            {data.result.title}
          </p>
          {data.result.body ? (
            <p className="text-[14px] leading-[1.5] text-[#1a1a1a]/80" style={PS}>
              {data.result.body}
            </p>
          ) : null}
          <p
            className="text-[12px] leading-[1.4] text-[#1a1a1a]/60"
            style={PS}
            suppressHydrationWarning
          >
            {data.result.dots != null
              ? `${data.result.dots} of ${data.result.totalDots} dots`
              : `${data.result.votes} of ${data.result.votesTotal} votes`}
            {data.result.round > 1 ? ` · decided in round ${data.result.round}` : ""}
            {data.decidedAtMs ? ` · ${fmtClock(data.decidedAtMs)}` : ""}
            {data.result.attribution ? ` · ${data.result.attribution}` : ""}
          </p>
        </div>
      ) : (
        <div className="flex -rotate-1 flex-col gap-2 rounded-3xl bg-white p-6 shadow-[0_8px_24px_rgba(26,26,26,0.12)]">
          <p
            className="text-[12px] font-semibold uppercase leading-none tracking-[0.08em] text-[#1a1a1a]/60"
            style={PS}
          >
            Where it stands
          </p>
          <p className="text-[16px] italic leading-[1.5] text-[#1a1a1a]" style={PS}>
            This jam hasn&apos;t reached a decision — it&apos;s{" "}
            {data.statusLabel.toLowerCase()}.
          </p>
        </div>
      )}
    </section>
  );
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={`recap-${id}`} className="scroll-mt-28">
      {children}
    </section>
  );
}

// The little label above each sub-block inside a past-round card.
function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[12px] font-semibold uppercase leading-none tracking-[0.08em] text-[#1a1a1a]/60"
      style={PS}
    >
      {children}
    </p>
  );
}

// One round's reflections: each person with their individual ideas (or the
// joined text fallback) and the time they submitted.
function ReflectionList({ items }: { items: RecapReflection[] }) {
  return (
    <ul className="flex flex-col gap-5">
      {items.map((r, i) => (
        <li key={i} className="flex items-start gap-3">
          <Avatar name={r.name} bg={r.bg} />
          <div className="flex min-w-0 flex-col gap-1">
            <p
              className="text-[14px] font-semibold leading-none text-[#1a1a1a]"
              style={PS}
              suppressHydrationWarning
            >
              {r.name}
              {r.submittedAtMs ? (
                <span className="ml-2 font-normal text-[#1a1a1a]/40">
                  {fmtClock(r.submittedAtMs)}
                </span>
              ) : null}
            </p>
            {r.passed ? (
              <p className="text-[15px] italic leading-[1.5] text-[#1a1a1a]/40" style={PS}>
                Passed this round
              </p>
            ) : r.ideas?.length ? (
              <ul className="flex flex-col gap-2">
                {r.ideas.map((idea, j) => (
                  <li
                    key={j}
                    className="border-l-2 pl-3 text-[15px] leading-[1.5] text-muted-ink"
                    style={{ ...PS, borderColor: r.bg }}
                  >
                    {idea.text}
                    {idea.refine ? (
                      <span className="ml-2 rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[11px] italic text-[#1a1a1a]/50">
                        wanted another round
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className="whitespace-pre-line border-l-2 pl-3 text-[15px] leading-[1.5] text-muted-ink"
                style={{ ...PS, borderColor: r.bg }}
              >
                {r.text}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// One round's option cards: tally, per-voter colored dots, and the named
// who-voted-where breakdown, plus the refine row when anyone spent dots on it.
function OptionList({
  options,
  refineDots,
}: {
  options: RecapOption[];
  refineDots: number;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {options.map((o) => (
        <li
          key={o.id}
          className={`flex flex-col gap-2 rounded-2xl p-[18px] ${
            o.winner ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a]"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-[15px] font-medium leading-[1.4]" style={PS}>
              {o.title}
            </p>
            {o.winner ? (
              <span
                className="shrink-0 rounded-full bg-jam-yellow px-3 py-1.5 text-[11px] font-semibold leading-none text-[#1a1a1a]"
                style={PS}
              >
                Winner
              </span>
            ) : null}
          </div>
          {o.body ? (
            <p
              className={`text-[14px] leading-[1.5] ${o.winner ? "text-white/70" : "text-[#1a1a1a]/60"}`}
              style={PS}
            >
              {o.body}
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <Dots colors={o.colors} dim={o.winner} />
            <span
              className={`text-[13px] leading-none ${o.winner ? "text-white/70" : "text-[#1a1a1a]/50"}`}
              style={PS}
            >
              {o.dots} {o.dots === 1 ? "dot" : "dots"}
              {o.attribution ? ` · ${o.attribution}` : ""}
            </span>
          </div>
        </li>
      ))}
      {refineDots > 0 ? (
        <li
          className="flex items-center justify-between rounded-2xl border border-dashed border-[#1a1a1a]/20 p-[18px] text-[14px] italic text-[#1a1a1a]/50"
          style={PS}
        >
          <span>Let&apos;s refine and go again</span>
          <span>
            {refineDots} {refineDots === 1 ? "dot" : "dots"}
          </span>
        </li>
      ) : null}
    </ul>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 md:p-8">
      <h2
        className="text-[26px] leading-none tracking-[-0.5px] text-[#1a1a1a] md:text-[30px]"
        style={QUEENS}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Avatar({
  name,
  bg,
  small,
  ring,
}: {
  name: string;
  bg: string;
  small?: boolean;
  ring?: boolean;
}) {
  return (
    <span
      title={name}
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-[#1a1a1a] ${
        small ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-[12px]"
      } ${ring ? "ring-2 ring-white" : ""}`}
      style={{ ...PS, backgroundColor: bg }}
    >
      {(name[0] ?? "?").toUpperCase()}
    </span>
  );
}

// One small circle per dot, in each voter's avatar color — the same motif as
// the live dot-vote screen, so the recap reads as an echo of the session.
function Dots({ colors, dim }: { colors: string[]; dim?: boolean }) {
  if (!colors.length) return <span />;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {colors.map((c, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${dim ? "ring-1 ring-white/30" : ""}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </span>
  );
}

// "6:15 PM" in the viewer's locale/timezone. Server-rendered text uses the
// server's zone, so callers mark the element suppressHydrationWarning and the
// client paint corrects it.
function fmtClock(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

// "5 min" / "1 h 12 min" / "45 s".
function fmtDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 1) return `${Math.max(1, Math.round(ms / 1000))} s`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

function GlanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[14px] leading-none text-[#1a1a1a]/50" style={PS}>
        {label}
      </dt>
      <dd
        className="text-[14px] font-medium leading-none text-[#1a1a1a]"
        style={PS}
        suppressHydrationWarning
      >
        {value}
      </dd>
    </div>
  );
}

