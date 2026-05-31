import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth (PKCE) redirect target. Supabase sends the user back here with a `code`
// we exchange for a session, which sets the auth cookies. Then we bounce to
// `next` (the page that kicked off sign-in).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/start";

  // The provider (or Supabase) can redirect back with an error instead of a code.
  const providerError = searchParams.get("error");
  const providerErrorDesc = searchParams.get("error_description");
  if (providerError) {
    console.error("[auth/callback] provider error:", providerError, providerErrorDesc);
    return NextResponse.redirect(`${origin}/start?auth_error=1`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error(
      "[auth/callback] exchangeCodeForSession failed:",
      JSON.stringify({ message: error.message, status: error.status, code: error.code })
    );
    return NextResponse.redirect(`${origin}/start?auth_error=1`);
  }

  console.error("[auth/callback] no code and no error param in callback URL:", request.url);
  return NextResponse.redirect(`${origin}/start?auth_error=1`);
}
