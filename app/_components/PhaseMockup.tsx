/*
 * Crisp, code-rendered app-window mockups for the PhaseCarousel (no rasterized
 * images). Skeleton-bar style matching the Figma phase screens. One window
 * chrome (lets·jam top bar) wraps a per-phase body.
 */

const AV: Record<string, string> = {
  S: "#6aa0f0",
  M: "#ef6f5b",
  T: "#6bc08a",
  P: "#f4c64e",
};

function Bar({ w, className = "" }: { w: string; className?: string }) {
  return (
    <span
      className={`block h-[10px] rounded-full bg-black/10 ${className}`}
      style={{ width: w }}
    />
  );
}

function Avatar({ id, size = 44 }: { id: keyof typeof AV | string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-black"
      style={{
        width: size,
        height: size,
        background: AV[id] ?? "#ccc",
        fontSize: size * 0.4,
      }}
    >
      {id}
    </span>
  );
}

function Dot({ on }: { on: boolean }) {
  return (
    <span
      className="h-3 w-3 rounded-full"
      style={{ background: on ? "#3c5bcb" : "rgba(60,91,203,0.18)" }}
    />
  );
}

function Window({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex aspect-[1260/680] h-full max-h-[560px] w-auto max-w-full flex-col overflow-hidden rounded-[22px] bg-[#f3f3f3] shadow-[0_30px_70px_rgba(0,0,0,0.10)]">
      <div className="flex shrink-0 items-center justify-between px-6 py-4">
        <span className="flex items-center gap-1.5">
          <span className="inline-block -rotate-[11deg] rounded-full bg-[#e4ecff] px-2 py-[3px] text-[12px] font-bold leading-none text-black">
            lets
          </span>
          <span className="text-[19px] font-bold leading-none tracking-[-0.04em] text-black">
            jam
          </span>
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-black/35">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 15a3 3 0 100-6 3 3 0 000 6z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L16 1H8l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 003 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 002 1.2L8 23h8l.5-2.6a7 7 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </svg>
        </span>
      </div>
      <div className="min-h-0 flex-1 px-3 pb-3">{children}</div>
    </div>
  );
}

function Converse() {
  const ids = ["S", "M", "T", "P"] as const;
  return (
    <div className="flex h-full gap-3">
      {/* call grid */}
      <div className="grid flex-[1.55] grid-cols-2 grid-rows-2 gap-3 rounded-2xl bg-white p-4">
        {ids.map((id) => (
          <div
            key={id}
            className="relative grid place-items-center rounded-xl bg-[#f1f1f1] py-8"
          >
            <Avatar id={id} />
            <span className="absolute bottom-3 left-4">
              <Bar w="38px" className="h-[8px]" />
            </span>
          </div>
        ))}
      </div>
      {/* synthesis */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-5">
          <Bar w="38%" className="h-[11px] bg-black/15" />
          <Bar w="92%" />
          <Bar w="80%" />
          <Bar w="64%" />
          <span className="py-1 text-center text-[18px] leading-none text-black/30">
            •••
          </span>
          <Bar w="70%" />
          <div className="mt-1 flex gap-2">
            <span className="h-7 flex-1 rounded-lg bg-black/30" />
            <span className="h-7 flex-1 rounded-lg bg-black/30" />
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-5">
          <Bar w="34%" className="h-[8px]" />
          {ids.map((id) => (
            <span key={id} className="flex items-center gap-3">
              <Avatar id={id} size={18} />
              <Bar w="55%" className="h-[8px]" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Diverge() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl bg-white p-6">
      <span className="text-[14px] text-black/45" style={{ fontFamily: "var(--font-dm-sans)" }}>
        Reflecting privately
      </span>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl bg-[#f5f5f5] px-4 py-5"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/10 text-black/30">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          <span className="flex flex-1 flex-col gap-2">
            <Bar w={["86%", "82%", "78%"][i]} />
            <Bar w={["60%", "64%", "56%"][i]} className="bg-black/[0.07]" />
          </span>
        </div>
      ))}
    </div>
  );
}

function Collaborate() {
  const dots = [5, 3, 1];
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl bg-white p-6">
      <span className="text-[14px] text-black/45" style={{ fontFamily: "var(--font-dm-sans)" }}>
        Dot Voting
      </span>
      {dots.map((n, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 rounded-xl px-4 py-5 ${
            i === 0 ? "bg-[#eef2fd] ring-1 ring-[#3c5bcb]/30" : "bg-[#f5f5f5]"
          }`}
        >
          <span className="flex flex-1 flex-col gap-2">
            <Bar w={["88%", "84%", "80%"][i]} />
            <Bar w={["62%", "58%", "66%"][i]} className="bg-black/[0.07]" />
          </span>
          <span className="flex shrink-0 gap-1.5">
            {[0, 1, 2, 3, 4].map((d) => (
              <Dot key={d} on={d < n} />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

const CONFETTI = [
  ["#ef6f5b", "12%", "62%", "circle"],
  ["#6bc08a", "20%", "78%", "square"],
  ["#f4c64e", "30%", "58%", "tri"],
  ["#6aa0f0", "40%", "84%", "circle"],
  ["#ef6f5b", "50%", "66%", "square"],
  ["#6bc08a", "58%", "80%", "circle"],
  ["#f4c64e", "67%", "60%", "tri"],
  ["#6aa0f0", "76%", "82%", "square"],
  ["#ef6f5b", "85%", "70%", "circle"],
  ["#6bc08a", "92%", "58%", "tri"],
] as const;

function Decide() {
  return (
    <div className="relative h-full overflow-hidden rounded-2xl bg-white px-7 pb-10 pt-6">
      <span
        className="text-[18px] font-medium text-[#e9a7a0]"
        style={{ fontFamily: "var(--font-queens)" }}
      >
        The Room Has Decided
      </span>
      <div className="mt-4 flex flex-col gap-2.5">
        <Bar w="100%" className="h-[11px] bg-black/15" />
        <Bar w="96%" />
        <Bar w="92%" />
        <Bar w="54%" />
        <Bar w="38%" className="bg-black/[0.07]" />
      </div>
      {CONFETTI.map(([c, left, top, shape], i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left,
            top,
            width: 10,
            background: shape === "tri" ? "transparent" : c,
            borderRadius: shape === "circle" ? "999px" : shape === "square" ? "2px" : "0",
            transform: `rotate(${i * 40}deg)`,
            borderLeft: shape === "tri" ? "5px solid transparent" : undefined,
            borderRight: shape === "tri" ? "5px solid transparent" : undefined,
            borderBottom: shape === "tri" ? `9px solid ${c}` : undefined,
            height: shape === "tri" ? 0 : 10,
          }}
        />
      ))}
    </div>
  );
}

export function PhaseMockup({ variant }: { variant: string }) {
  const body =
    variant === "Converse" ? (
      <Converse />
    ) : variant === "Diverge" ? (
      <Diverge />
    ) : variant === "Collaborate" ? (
      <Collaborate />
    ) : (
      <Decide />
    );
  return <Window>{body}</Window>;
}
