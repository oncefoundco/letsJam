import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth (PKCE) redirect target. Supabase sends the user back here with a `code`
// we exchange for a session, which sets the auth cookies. Then we bounce to
// `next` (the page that kicked off sign-in — e.g. /start for the host or
// /waiting-room?session=ID for a joiner).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only allow relative same-origin paths to prevent an open redirect.
  const rawNext = searchParams.get("next") ?? "/start";
  const next = rawNext.startsWith("/") ? rawNext : "/start";

  // Send the user back to where they started, flagging the failure so the login
  // modal there can surface it.
  const fail = () => {
    const dest = new URL(next, origin);
    dest.searchParams.set("auth_error", "1");
    return NextResponse.redirect(dest);
  };

  // The provider (or Supabase) can redirect back with an error instead of a code.
  const providerError = searchParams.get("error");
  if (providerError) {
    console.error(
      "[auth/callback] provider error:",
      providerError,
      searchParams.get("error_description")
    );
    return fail();
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
    console.error(
      "[auth/callback] exchangeCodeForSession failed:",
      JSON.stringify({ message: error.message, status: error.status, code: error.code })
    );
    return fail();
  }

  console.error("[auth/callback] no code and no error param in callback URL:", request.url);
  return fail();
}
