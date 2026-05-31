import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth token on every matched request and writes the
// rotated cookies onto the response. Called from the root proxy.ts (Next 16's
// renamed Middleware). Must run getUser() before the response is generated so a
// completed token refresh is persisted.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // If Supabase isn't configured in this environment, don't take down every
  // route — just pass the request through without refreshing the auth cookie.
  // (Auth pages will surface the misconfiguration on their own.)
  if (!supabaseUrl || !supabaseKey) return response;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    await supabase.auth.getUser();
  } catch (err) {
    // Bad config (e.g. an invalid URL) must not 500 the whole site via proxy.
    console.error(
      "[proxy] skipped Supabase session refresh:",
      err instanceof Error ? err.message : err
    );
  }

  return response;
}
