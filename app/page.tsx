"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/app/_components/Logo";

export default function Home() {
  return (
    <div className="bg-background">
      <div className="relative overflow-hidden pb-12 lg:pb-[160px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 hidden lg:block"
        >
          <div
            className="absolute rounded-[50px] bg-[var(--color-jam-yellow)]"
            style={{
              top: "-34%",
              height: "106%",
              bottom: "0%",
              left: "50%",
              right: "0%",
              transform: "rotate(-16.152deg)",
              transformOrigin: "center",
              width: "100%",
            }}
          />
        </div> 

        <div className="relative z-10 mx-auto max-w-[1920px]">
          <Header />
          <Hero />
        </div>
      </div>

      <div className="relative mx-auto max-w-[1920px]">
        <FairlySection />
        <Features />
        <Promise />
        <footer className="px-8 py-12 text-center text-sm text-[color:var(--color-muted-ink)]">
          © {new Date().getFullYear()} Together — a Neverfound venture
        </footer>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="relative z-20 flex w-full items-center justify-between px-6 py-6 md:px-8 lg:px-12 xl:px-[80px] 2xl:px-[143px]">
      <Logo />
      <p className="hidden text-[13px] font-medium text-black sm:block">
        Together is a <em className="italic">Neverfound</em> venture exploring
        how teams collaborate with AI
      </p>
    </header>
  );
}

function BeginButton() {
  return (
    <Link
      href="/start"
      className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-[15px] font-normal text-white transition-colors hover:bg-neutral-800"
      style={{ fontFamily: "var(--font-inter)" }}
    >
      Begin
    </Link>
  );
}

type HeroExample = {
  title: string;
  body: string;
  thumbBg: string;
};

const HERO_EXAMPLES: HeroExample[] = [
  {
    title: "Create data infographic on c...",
    body: "Convert the key data from an article on \"Global Coffee Consumption...",
    thumbBg: "linear-gradient(135deg, #f4d49a, #c97a3a)",
  },
  {
    title: "Design Japanese restaurant ...",
    body: "Design a menu for my high-end Japanese restaurant, \"Sakura...",
    thumbBg: "linear-gradient(135deg, #c8e6c0, #5a7a5e)",
  },
  {
    title: "Design smart bracelet and p...",
    body: "Design the product concept and packaging for my health-monitorin...",
    thumbBg: "linear-gradient(135deg, #ecedef, #b5b8c0)",
  },
  {
    title: "Design SaaS product launch ...",
    body: "Design a set of product launch promotional posters for my project...",
    thumbBg: "linear-gradient(135deg, #2a2540, #0f0c1f)",
  },
];

function HeroExamples() {
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-4">
      <p
        className="text-[13px] leading-none text-black/90"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        Get started with
      </p>
      <ul className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
        {HERO_EXAMPLES.map((example) => (
          <li key={example.title}>
            <button
              type="button"
              className="group flex w-full items-start gap-3 text-left transition-opacity hover:opacity-100 focus-visible:outline-none [&:not(:hover)]:opacity-85"
              style={{ fontFamily: "var(--font-public-sans)" }}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] leading-tight text-black/70 group-hover:text-black">
                    {example.title}
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 text-[14px] leading-none text-black/40 transition-transform group-hover:translate-x-0.5 group-hover:text-black/70"
                  >
                    ›
                  </span>
                </div>
                <p
                  className="text-[12px] leading-snug text-black/55"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    maskImage:
                      "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
                    WebkitMaskImage:
                      "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
                  }}
                >
                  {example.body}
                </p>
              </div>
              <div
                className="aspect-square w-[72px] shrink-0 rounded-md transition-transform group-hover:scale-[1.02]"
                style={{ background: example.thumbBg }}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative grid grid-cols-1 gap-12 px-6 pb-24 pt-14 md:px-8 md:pt-20 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:px-12 lg:pb-32 lg:pr-6 lg:pt-24 xl:gap-16 xl:px-[80px] xl:pr-10 xl:pt-32 2xl:px-[143px] 2xl:pr-20 2xl:pt-36">
      <div className="relative z-10 flex flex-col items-start gap-8">
        <h1 className="heading-display text-[52px] leading-[0.75] text-black sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[108px] 2xl:text-[120px]">
          What can we
          <br />
          solve together?
        </h1>

        <HeroExamples />

        <BeginButton />
      </div>

      <div className="relative z-10 aspect-[89/72] w-full overflow-hidden rounded-[40px] lg:mt-[-20px] lg:-translate-x-8 lg:rounded-[50px] xl:-translate-x-16 2xl:-translate-x-24">
        <Image
          src="/landing/hero-photo.png"
          alt="A person using Together on their laptop"
          fill
          sizes="(min-width: 1024px) 759px, 100vw"
          className="object-cover"
          priority
        />
      </div>
    </section>
  );
}

function FairlySection() {
  return (
    <section className="relative z-10 mx-auto flex max-w-[900px] flex-col items-center gap-8 px-6 pb-12 pt-10 text-center md:px-8 lg:pb-16 lg:pt-20">
      <h2
        className="heading-display text-[44px] leading-[0.8] text-black md:text-[60px] lg:text-[72px]"
        style={{ fontWeight: 300 }}
      >
        <span className="md:whitespace-nowrap">Host meetings where decisions</span>
        <br className="hidden md:inline" />{" "}
        <span className="md:whitespace-nowrap">
          actually get made{" "}
          <em className="heading-display-italic" style={{ fontWeight: 300 }}>
            fairly
          </em>
        </span>
      </h2>
      <p className="text-[18px] leading-[1.25] tracking-[-0.18px] text-[color:var(--color-muted-ink)]">
        Inspired by the foundations of design thinking and facilitation
      </p>
      <BeginButton />
    </section>
  );
}

type Feature = {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
};

const featuresLeft: Feature[] = [
  {
    eyebrow: "Converse",
    title: (
      <>
        When the team needs
        <br /> to talk it out
      </>
    ),
    body: "A short, time-boxed discussion when something needs to be talked through and surfaced. While you talk, the decisions you're actually making get pulled out into a list — so you leave with a list of calls to make, not a transcript.",
  },
  {
    eyebrow: "Collaborate",
    title: "When the team has ideas but can't agree on the actual answer",
    body: "Once everyone's thinking is on the table, you don't end up with twenty half-formed opinions or one watered-down compromise. You get two real options to choose between — each one shaped by whose thinking shaped it.",
  },
];

const featuresRight: Feature[] = [
  {
    eyebrow: "Reflect",
    title: "When you need every voice on the table",
    body: "Everyone writes their take privately against the same prompt. Nothing's visible until the timer's up, so the room sees what each person actually thinks — not what they say after hearing someone else.",
  },
  {
    eyebrow: "Decide",
    title: "When the call has to stick",
    body: "Vote openly, commit publicly. If two people aren't on board, it goes back for another round. If you're in the minority, you write down why — and that travels with the decision, so nobody re-litigates it in Slack on Thursday.",
  },
];

function FeatureCard({
  feature,
  selected,
  onSelect,
}: {
  feature: Feature;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex min-h-[440px] w-full flex-col items-start gap-11 p-8 text-left transition-colors lg:min-h-0 lg:flex-1 ${
        selected
          ? "rounded-[32px] bg-white"
          : "rounded-[32px] bg-transparent hover:bg-white/40"
      }`}
    >
      <p
        className="text-[14px] leading-[0.8] text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        {feature.eyebrow}
      </p>
      <h3 className="heading-display max-w-[320px] text-[36px] leading-[0.8] text-black lg:text-[44px]">
        {feature.title}
      </h3>
      <p className="max-w-[320px] text-[12px] leading-[1.25] tracking-[-0.12px] text-[color:var(--color-muted-ink)]">
        {feature.body}
      </p>
    </button>
  );
}

function Features() {
  const [selected, setSelected] = useState(0);
  return (
    <section className="relative z-10 px-6 pb-24 md:px-8 lg:px-12 xl:px-[80px] 2xl:px-[143px]">
      <div className="grid w-full max-w-[1400px] grid-cols-1 items-stretch gap-16 lg:grid-cols-[360px_minmax(0,1fr)_360px] lg:gap-24">
        <div className="flex flex-col gap-16 lg:gap-12">
          <FeatureCard
            feature={featuresLeft[0]}
            selected={selected === 0}
            onSelect={() => setSelected(0)}
          />
          <FeatureCard
            feature={featuresLeft[1]}
            selected={selected === 1}
            onSelect={() => setSelected(1)}
          />
        </div>

        <div className="relative aspect-[671/620] w-full overflow-hidden rounded-[32px] bg-[#b6c9f3]">
          <Image
            src="/landing/personal-space.png"
            alt="Together's Personal Space view, where each participant captures private notes"
            fill
            sizes="(min-width: 1024px) 621px, 100vw"
            className="origin-bottom scale-[2.2] object-contain object-bottom"
          />
        </div>

        <div className="flex flex-col gap-16 lg:gap-12">
          <FeatureCard
            feature={featuresRight[0]}
            selected={selected === 2}
            onSelect={() => setSelected(2)}
          />
          <FeatureCard
            feature={featuresRight[1]}
            selected={selected === 3}
            onSelect={() => setSelected(3)}
          />
        </div>
      </div>
    </section>
  );
}

function Promise() {
  return (
    <section className="relative z-10 px-6 pb-24 md:px-8 lg:px-12 xl:px-[80px] 2xl:px-[143px]">
      <div className="flex w-full max-w-[1730px] flex-col gap-16 rounded-[32px] bg-white p-8 md:p-16 lg:flex-row lg:items-start lg:gap-24 lg:p-16 xl:gap-48 xl:p-24 2xl:gap-[341px] 2xl:p-32">
        <p
          className="shrink-0 text-[20px] leading-[0.8] text-black"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          Our promise
        </p>

        <div className="flex w-full max-w-[994px] flex-col gap-12">
          <div
            className="flex flex-col gap-6 text-[20px] font-medium leading-[1.25] tracking-[-0.44px] text-[color:var(--color-muted-ink)] md:text-[26px] lg:text-[32px]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            <p>
              We started together with a frustration: strategic decisions inside
              teams don&apos;t actually get made in meetings. They get made in
              1:1s after the meeting, in DMs the day after, or — most often —
              they don&apos;t get made at all, and the team relitigates the same
              question three weeks later in a new meeting room.
            </p>
            <p>
              The cost of this isn&apos;t time. It&apos;s commitment. Decisions
              made this way are decisions nobody owns. They unravel the moment
              someone pushes back in Slack, and the team learns to stop bringing
              real disagreement to the table.
            </p>
            <p>
              We don&apos;t think the solution is better meetings. We think the
              solution is a different kind of meeting — one where the structure
              of the conversation forces the room to do what good facilitators
              have always done by hand: get private thinking on the table before
              group thinking distorts it, surface the real disagreement instead
              of papering over it, and refuse to lock a decision until every
              dissent has been heard.
            </p>
            <p>
              That&apos;s what Together is. A room where AI runs the
              methodology, the team does the thinking, and the call you make at
              the end is one the whole room actually committed to — not the
              loudest person&apos;s preference dressed up as consensus.
            </p>
            <p>
              Our mission is to make team strategic decisions sharper, faster,
              and honest. We think most teams have far better strategic
              instincts than their meetings let them express. Discourse is the
              room that lets them.
            </p>
          </div>

          <div className="h-px w-full max-w-[933px] bg-black/15" />

          <div className="flex flex-col gap-16 sm:flex-row sm:gap-32">
            <Founder name="Simon Carriere" role="Co-founder, Head of Growth" />
            {/* <Founder name="Anjila Sukuti" role="Co-founder, Head of Product" /> */}
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
      <p
        className="text-[20px] leading-[0.8] text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        {name}
      </p>
      <p
        className="text-[16px] leading-[0.8] text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        {role}
      </p>
    </div>
  );
}
