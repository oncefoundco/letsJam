"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Color swatches from the Figma profile design. Stored as the participant's
// avatar `bg`, so whatever's picked here is what shows next to their name.
export const PROFILE_COLORS = [
  "#62a1f1",
  "#ed6653",
  "#4db96e",
  "#f9d006",
  "#ff82f9",
  "#9d6fff",
] as const;

// ── Host gate ──────────────────────────────────────────────────────────────
// Drives /start: not signed in → Google login; signed in without a profile →
// name/color. The same LoginModal/ProfileModal are reused by the waiting-room
// JoinGate so the joiner experience is identical.
export function AuthGate({
  authed,
  needsProfile,
  initialName,
}: {
  authed: boolean;
  needsProfile: boolean;
  initialName?: string;
}) {
  const router = useRouter();
  if (!authed) return <LoginModal next="/start" />;
  if (needsProfile) {
    return (
      <ProfileModal
        initialName={initialName}
        onComplete={async ({ name, color }) => {
          const supabase = createClient();
          const { error } = await supabase.auth.updateUser({
            data: { display_name: name, color },
          });
          if (error) throw error;
          // Re-render the server component so it sees the completed profile and
          // dismisses the gate.
          router.refresh();
        }}
      />
    );
  }
  return null;
}

// ── Shared modal chrome ──────────────────────────────────────────────────────
function ModalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6">
      <div
        className="flex w-full max-w-[590px] flex-col gap-10 rounded-[24px] bg-white p-8 md:p-12"
        style={{ fontFamily: "var(--font-public-sans)" }}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

function ModalTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-center text-[34px] leading-none tracking-[-0.96px] text-[#1a1a1a] md:text-[48px]"
      style={{ fontFamily: "var(--font-queens)" }}
    >
      {children}
    </h2>
  );
}

// ── Login modal ──────────────────────────────────────────────────────────────
// `next` is where the OAuth callback returns the user after sign-in (e.g.
// "/start" for the host, "/waiting-room?session=ID" for a joiner).
export function LoginModal({ next = "/start" }: { next?: string }) {
  const params = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("auth_error") ? "Sign-in didn't complete. Please try again." : null
  );

  async function signInWithGoogle() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      // On success the browser is redirected to Google; nothing more to do here.
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start Google sign-in"
      );
      setSubmitting(false);
    }
  }

  return (
    <ModalShell>
      <ModalTitle>Hey there! Let&rsquo;s get you signed up for your first jam</ModalTitle>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-3 rounded-[12px] bg-[#f5f5f5] p-3 text-[14px] text-black transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleLogo />
          {submitting ? "Redirecting…" : "Sign up with Google"}
        </button>
        {error ? (
          <p className="text-center text-[13px] text-red-600">{error}</p>
        ) : null}
      </div>
    </ModalShell>
  );
}

// ── Profile modal ────────────────────────────────────────────────────────────
// Collects name + color and hands them to `onComplete`. The caller decides what
// to do with them (host: save to profile + refresh; joiner: save + join the
// session). Pre-fills from `initialName`/`initialColor`.
export function ProfileModal({
  initialName = "",
  initialColor,
  submitLabel = "Continue",
  onComplete,
}: {
  initialName?: string;
  initialColor?: string;
  submitLabel?: string;
  onComplete: (profile: { name: string; color: string }) => Promise<void> | void;
}) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<string>(initialColor ?? PROFILE_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onComplete({ name: trimmed, color });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <ModalShell>
      <ModalTitle>What should we call you?</ModalTitle>
      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <label htmlFor="profile-name" className="text-[14px] text-black">
            Your name
          </label>
          <input
            id="profile-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name..."
            maxLength={60}
            className="w-full rounded-[12px] bg-[#f5f5f5] px-3 py-5 text-[14px] text-black outline-none placeholder:text-black/40 focus:ring-2 focus:ring-[#3c5bcb]/40"
          />
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-[14px] text-black">Pick your preferred color</span>
          <div className="flex flex-wrap items-center gap-2">
            {PROFILE_COLORS.map((c) => {
              const selected = c === color;
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={`Choose color ${c}`}
                  aria-pressed={selected}
                  onClick={() => setColor(c)}
                  className={`size-10 rounded-full transition-transform ${
                    selected
                      ? "ring-2 ring-black/70 ring-offset-2 scale-105"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              );
            })}
          </div>
        </div>

        {error ? <p className="text-[13px] text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="flex w-full items-center justify-center rounded-[16px] bg-[#1a1a1a] p-4 text-[14px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </form>
    </ModalShell>
  );
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
