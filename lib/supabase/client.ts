import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Uses the publishable key, which is safe to ship
// to the client. Call this inside Client Components / event handlers.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
