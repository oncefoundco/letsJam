"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// Per-session Realtime Broadcast channel, used purely as a "something changed,
// refetch" notification layer — Postgres stays the source of truth (the votes
// GET always reads fresh; see lib/sessions.ts). We deliberately use Broadcast,
// NOT Postgres Changes: the data layer connects as the superuser via a direct
// pooler and the browser never reads the vote tables, so table subscriptions
// would need an RLS redesign we're avoiding.
//
// Channel name and event are scoped to the session id so separate rooms never
// cross-talk.
export const VOTES_UPDATED = "votes-updated";

export type VotesUpdated = { round: number };

// Subscribe to `session:{id}` on mount, unsubscribe on unmount, and return a
// `broadcast` helper to notify peers. `onUpdated` fires when a peer's write
// lands — react by calling the existing refresh(); we never read vote state off
// the channel itself. If Realtime never connects, broadcasts are no-ops and
// listeners simply fall back to the slow safety-net poll — nobody gets stuck.
export function useSessionChannel(
  sessionId: string,
  onUpdated: (payload: VotesUpdated) => void
) {
  // Hold the latest handler in a ref so we don't tear down and re-subscribe the
  // channel every time the caller's closure (isHost, round, …) changes.
  const handler = useRef(onUpdated);
  useEffect(() => {
    handler.current = onUpdated;
  });
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`session:${sessionId}`);
    channel
      .on("broadcast", { event: VOTES_UPDATED }, ({ payload }) => {
        handler.current(payload as VotesUpdated);
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Fire-and-forget notify to the room. Self-broadcasts are off by default, so
  // the writer won't hear its own event — it already refreshes after its POST.
  return useCallback((round: number) => {
    channelRef.current
      ?.send({ type: "broadcast", event: VOTES_UPDATED, payload: { round } })
      .catch(() => {});
  }, []);
}
