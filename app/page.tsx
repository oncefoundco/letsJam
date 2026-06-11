import Image from "next/image";
import Link from "next/link";
import { BrandShapes } from "@/app/_components/BrandShapes";
import { Logo } from "@/app/_components/Logo";
import { LogoIntro } from "@/app/_components/LogoIntro";
import { PhaseCarousel } from "@/app/_components/PhaseCarousel";
import { Reveal } from "@/app/_components/Reveal";

const dmSans = { fontFamily: "var(--font-dm-sans)" } as const;
const publicSans = { fontFamily: "var(--font-public-sans)" } as const;

export default function Home() {
  // overflow-x-clip (not overflow-hidden) clips the rotated brand shapes
  // horizontally without creating a scroll container; overflow-hidden would
  // break the sticky pinning in PhaseWalkthrough.
  return (
    <div className="lj-page-load relative overflow-x-clip bg-background">
      <LogoIntro />
      {/* Brand shapes: a warm spark behind the hero, and two blue slabs by the
          phase walkthrough that rise into view in sequence (left, then right).
          Desktop-only, decorative, never in the content's way. */}
      <BrandShapes />

      <div className="relative z-10 mx-auto max-w-[1920px]">
        <Hero />
        <PhaseCarousel />
        <Promise />
        <Reveal
          as="footer"
          className="flex flex-col items-center gap-3 px-8 py-12 text-center text-sm text-[color:var(--color-muted-ink)]"
        >
          <span>© {new Date().getFullYear()} letsJam · a Neverfound venture</span>
          <span className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="underline-offset-2 transition-colors hover:text-black hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="underline-offset-2 transition-colors hover:text-black hover:underline"
            >
              Terms &amp; Conditions
            </Link>
          </span>
        </Reveal>
      </div>
    </div>
  );
}

function Hero() {
  // Full-screen hero (Figma redesign): a single photo with the logo top-left and
  // the headline / subcopy / CTA bottom-left over a dark corner gradient.
  return (
    <section className="relative h-[100svh] min-h-[600px] w-full overflow-hidden">
      {/* Ambient background video; the still is the poster so the first frame
          paints instantly and serves as the fallback. */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/landing/hero-figma.jpg"
        aria-hidden
        className="lj-zoom absolute inset-0 h-full w-full object-cover object-center"
      >
        <source src="/landing/hero.mp4" type="video/mp4" />
      </video>

      {/* Legibility: darken the bottom-left (copy) and a touch of the top-left
          (logo), fading to clear toward the top-right. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(125%_120%_at_0%_100%,rgba(0,0,0,0.80)_0%,rgba(0,0,0,0.38)_34%,rgba(0,0,0,0)_64%)]"
      />

      {/* Logo, top-left. data-logo-target: LogoIntro flies the splash logo onto
          this exact box, then reveals it. */}
      <div className="absolute left-[clamp(1.25rem,5vw,99px)] top-[clamp(1.25rem,4.5vh,78px)] z-[2]">
        <span data-logo-target className="inline-flex">
          <Logo light />
        </span>
      </div>

      {/* Content, bottom-left. */}
      <div className="absolute bottom-[clamp(2.5rem,12vh,170px)] left-[clamp(1.25rem,5vw,99px)] z-[2] flex max-w-[min(727px,88vw)] flex-col gap-[clamp(1.25rem,3vh,2.5rem)]">
        <h1
          className="lj-lift heading-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-[-0.03em] text-white [text-wrap:balance]"
          style={{ ["--lj-delay" as string]: "90ms" }}
        >
          The fastest way to get your team{" "}
          <em className="heading-display-italic">genuinely aligned.</em>
        </h1>
        <p
          className="lj-lift text-[clamp(0.95rem,1.4vw,1.375rem)] leading-[1.4] tracking-[-0.01em] text-white/60"
          style={{ ...publicSans, ["--lj-delay" as string]: "180ms" }}
        >
          Jam is not for every meeting. But definitely for the ones that matter.
          Jam takes your team from &ldquo;what are we actually solving?&rdquo; to
          a decision everyone gets behind, in one focused session.
        </p>
        <div className="lj-lift" style={{ ["--lj-delay" as string]: "260ms" }}>
          <Link
            href="/start"
            className="inline-flex items-center justify-center rounded-full bg-black px-7 py-4 text-[18px] font-normal leading-none text-white transition duration-200 ease-out will-change-transform hover:scale-[1.03] hover:bg-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c5bcb]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-colors motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Host Your First Jam
          </Link>
        </div>
      </div>
    </section>
  );
}

const PROMISE = [
  "We started Jam with a frustration: strategic decisions inside teams don't actually get made in meetings. They get made in 1:1s after the meeting, in DMs the day after, or most often, they don't get made at all, and the team relitigates the same question two weeks later in a new meeting room.",
  "The cost of this isn't time. It's commitment. Decisions made this way are decisions nobody owns. They unravel the moment someone pushes back in Slack, and the team learns to stop bringing real disagreement to the table.",
  "We don't think the solution is better meetings. We think the solution is a different kind of meeting, one where the structure of the conversation forces the room to do what good facilitators have always done by hand: get private thinking on the table before group thinking distorts it, surface the real disagreement instead of papering over it, and refuse to lock a decision until every dissent has been heard.",
  "That's what letsJam is. A room where AI runs the methodology, the team does the thinking, and the call you make at the end is one the whole room actually committed to — not the loudest person's preference dressed up as consensus.",
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
        <Reveal
          as="p"
          className="shrink-0 text-[20px] leading-[0.8] text-black sm:text-[24px]"
          style={publicSans}
        >
          Our promise
        </Reveal>

        <div className="flex w-full max-w-[994px] flex-col gap-12">
          <Reveal
            className="flex flex-col gap-5 text-[clamp(1rem,1.5vw,1.5rem)] leading-[1.4] tracking-[-0.01em] text-[color:var(--color-muted-ink)] sm:leading-[1.4]"
            style={dmSans}
            delay={80}
          >
            {PROMISE.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </Reveal>

          <Reveal className="h-px w-full bg-black/15" delay={140} />

          <Reveal
            className="flex flex-col gap-12 sm:flex-row sm:flex-wrap sm:gap-x-16 sm:gap-y-10"
            delay={180}
          >
            {FOUNDERS.map((founder) => (
              <Founder key={founder.name} name={founder.name} role={founder.role} />
            ))}
          </Reveal>
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
        <p className="text-[20px] leading-[0.9] text-black sm:text-[24px]" style={publicSans}>
          {name}
        </p>
        <p
          className="text-[16px] leading-[1.2] text-[color:var(--color-muted-ink)] sm:text-[18px]"
          style={publicSans}
        >
          {role}
        </p>
      </div>
    </div>
  );
}
