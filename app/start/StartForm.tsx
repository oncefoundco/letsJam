"use client";

import Link from "next/link";
import { useState } from "react";
import { UploadContext } from "./UploadContext";

const PLACEHOLDER =
  "Why is our enterprise expansion stalling, and what should we do about it in Q1?";

export function StartForm() {
  const [challenge, setChallenge] = useState("");
  const topic = challenge.trim() || PLACEHOLDER;
  const onwardHref = `/waiting-room?topic=${encodeURIComponent(topic)}`;

  return (
    <>
      <div className="flex flex-col gap-6">
        <h1
          className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
          style={{ fontFamily: "var(--font-queens)" }}
        >
          Start a New Session
        </h1>

        <Field label="Define your challenge">
          <textarea
            value={challenge}
            onChange={(e) => setChallenge(e.target.value)}
            className="h-[156px] w-full resize-none rounded-2xl bg-[#f5f5f5] p-4 text-[15px] leading-[1.5] text-[#1a1a1a] outline-none placeholder:text-black/40 focus:ring-2 focus:ring-[#3c5bcb]/40"
            placeholder={PLACEHOLDER}
            style={{ fontFamily: "var(--font-public-sans)" }}
          />
        </Field>

        <Field label="Upload context">
          <UploadContext />
        </Field>

        <Field label="Start time">
          <div className="flex flex-wrap items-center gap-3">
            <TimePill label="Immediately" active />
            <TimePill label="Schedule" />
            <TimePill label="Draft" />
          </div>
        </Field>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <PrimaryLink href={onwardHref}>Draft Session</PrimaryLink>
        <PrimaryLink href={onwardHref}>Invite team</PrimaryLink>
      </div>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <label
        className="text-[14px] font-medium leading-none text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function TimePill({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-full p-3 text-[14px] leading-none transition-colors ${
        active
          ? "bg-[#1a1a1a] text-white"
          : "bg-[#f5f5f5] text-black hover:bg-neutral-200"
      }`}
      style={{ fontFamily: "var(--font-public-sans)" }}
    >
      {label}
    </button>
  );
}

function PrimaryLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 items-center justify-center rounded-2xl bg-[#1a1a1a] p-4 text-[14px] font-medium leading-none text-white transition-colors hover:bg-black"
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {children}
    </Link>
  );
}
