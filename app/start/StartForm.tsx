"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { UploadContext } from "./UploadContext";

const PLACEHOLDER =
  "Why is our enterprise expansion stalling, and what should we do about it in Q1?";

type WhenOption = "Immediately" | "Schedule" | "Draft";
const WHEN_OPTIONS: WhenOption[] = ["Immediately", "Schedule", "Draft"];

export function StartForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [describe, setDescribe] = useState("");
  const [emails, setEmails] = useState<string[]>([
    "maya@organization.com",
    "theo@organization.com",
    "Priya@organization.com",
    "sam@organization.com",
  ]);
  const [when, setWhen] = useState<WhenOption>("Immediately");
  const [files, setFiles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSession({ invite }: { invite?: boolean } = {}) {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // The backend stores a single topic string; lead with the one-line
      // name and fall back to the description, then the placeholder.
      const topic = name.trim() || describe.trim() || PLACEHOLDER;
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, files }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      const { id, host } = (await res.json()) as {
        id: string;
        host?: { id: string; name: string; bg: string };
      };
      // Pre-stash the host's participant identity so the join gate doesn't prompt them.
      if (host) {
        try {
          localStorage.setItem(`participant.${id}`, JSON.stringify(host));
        } catch {
          // ignore (private browsing / storage full)
        }
      }
      const suffix = invite ? "&invite=1" : "";
      router.push(`/waiting-room?session=${id}${suffix}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <h1
          className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
          style={{ fontFamily: "var(--font-queens)" }}
        >
          Start a New Jam
        </h1>

        <div className="flex flex-col gap-6">
          <Field label="Name your Jam">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl bg-[#f5f5f5] p-[18px] text-[15px] leading-[1.5] text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/50 focus:ring-2 focus:ring-[#3c5bcb]/40"
              placeholder="In one sentence, what are you looking to achieve?"
              style={{ fontFamily: "var(--font-public-sans)" }}
            />
          </Field>

          <Field label="Describe your Jam">
            <textarea
              value={describe}
              onChange={(e) => setDescribe(e.target.value)}
              className="h-[254px] w-full resize-none rounded-2xl bg-[#f5f5f5] p-[18px] text-[15px] leading-[1.5] text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/50 focus:ring-2 focus:ring-[#3c5bcb]/40"
              placeholder={`Why does this matter now, and what would a good outcome look like?\n\ne.g. ${PLACEHOLDER}`}
              style={{ fontFamily: "var(--font-public-sans)" }}
            />
          </Field>

          <Field label="Who will be joining?">
            <EmailChips emails={emails} onChange={setEmails} />
          </Field>

          <Field label="When would you like to begin?">
            <div className="flex flex-wrap items-center gap-3">
              {WHEN_OPTIONS.map((option) => (
                <WhenPill
                  key={option}
                  label={option}
                  active={when === option}
                  onClick={() => setWhen(option)}
                />
              ))}
            </div>
          </Field>

          <Field label="Any additional files with context to this challenge?">
            <UploadContext files={files} onChange={setFiles} />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {error ? (
          <p
            className="text-[13px] text-red-600"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-4 sm:flex-row">
          <PrimaryAction onClick={() => startSession()} disabled={submitting}>
            {submitting ? "Creating room…" : "Draft Jam"}
          </PrimaryAction>
          <PrimaryAction
            onClick={() => startSession({ invite: true })}
            disabled={submitting}
          >
            {submitting ? "Creating room…" : "Invite team"}
          </PrimaryAction>
        </div>
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
    <div className="flex flex-col gap-3">
      <label
        className="text-[14px] font-semibold leading-none text-black"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function EmailChips({
  emails,
  onChange,
}: {
  emails: string[];
  onChange: (emails: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    const value = draft.trim();
    if (value && !emails.includes(value)) {
      onChange([...emails, value]);
    }
    setDraft("");
    setAdding(false);
  }

  function startAdding() {
    setAdding(true);
    // Focus once the input has mounted.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="flex flex-wrap content-center items-center gap-2">
      {emails.map((email) => (
        <span
          key={email}
          className="inline-flex items-center gap-3 rounded-2xl bg-[#ebeffa] p-[18px] text-[14px] leading-none text-[#3c5bcb]"
          style={{ fontFamily: "var(--font-public-sans)" }}
        >
          {email}
          <button
            type="button"
            onClick={() => onChange(emails.filter((e) => e !== email))}
            aria-label={`Remove ${email}`}
            className="grid h-[14px] w-[14px] place-items-center rounded-full text-[#3c5bcb] transition-colors hover:bg-[#3c5bcb]/15"
          >
            <XIcon />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          ref={inputRef}
          type="email"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          placeholder="name@organization.com"
          className="rounded-2xl bg-[#ebeffa] p-[18px] text-[14px] leading-none text-[#3c5bcb] outline-none placeholder:text-[#3c5bcb]/50 focus:ring-2 focus:ring-[#3c5bcb]/40"
          style={{ fontFamily: "var(--font-public-sans)" }}
        />
      ) : (
        <button
          type="button"
          onClick={startAdding}
          aria-label="Add someone"
          className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#f5f5f5] text-black transition-colors hover:bg-neutral-200"
        >
          <PlusIcon />
        </button>
      )}
    </div>
  );
}

function WhenPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center justify-center rounded-2xl p-[18px] text-[14px] leading-none transition-colors ${
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

function PrimaryAction({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-1 items-center justify-center rounded-2xl bg-[#1a1a1a] py-[18px] text-[14px] font-medium leading-none text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {children}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M1.5 1.5l7 7M8.5 1.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
