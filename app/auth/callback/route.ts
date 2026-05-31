import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth (PKCE) redirect target. Supabase sends the user back here with a `code`
// we exchange for a session, which sets the auth cookies. Then we bounce to
// `next` (the page that kicked off sign-in).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/start";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or the exchange failed — send them back to start with a flag the
  // login modal can surface.
  return NextResponse.redirect(`${origin}/start?auth_error=1`);
}
