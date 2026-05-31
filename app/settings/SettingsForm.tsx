"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TIME_OPTIONS = [
  "5 minutes",
  "10 minutes",
  "15 minutes",
  "20 minutes",
  "25 minutes",
  "30 minutes",
];

type Member = { name: string; email: string };

export function SettingsForm({
  name: initialName,
  email,
  provider,
  defaultTime: initialDefaultTime,
}: {
  name: string;
  email: string;
  provider: string;
  defaultTime: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [defaultTime, setDefaultTime] = useState(initialDefaultTime);
  // No team backend yet — kept as a local list so the section is usable, but it
  // does not persist. Wire to a real teams store when one exists.
  const [team, setTeam] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { display_name: name.trim(), default_video_time: defaultTime },
      });
      if (error) throw error;
      router.push("/start");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your settings");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 justify-center px-6 pb-16 pt-4 md:px-12 lg:px-16 lg:pt-8">
      <section className="flex h-fit w-full max-w-[893px] flex-col gap-12 rounded-3xl bg-white p-6 md:p-8 lg:p-12">
        <div className="flex flex-col gap-6">
          <h1
            className="text-[40px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
            style={{ fontFamily: "var(--font-queens)" }}
          >
            Your Settings
          </h1>

          <div className="flex flex-col gap-11">
            <Profile
              name={name}
              onName={setName}
              email={email}
              provider={provider}
            />
            <Team team={team} onChange={setTeam} />
            <DefaultTime selected={defaultTime} onSelect={setDefaultTime} />
            <Billing />
          </div>
        </div>

        {error ? (
          <p className="text-[13px] text-red-600" style={FONT}>
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex w-full items-center justify-center rounded-2xl bg-[#1a1a1a] p-4 text-[14px] font-medium leading-none text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </section>
    </div>
  );
}

const FONT = { fontFamily: "var(--font-public-sans)" } as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] font-bold leading-none text-black" style={FONT}>
      {children}
    </p>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[14px] leading-none text-black" style={FONT}>
      {children}
    </span>
  );
}

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-3 rounded-full bg-[#f5f5f5] p-3 text-[14px] leading-none text-black ${
        className ?? ""
      }`}
      style={FONT}
    >
      {children}
    </span>
  );
}

function Profile({
  name,
  onName,
  email,
  provider,
}: {
  name: string;
  onName: (value: string) => void;
  email: string;
  provider: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Your Profile</SectionLabel>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <RowLabel>Your name</RowLabel>
          <input
            value={name}
            onChange={(e) => onName(e.target.value)}
            maxLength={60}
            placeholder="Your name"
            className="rounded-full bg-[#f5f5f5] p-3 text-[14px] leading-none text-black outline-none placeholder:text-black/40 focus:ring-2 focus:ring-[#3c5bcb]/40"
            style={FONT}
          />
        </div>
        <div className="flex items-center gap-3">
          <RowLabel>Your email</RowLabel>
          <Pill>{email || "—"}</Pill>
        </div>
        <div className="flex items-center gap-3">
          <RowLabel>Sign in method</RowLabel>
          {provider === "google" ? (
            <span className="grid h-[42px] w-[42px] place-items-center" aria-label="Google">
              <GoogleIcon />
            </span>
          ) : (
            <Pill className="capitalize">{provider}</Pill>
          )}
        </div>
      </div>
    </div>
  );
}

function Team({
  team,
  onChange,
}: {
  team: Member[];
  onChange: (team: Member[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    const email = draft.trim();
    if (email && !team.some((m) => m.email === email)) {
      const local = email.split("@")[0] ?? email;
      const name = local.charAt(0).toUpperCase() + local.slice(1);
      onChange([...team, { name, email }]);
    }
    setDraft("");
    setAdding(false);
  }

  function startAdding() {
    setAdding(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <SectionLabel>Your Team</SectionLabel>
        <button
          type="button"
          onClick={startAdding}
          className="rounded-full bg-[#f4f4f4] p-3 text-[14px] leading-none text-black transition-colors hover:bg-neutral-200"
          style={FONT}
        >
          Add Member
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {team.length === 0 && !adding ? (
          <p className="text-[14px] leading-none text-black/50" style={FONT}>
            No team members yet.
          </p>
        ) : null}
        {team.map((member) => (
          <div key={member.email} className="flex items-center gap-3">
            <RowLabel>{member.name}</RowLabel>
            <Pill>
              {member.email}
              <button
                type="button"
                onClick={() =>
                  onChange(team.filter((m) => m.email !== member.email))
                }
                aria-label={`Remove ${member.email}`}
                className="grid h-[18px] w-[18px] place-items-center rounded-full text-black/60 transition-colors hover:bg-black/10 hover:text-black"
              >
                <RemoveIcon />
              </button>
            </Pill>
          </div>
        ))}
        {adding ? (
          <div className="flex items-center gap-3">
            <RowLabel>New member</RowLabel>
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
              className="rounded-full bg-[#f5f5f5] p-3 text-[14px] leading-none text-black outline-none placeholder:text-black/40 focus:ring-2 focus:ring-[#3c5bcb]/40"
              style={FONT}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DefaultTime({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Default Video Collaborate Time</SectionLabel>
      <div className="flex flex-wrap items-center gap-3">
        {TIME_OPTIONS.map((option) => {
          const active = option === selected;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              aria-pressed={active}
              className={`rounded-full p-3 text-[14px] leading-none transition-colors ${
                active
                  ? "bg-[#1a1a1a] text-white"
                  : "bg-[#f5f5f5] text-black hover:bg-neutral-200"
              }`}
              style={FONT}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Billing() {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Billing</SectionLabel>
      <p className="text-[14px] leading-none text-black" style={FONT}>
        Subscription Status: Pro ($100/month)
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-full bg-[#f5f5f5] p-3 text-[14px] leading-none text-black transition-colors hover:bg-neutral-200"
          style={FONT}
        >
          Past Invoices
        </button>
        <button
          type="button"
          className="rounded-full bg-[#f5f5f5] p-3 text-[14px] leading-none text-black transition-colors hover:bg-neutral-200"
          style={FONT}
        >
          Cancel Account
        </button>
      </div>
    </div>
  );
}

function RemoveIcon() {
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

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M23.04 12.26c0-.82-.07-1.6-.21-2.36H12v4.47h6.19a5.3 5.3 0 01-2.3 3.48v2.9h3.72c2.18-2 3.43-4.96 3.43-8.49z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.1 0 5.7-1.03 7.6-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.88 1.1-2.98 0-5.5-2.01-6.4-4.72H1.76v2.98A11.5 11.5 0 0012 24z"
        fill="#34A853"
      />
      <path
        d="M5.6 14.7a6.9 6.9 0 01-.36-2.2c0-.76.13-1.5.36-2.2V7.32H1.76A11.5 11.5 0 00.5 12.5c0 1.86.45 3.62 1.26 5.18l3.84-2.98z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.58c1.68 0 3.19.58 4.38 1.71l3.29-3.29C17.7 2.09 15.1 1 12 1A11.5 11.5 0 001.76 7.32l3.84 2.98C6.5 7.59 9.02 5.58 12 5.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
