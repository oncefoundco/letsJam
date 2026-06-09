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

type Member = { id: string; name: string; email: string };

export function SettingsForm({
  userId,
  name: initialName,
  email,
  provider,
  defaultTime: initialDefaultTime,
  initialTeam,
}: {
  userId: string;
  name: string;
  email: string;
  provider: string;
  defaultTime: string;
  initialTeam: Member[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [defaultTime, setDefaultTime] = useState(initialDefaultTime);
  // Team roster persists to public.team_members (RLS-scoped to this user via
  // owner_id = auth.uid()). We write on add/remove so it survives reload,
  // independently of the Save button (which only stores profile fields).
  const [team, setTeam] = useState<Member[]>(initialTeam);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Returns an error message on failure, or null on success.
  async function addMember(rawEmail: string): Promise<string | null> {
    const memberEmail = rawEmail.trim();
    if (!memberEmail) return null;
    if (team.some((m) => m.email === memberEmail)) {
      return "That email is already on your team.";
    }
    const local = memberEmail.split("@")[0] ?? memberEmail;
    const memberName = local.charAt(0).toUpperCase() + local.slice(1);
    const { data, error: insertError } = await createClient()
      .from("team_members")
      .insert({ owner_id: userId, name: memberName, email: memberEmail })
      .select("id, name, email")
      .single();
    if (insertError || !data) {
      return insertError?.message ?? "Could not add that member.";
    }
    setTeam((current) => [...current, data as Member]);
    return null;
  }

  async function removeMember(id: string) {
    const previous = team;
    setTeam((current) => current.filter((m) => m.id !== id)); // optimistic
    const { error: deleteError } = await createClient()
      .from("team_members")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setTeam(previous); // rollback
      setError("Could not remove that member.");
    }
  }

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
            <Team team={team} onAdd={addMember} onRemove={removeMember} />
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

// Inputs that shrink-to-fit their content (field-sizing) with a `size` fallback
// for browsers without it — so the pill hugs the text instead of leaving a wide
// trailing gap. Used for the name + new-member inputs.
const AUTO_INPUT = {
  fontFamily: "var(--font-public-sans)",
  fieldSizing: "content",
} as React.CSSProperties;

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
      className={`inline-flex items-center justify-center gap-3 rounded-full bg-[#f5f5f5] px-5 py-3 text-[14px] leading-none text-black ${
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
            size={Math.max(name.length, "Your name".length)}
            placeholder="Your name"
            className="min-w-0 rounded-full bg-[#f5f5f5] px-5 py-3 text-[14px] leading-none text-black outline-none placeholder:text-black/40 focus:ring-2 focus:ring-[#3c5bcb]/40"
            style={AUTO_INPUT}
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
  onAdd,
  onRemove,
}: {
  team: Member[];
  onAdd: (email: string) => Promise<string | null>;
  onRemove: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function commit() {
    if (busy) return;
    const email = draft.trim();
    if (!email) {
      setDraft("");
      setAdding(false);
      return;
    }
    setBusy(true);
    const err = await onAdd(email);
    setBusy(false);
    if (err) {
      setError(err);
      requestAnimationFrame(() => inputRef.current?.focus());
      return; // keep the input open so they can correct it
    }
    setError(null);
    setDraft("");
    setAdding(false);
  }

  function startAdding() {
    setError(null);
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
          disabled={busy}
          className="rounded-full bg-[#f4f4f4] px-5 py-3 text-[14px] leading-none text-black transition-colors hover:bg-neutral-200 disabled:opacity-60"
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
          <div key={member.id} className="flex items-center gap-3">
            <RowLabel>{member.name}</RowLabel>
            <Pill>
              {member.email}
              <button
                type="button"
                onClick={() => onRemove(member.id)}
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
              disabled={busy}
              size={Math.max(draft.length, "name@organization.com".length)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void commit();
                } else if (e.key === "Escape") {
                  setDraft("");
                  setError(null);
                  setAdding(false);
                }
              }}
              placeholder="name@organization.com"
              className="min-w-0 rounded-full bg-[#f5f5f5] px-5 py-3 text-[14px] leading-none text-black outline-none placeholder:text-black/40 focus:ring-2 focus:ring-[#3c5bcb]/40 disabled:opacity-60"
              style={AUTO_INPUT}
            />
          </div>
        ) : null}
        {error ? (
          <p className="text-[13px] leading-none text-red-600" style={FONT}>
            {error}
          </p>
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
        Subscription Status: Friend of oncefound
      </p>
      {/* Past Invoices + Cancel Account buttons are hidden for now. */}
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
