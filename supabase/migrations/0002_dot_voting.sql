-- letsJam — dot-voting tables
-- ---------------------------------------------------------------------------
-- Dot voting replaced the A/B vote (participant-proposed option cards + dots).
-- It was added after 0001 and lived Redis-only, so concurrent allocations could
-- clobber each other in the session blob. These tables make Postgres the source
-- of truth for it too, so the same atomic-write + cache-invalidate pattern used
-- for reflections/votes applies. Mirrors the StoredSession dot-voting fields in
-- lib/sessions.ts (options / dotVotes / decision) — see lib/voting.ts for types.
-- ---------------------------------------------------------------------------

-- AI-proposed option cards for a round.
create table if not exists public.jam_options (
  id            uuid primary key,            -- app-generated (crypto.randomUUID)
  jam_id        uuid not null references public.jams (id) on delete cascade,
  round         int  not null default 1,
  title         text,
  body          text,
  attribution   text,
  author_id     uuid,                        -- proposing participant; not FK'd (may be a guest)
  position      int  not null default 0,     -- preserves card order
  created_at    timestamptz not null default now()
);
create index if not exists jam_options_jam_round_idx on public.jam_options (jam_id, round);

-- One row per (participant, round, option) they put dots on. option_id is a
-- jam_options.id OR the 'refine' sentinel, so it's plain text (not an FK).
create table if not exists public.dot_allocations (
  id              uuid primary key default gen_random_uuid(),
  jam_id          uuid not null references public.jams (id) on delete cascade,
  participant_id  uuid not null references public.jam_participants (id) on delete cascade,
  round           int  not null default 1,
  option_id       text not null,
  dots            int  not null,
  created_at      timestamptz not null default now(),
  unique (jam_id, participant_id, round, option_id)
);
create index if not exists dot_allocations_jam_round_idx on public.dot_allocations (jam_id, round);

-- The winning option for a resolved round.
create table if not exists public.jam_decisions (
  id          uuid primary key default gen_random_uuid(),
  jam_id      uuid not null references public.jams (id) on delete cascade,
  round       int  not null,
  option_id   uuid not null references public.jam_options (id) on delete cascade,
  decided_at  timestamptz not null default now(),
  unique (jam_id, round)
);

-- RLS: deny-by-default; server uses the postgres role (bypasses RLS), the jam
-- creator can read their own from the browser. Matches 0001.
alter table public.jam_options     enable row level security;
alter table public.dot_allocations enable row level security;
alter table public.jam_decisions   enable row level security;

create policy jam_options_creator on public.jam_options
  for select to authenticated using (public.is_jam_creator(jam_id));
create policy dot_allocations_creator on public.dot_allocations
  for select to authenticated using (public.is_jam_creator(jam_id));
create policy jam_decisions_creator on public.jam_decisions
  for select to authenticated using (public.is_jam_creator(jam_id));

