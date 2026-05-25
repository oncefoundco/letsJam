import Link from "next/link";

export const metadata = {
  title: "Session — Together",
};

const DEFAULT_TOPIC =
  "Why is our enterprise expansion stalling, and what should we do about it in Q1?";

type Participant = {
  initial: string;
  name: string;
  bg: string;
  invited?: boolean;
};

const PARTICIPANTS: Participant[] = [
  { initial: "S", name: "Simon (You)", bg: "#9fd5f1" },
  { initial: "M", name: "Maya", bg: "#f9f6b8" },
  { initial: "T", name: "Theo (Invited)", bg: "#d4f0da", invited: true },
  { initial: "P", name: "Priya (Invited)", bg: "#b9caf5", invited: true },
  { initial: "S", name: "Sam (Invited)", bg: "#ffd9fd", invited: true },
];

const PROMPT_TEXT =
  "What's your read on this? What would you do, and why? Be specific — your thinking is what the AI uses to find the real choice the room faces.";

const VIDEO_TILES: { initial: string; bg: string; active?: boolean }[] = [
  { initial: "S", bg: "linear-gradient(135deg, #6b7280, #1f2937)" },
  { initial: "M", bg: "linear-gradient(135deg, #d9b274, #6b5733)" },
  { initial: "T", bg: "linear-gradient(135deg, #8a9982, #38453a)" },
  { initial: "P", bg: "linear-gradient(135deg, #c97564, #5b2b21)", active: true },
];

export default async function SessionPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; file?: string | string[] }>;
}) {
  const { topic, file } = await searchParams;
  const sessionTopic = topic?.trim() || DEFAULT_TOPIC;
  const files = file ? (Array.isArray(file) ? file : [file]) : [];
  return (
    <div className="flex min-h-screen items-start gap-6 bg-background p-6 md:gap-8 md:p-8">
      <MainColumn />
      <Sidebar topic={sessionTopic} files={files} />
    </div>
  );
}

function MainColumn() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] min-w-0 flex-1 flex-col">
      <header className="flex items-center">
        <Link href="/" aria-label="Together home" className="inline-flex">
          <JamLogo />
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center pr-0 pt-8 lg:pr-16">
        <VideoGrid />
      </div>
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

function VideoGrid() {
  return (
    <div className="grid aspect-[1003/639] w-full grid-cols-2 grid-rows-2 gap-0 overflow-hidden rounded-xl">
      {VIDEO_TILES.map((tile, idx) => (
        <VideoTile key={idx} tile={tile} />
      ))}
    </div>
  );
}

function VideoTile({
  tile,
}: {
  tile: { initial: string; bg: string; active?: boolean };
}) {
  return (
    <div
      className={`relative overflow-hidden ${
        tile.active ? "ring-4 ring-[#34d058] ring-inset" : ""
      }`}
      style={{ background: tile.bg }}
    >
      <div className="absolute inset-0 grid place-items-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-white/15 text-[24px] font-medium text-white/80">
          {tile.initial}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ topic, files }: { topic: string; files: string[] }) {
  return (
    <aside className="flex h-[calc(100vh-4rem)] w-full flex-col justify-between rounded-3xl bg-white p-6 lg:w-[420px] xl:w-[479px]">
      <div className="flex flex-col gap-16">
        <SessionInfo topic={topic} />
        <InWaitingRoom />
        <SessionContext files={files} />
      </div>
      <AiPanel topic={topic} files={files} />
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

function InWaitingRoom() {
  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-[14px] font-medium leading-none text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        In the waiting room
      </p>
      <ul className="flex flex-col gap-4 px-3">
        {PARTICIPANTS.map((p) => (
          <li
            key={p.name}
            className={`flex items-center gap-4 ${p.invited ? "opacity-40" : ""}`}
          >
            <ParticipantAvatar initial={p.initial} bg={p.bg} />
            <span
              className="text-[14px] leading-none text-black"
              style={{ fontFamily: "var(--font-public-sans)" }}
            >
              {p.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ParticipantAvatar({ initial, bg }: { initial: string; bg: string }) {
  return (
    <span
      className="grid h-6 w-6 place-items-center rounded-full text-[10px] leading-none text-black"
      style={{ backgroundColor: bg, fontFamily: "var(--font-public-sans)" }}
    >
      {initial}
    </span>
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

function buildQuery(topic: string, files: string[]) {
  const params = new URLSearchParams();
  params.set("topic", topic);
  files.forEach((f) => params.append("file", f));
  return params.toString();
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

function AiPanel({ topic, files }: { topic: string; files: string[] }) {
  const onwardHref = `/self-reflection?${buildQuery(topic, files)}`;
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
