import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next 16 renamed Middleware to Proxy (same mechanism, new file convention).
// We use it only to keep the Supabase auth cookie fresh — not for gating, which
// happens in the page itself.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on everything except static assets and image optimization, so the auth
  // cookie refreshes on normal navigations without touching the asset pipeline.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|lottie)$).*)",
  ],
};
