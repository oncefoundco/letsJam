import type { ReactNode } from "react";

// Shared shell + typography for the static legal pages (/privacy, /terms).
// Matches the app's look: paper background, single white card, Queens display
// headline, Public Sans body.

const DISPLAY = { fontFamily: "var(--font-queens)" } as const;
const BODY = { fontFamily: "var(--font-public-sans)" } as const;

export function LegalDoc({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-16 pt-4 md:px-12 lg:px-16">
      <article className="w-full max-w-[760px] rounded-[24px] bg-white p-8 md:p-12">
        <h1
          className="text-[32px] leading-none tracking-[-0.96px] text-[#1a1a1a] sm:text-[40px] md:text-[48px]"
          style={DISPLAY}
        >
          {title}
        </h1>
        <p
          className="mt-3 text-[13px] text-black/50"
          style={BODY}
        >
          Last updated: {lastUpdated}
        </p>
        <div className="mt-8 flex flex-col gap-8">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[17px] font-semibold text-black" style={BODY}>
        {heading}
      </h2>
      {children}
    </section>
  );
}

export function LegalParagraph({ children }: { children: ReactNode }) {
  return (
    <p className="text-[15px] leading-[1.65] text-black/75" style={BODY}>
      {children}
    </p>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ol className="flex list-decimal flex-col gap-2 pl-5">
      {items.map((item, i) => (
        <li
          key={i}
          className="text-[15px] leading-[1.65] text-black/75"
          style={BODY}
        >
          {item}
        </li>
      ))}
    </ol>
  );
}

// Labeled sub-groups (e.g. "1.1 Personal Information" with its own points).
export function LegalSubList({
  items,
}: {
  items: { label: string; points: string[] }[];
}) {
  return (
    <div className="flex flex-col gap-4 pl-1">
      {items.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <p
            className="text-[15px] font-semibold leading-[1.65] text-black/80"
            style={BODY}
          >
            {group.label}
          </p>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5">
            {group.points.map((point, i) => (
              <li
                key={i}
                className="text-[15px] leading-[1.65] text-black/75"
                style={BODY}
              >
                {point}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
