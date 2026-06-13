import Image from "next/image";
import Link from "next/link";
import { BrandShapes } from "@/app/_components/BrandShapes";
import { Logo } from "@/app/_components/Logo";
import { HeroVideo } from "@/app/_components/HeroVideo";
import { LogoIntro } from "@/app/_components/LogoIntro";
import { PhaseWalkthrough } from "@/app/_components/PhaseWalkthrough";
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
        <PhaseWalkthrough />
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
  // Light hero (Figma node 175:20): header bar, eyebrow pill, headline,
  // subtext, CTA, then a large product photo below — all centered.
  return (
    <section className="flex flex-col items-center px-6 pb-12 pt-5 md:px-8 lg:px-12 xl:px-[80px]">
      {/* Header: logo left, "Get Early Access" right. data-logo-target lets the
          LogoIntro splash fly its (dark) logo onto this box on the light bg. */}
      <header className="flex w-full items-center justify-between py-3 md:py-5">
        <span data-logo-target className="inline-flex">
          <Logo />
        </span>
        <Link
          href="/start"
          className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-[14px] leading-none text-black shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-black/5 transition-colors hover:bg-neutral-100 md:text-[16px]"
          style={publicSans}
        >
          Get Early Access
        </Link>
      </header>

      {/* Hero content, centered. */}
      <div className="flex w-full max-w-[940px] flex-col items-center gap-5 pt-[clamp(2.5rem,9vh,6.5rem)] text-center md:gap-6">
        <Eyebrow />

        <div className="flex flex-col items-center gap-3 md:gap-4">
          {/* This font has no upright 400 face (uprights: 200/300/500/700/800)
              and no Medium italic, so a true uniform 400 isn't available. We use
              the real Light (300) for both the upright and the true-italic, and
              add one inherited hairline stroke across the whole headline to nudge
              both up to ~400 identically — uniform weight, real letterforms. */}
          <h1
            className="lj-lift heading-display text-[clamp(2.375rem,6.5vw,4.75rem)] leading-[0.9] tracking-[-0.03em] text-black [text-wrap:balance]"
            style={{
              ["--lj-delay" as string]: "90ms",
              fontWeight: 300,
              WebkitTextStroke: "0.4px currentColor",
            }}
          >
            The fastest way to get your team{" "}
            <em className="heading-display-italic">genuinely aligned.</em>
          </h1>
          <p
            className="lj-lift max-w-[680px] text-[clamp(0.9375rem,1.35vw,1.25rem)] leading-[1.15] tracking-[-0.02em] text-black/55"
            style={{ ...publicSans, ["--lj-delay" as string]: "180ms" }}
          >
            Jam takes your team from &ldquo;what are we actually solving?&rdquo;
            to a decision everyone gets behind, in one focused session.
          </p>
        </div>

        <div className="lj-lift" style={{ ["--lj-delay" as string]: "260ms" }}>
          <Link
            href="/start"
            className="inline-flex w-[min(440px,90vw)] items-center justify-center rounded-full bg-black px-10 py-[16px] text-[15px] font-normal leading-none text-white transition duration-200 ease-out will-change-transform hover:scale-[1.03] hover:bg-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c5bcb]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] motion-reduce:transition-colors motion-reduce:hover:scale-100 motion-reduce:active:scale-100 md:text-[17px]"
            style={publicSans}
          >
            Host Your First Jam
          </Link>
        </div>
      </div>

      {/* Product video (the Figma still 175:21 is a frame of this clip).
          Negative margins break it out of the section padding so it reads wide
          (near full-bleed), cropped to the comp's wide strip with rounded
          corners. */}
      <div className="mt-[clamp(2.5rem,8vh,6rem)] -mx-3 w-auto max-w-none self-stretch md:-mx-5 lg:-mx-9 xl:-mx-[52px]">
        <div
          className="lj-lift relative aspect-[16/11] w-full overflow-hidden rounded-[20px] sm:aspect-[2/1] lg:aspect-[1862/747] lg:rounded-[28px]"
          style={{ ["--lj-delay" as string]: "340ms" }}
        >
          <HeroVideo className="absolute inset-0 h-full w-full object-cover object-center" />
        </div>
      </div>
    </section>
  );
}

// "Because [Meet · Teams · Zoom] meetings rarely end with a decision" — the
// eyebrow pill above the headline. Icons are slightly rotated, per the comp.
function Eyebrow() {
  return (
    <div
      className="lj-lift flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-[12px] border border-black/5 bg-white px-4 py-2 text-[clamp(0.875rem,1.1vw,1.1875rem)] leading-[1.25] tracking-[-0.01em] text-black/85 sm:gap-x-2.5 sm:px-[16px] sm:py-2.5"
      style={publicSans}
    >
      <span>Because</span>
      <span className="flex items-center gap-2 sm:gap-3">
        <EyebrowIcon src="/landing/icon-meet.png" alt="Google Meet" rotate="-8.44deg" />
        <EyebrowIcon src="/landing/icon-teams.png" alt="Microsoft Teams" rotate="9deg" />
        <EyebrowIcon src="/landing/icon-zoom.png" alt="Zoom" rotate="-8deg" />
      </span>
      <span>meetings rarely end with a decision</span>
    </div>
  );
}

function EyebrowIcon({
  src,
  alt,
  rotate,
}: {
  src: string;
  alt: string;
  rotate: string;
}) {
  return (
    <span className="inline-flex" style={{ transform: `rotate(${rotate})` }}>
      <Image
        src={src}
        alt={alt}
        width={32}
        height={32}
        className="size-[20px] object-contain sm:size-[26px]"
      />
    </span>
  );
}

const PROMISE = [
  "We started Jam with a frustration: strategic decisions inside teams don't actually get made in meetings. They get made in 1:1s after the meeting, in DMs the day after, or most often, they don't get made at all, and the team relitigates the same question two weeks later in a new meeting room.",
  "The cost of this isn't time. It's commitment. Decisions made this way are decisions nobody owns. They unravel the moment someone pushes back in Slack, and the team learns to stop bringing real disagreement to the table.",
  "We don't think the solution is better meetings. We think the solution is a different kind of meeting, one where the structure of the conversation forces the room to do what good facilitators have always done.",
  "That's what letsJam is. A shared room where we run the methodology, your team does the thinking, and the call you make at the end is one the whole room actually committed to — not the loudest person's preference dressed up as consensus.",
];

const FOUNDERS = [
  { name: "Simon Carriere", role: "Co-founder, Head of Growth" },
  // { name: "Anjila Sukuti", role: "Co-founder, Head of Product" },
  // { name: "Abhijan Chitrakar", role: "Co-founder, Head of Communication" },
];

function Promise() {
  return (
    <section className="px-6 pt-16 pb-24 md:px-8 md:pt-24 lg:px-12 xl:px-[80px] 2xl:px-[117px]">
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
