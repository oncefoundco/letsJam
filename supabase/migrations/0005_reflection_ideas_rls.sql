-- letsJam — enable RLS on reflection_ideas
-- ---------------------------------------------------------------------------
-- Migration 0003 created public.reflection_ideas but forgot to enable row level
-- security or add a policy, leaving it the only public table exposed through
-- PostgREST with no RLS (Supabase Security Advisor flags this CRITICAL).
--
-- Mirror the sibling public.reflections table exactly: enable RLS and allow the
-- jam creator to SELECT their own jam's ideas. Server-side writes use the direct
-- postgres pooler connection, which bypasses RLS — same as every other table.
-- ---------------------------------------------------------------------------

alter table public.reflection_ideas enable row level security;

create policy reflection_ideas_creator on public.reflection_ideas
  for select to authenticated using (public.is_jam_creator(jam_id));
