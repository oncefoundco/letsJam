import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import { PhaseWalkthrough } from "@/app/_components/PhaseWalkthrough";

const dmSans = { fontFamily: "var(--font-dm-sans)" } as const;
const publicSans = { fontFamily: "var(--font-public-sans)" } as const;

export default function Home() {
  // overflow-x-clip (not overflow-hidden) clips the rotated brand shapes
  // horizontally without creating a scroll container; overflow-hidden would
  // break the sticky pinning in PhaseWalkthrough.
  return (
    <div className="relative overflow-x-clip bg-background">
      {/* Brand shapes: a warm spark behind the hero, a cool wash by the phase
          walkthrough. Big rounded squares rotated off-axis, per the comp.
          Desktop-only, decorative, never in the content's way. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block"
      >
        <div
          className="absolute rounded-[50px] bg-[var(--color-jam-yellow)]"
          style={{ top: "-10%", right: "-6%", width: "52%", height: "22%", transform: "rotate(-16deg)" }}
        />
        <div
          className="absolute rounded-[50px] bg-[var(--color-jam-blue)]"
          style={{ top: "20%", left: "-12%", width: "46%", height: "16%", transform: "rotate(-16deg)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1920px]">
        <Header />
        <Hero />
        <PhaseWalkthrough />
        <Promise />
        <footer className="px-8 py-12 text-center text-sm text-[color:var(--color-muted-ink)]">
          © {new Date().getFullYear()} letsJam · a Neverfound venture
        </footer>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="flex w-full items-center justify-center px-8 py-6">
      <Logo />
    </header>
  );
}

function BeginButton() {
  return (
    <Link
      href="/start"
      className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-[18px] font-normal text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c5bcb]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      style={{ fontFamily: "var(--font-inter)" }}
    >
      Begin
    </Link>
  );
}

function Hero() {
  return (
    <section className="flex flex-col items-center gap-12 px-6 pb-20 pt-16 md:px-8 lg:gap-12 lg:pb-28 lg:pt-20">
      <div className="relative aspect-[638/517] w-full max-w-[480px] overflow-hidden rounded-[31px]">
        <Image
          src="/landing/hero.png"
          alt="A team running a focused session on letsJam"
          fill
          sizes="(min-width: 768px) 480px, 100vw"
          className="object-cover"
          priority
        />
      </div>

      <div className="flex flex-col items-center gap-8">
        <h1 className="heading-display max-w-[871px] text-center text-[40px] leading-[0.8] text-black [text-wrap:balance] sm:text-[56px] md:text-[64px] lg:text-[72px]">
          Jam is not for every meeting. <br /> But definitely for the ones that{" "} <br />
          <em className="heading-display-italic">matter</em>.
        </h1>
        <p
          className="max-w-[601px] text-center text-[18px] leading-[1.25] tracking-[-0.18px] text-[color:var(--color-muted-ink)]"
          style={dmSans}
        >
          Jam takes your team from &ldquo;what are we actually solving?&rdquo; to
          a decision everyone gets behind, in one focused session.
        </p>
        <BeginButton />
      </div>
    </section>
  );
}

const PROMISE = [
  "We started letsJam with a frustration: strategic decisions inside teams don't actually get made in meetings. They get made in 1:1s after the meeting, in DMs the day after, or, most often, they don't get made at all, and the team relitigates the same question two weeks later in a new meeting room.",
  "The cost of this isn't time. It's commitment. Decisions made this way are decisions nobody owns. They unravel the moment someone pushes back in Slack, and the team learns to stop bringing real disagreement to the table.",
  "We don't think the solution is better meetings. We think the solution is a different kind of meeting, one where the structure of the conversation forces the room to do what good facilitators have always done by hand: get private thinking on the table before group thinking distorts it, surface the real disagreement instead of papering over it, and refuse to lock a decision until every dissent has been heard.",
  "That's what letsJam is. A room where AI runs the methodology, the team does the thinking, and the call you make at the end is one the whole room actually committed to, not the loudest person's preference dressed up as consensus.",
  "Our mission is to make team strategic decisions sharper, faster, and honest. We think most teams have far better strategic instincts than their meetings let them express. letsJam is the room that lets them.",
];

const FOUNDERS = [
  { name: "Simon Carriere", role: "Co-founder, Head of Growth" },
  // { name: "Anjila Sukuti", role: "Co-founder, Head of Product" },
  // { name: "Abhijan Chitrakar", role: "Co-founder, Head of Communication" },
];

function Promise() {
  return (
    <section className="px-6 pb-24 md:px-8 lg:px-12 xl:px-[80px] 2xl:px-[117px]">
      <div className="flex w-full flex-col gap-12 rounded-[32px] bg-white p-8 md:p-16 lg:flex-row lg:items-start lg:gap-24 xl:gap-[120px] xl:p-32">
        <p
          className="shrink-0 text-[24px] leading-[0.8] text-black"
          style={publicSans}
        >
          Our promise
        </p>

        <div className="flex w-full max-w-[994px] flex-col gap-12">
          <div
            className="flex flex-col gap-6 text-[clamp(1.375rem,2.4vw,2.75rem)] leading-[1.25] tracking-[-0.01em] text-[color:var(--color-muted-ink)]"
            style={dmSans}
          >
            {PROMISE.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="h-px w-full bg-black/15" />

          <div className="flex flex-col gap-12 sm:flex-row sm:flex-wrap sm:gap-x-16 sm:gap-y-10">
            {FOUNDERS.map((founder) => (
              <Founder key={founder.name} name={founder.name} role={founder.role} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Founder({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex w-[262px] flex-col items-start gap-6">
      <div className="relative aspect-[512/153] w-full">
        <Image
          src="/landing/signature.png"
          alt={`${name} signature`}
          fill
          sizes="262px"
          className="object-contain object-left"
        />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[24px] leading-[0.9] text-black" style={publicSans}>
          {name}
        </p>
        <p
          className="text-[18px] leading-[1.2] text-[color:var(--color-muted-ink)]"
          style={publicSans}
        >
          {role}
        </p>
      </div>
    </div>
  );
}
