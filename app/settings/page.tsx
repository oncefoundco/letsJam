import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/app/_components/Logo";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export const metadata = {
  title: "Your Settings — Jam",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Settings is only meaningful for a signed-in user — send guests to /start,
  // where the auth gate handles sign-in.
  if (!user) redirect("/start");

  const meta = user.user_metadata ?? {};
  const name =
    (meta.display_name as string) ||
    (meta.full_name as string) ||
    (meta.name as string) ||
    "";
  const email = user.email ?? "";
  const provider =
    (user.app_metadata?.provider as string) ||
    user.identities?.[0]?.provider ||
    "email";
  const defaultTime = (meta.default_video_time as string) || "10 minutes";

  // The user's saved team roster. RLS (team_members_all_owner) scopes this to
  // their own rows. Loaded server-side so the section renders populated with no
  // client-side flash.
  const { data: teamRows } = await supabase
    .from("team_members")
    .select("id, name, email")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });
  const initialTeam = (teamRows ?? []) as { id: string; name: string; email: string }[];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-6 md:px-12 lg:px-16">
        <Link href="/" className="inline-flex" aria-label="Jam home">
          <Logo />
        </Link>
        <Link
          href="/start"
          aria-label="Close settings"
          className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-neutral-100"
        >
          <CloseIcon />
        </Link>
      </header>
      <SettingsForm
        userId={user.id}
        name={name}
        email={email}
        provider={provider}
        defaultTime={defaultTime}
        initialTeam={initialTeam}
      />
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
