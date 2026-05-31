-- letsJam — initial relational schema
-- ---------------------------------------------------------------------------
-- Normalizes the data model that currently lives in Redis as one StoredSession
-- JSON blob (see lib/sessions.ts) plus the auth-only Supabase user_metadata.
--
-- Access model: the app's reads/writes go through server-side Next route
-- handlers, and anyone with a jam link can join as a guest (no auth required).
-- So RLS is enabled on every table (deny-by-default), and the *server* uses the
-- service-role key for privileged mutations (guest joins, AI writes, webhooks).
-- The authenticated-user policies below cover safe direct-from-browser reads
-- (e.g. a signed-in host listing their own jams).
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- updated_at helper -----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles (1:1 with auth.users) ----------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  email                 text,
  display_name          text,
  color                 text,                 -- avatar background hex, e.g. #9fd5f1
  default_jam_minutes   int  not null default 10,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up, seeding the fields
-- the app stores in user_metadata (display_name, color, full_name).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, color)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'color'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- team_members (a user's saved roster of people to invite; the Settings team) --
create table if not exists public.team_members (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  name        text not null,
  email       text not null,
  created_at  timestamptz not null default now(),
  unique (owner_id, email)
);
create index if not exists team_members_owner_idx on public.team_members (owner_id);

-- jams (the sessions) ---------------------------------------------------------
create type public.jam_status as enum
  ('draft', 'scheduled', 'waiting', 'active', 'completed', 'archived');

create table if not exists public.jams (
  id                    uuid primary key default gen_random_uuid(),
  created_by            uuid references public.profiles (id) on delete set null,
  title                 text not null,                 -- "Name your Jam"
  description           text,                          -- "Describe your Jam"
  status                public.jam_status not null default 'draft',
  scheduled_for         timestamptz,                   -- when "Schedule" is chosen
  duration_minutes      int not null default 10,
  whereby_room_url      text,
  whereby_host_room_url text,
  whereby_room_name     text unique,                   -- webhook reverse-lookup key
  started_at            timestamptz,                   -- host pressed Start
  current_round         int not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  expires_at            timestamptz                    -- 24h TTL parity with Whereby room
);
create index if not exists jams_created_by_idx on public.jams (created_by);
create index if not exists jams_status_idx on public.jams (status);
create trigger jams_set_updated_at before update on public.jams
  for each row execute function public.set_updated_at();

-- jam_invitees (the "Who will be joining?" emails) ----------------------------
create table if not exists public.jam_invitees (
  id          uuid primary key default gen_random_uuid(),
  jam_id      uuid not null references public.jams (id) on delete cascade,
  email       text not null,
  invited_at  timestamptz not null default now(),
  unique (jam_id, email)
);
create index if not exists jam_invitees_jam_idx on public.jam_invitees (jam_id);

-- jam_files (attached context; name now, Storage path later) ------------------
create table if not exists public.jam_files (
  id            uuid primary key default gen_random_uuid(),
  jam_id        uuid not null references public.jams (id) on delete cascade,
  name          text not null,
  storage_path  text,
  mime_type     text,
  created_at    timestamptz not null default now()
);
create index if not exists jam_files_jam_idx on public.jam_files (jam_id);

-- jam_participants (people actually in the room; user_id null = guest) --------
create table if not exists public.jam_participants (
  id          uuid primary key default gen_random_uuid(),
  jam_id      uuid not null references public.jams (id) on delete cascade,
  user_id     uuid references public.profiles (id) on delete set null,
  name        text not null,
  color       text not null,                 -- avatar bg
  is_host     boolean not null default false,
  joined_at   timestamptz not null default now()
);
create index if not exists jam_participants_jam_idx on public.jam_participants (jam_id);
-- A signed-in user appears at most once per jam (guests have null user_id).
create unique index if not exists jam_participants_jam_user_idx
  on public.jam_participants (jam_id, user_id) where user_id is not null;

-- reflections (one per participant per round) ---------------------------------
create table if not exists public.reflections (
  id              uuid primary key default gen_random_uuid(),
  jam_id          uuid not null references public.jams (id) on delete cascade,
  participant_id  uuid not null references public.jam_participants (id) on delete cascade,
  round           int  not null default 1,
  text            text not null default '',
  passed          boolean not null default false,
  submitted_at    timestamptz not null default now(),
  unique (jam_id, participant_id, round)
);
create index if not exists reflections_jam_round_idx on public.reflections (jam_id, round);

-- perspectives (AI A/B paths per round) ---------------------------------------
create table if not exists public.perspectives (
  id            uuid primary key default gen_random_uuid(),
  jam_id        uuid not null references public.jams (id) on delete cascade,
  round         int  not null default 1,
  slot          text not null check (slot in ('A', 'B')),
  label         text,
  title         text,
  body          text,
  attribution   text,
  created_at    timestamptz not null default now(),
  unique (jam_id, round, slot)
);

-- votes (one per participant per round) ---------------------------------------
create table if not exists public.votes (
  id              uuid primary key default gen_random_uuid(),
  jam_id          uuid not null references public.jams (id) on delete cascade,
  participant_id  uuid not null references public.jam_participants (id) on delete cascade,
  round           int  not null default 1,
  choice          text not null check (choice in ('A', 'B', 'refine')),
  reason          text,
  voted_at        timestamptz not null default now(),
  unique (jam_id, participant_id, round)
);
create index if not exists votes_jam_round_idx on public.votes (jam_id, round);

-- refine_context (refine reasons carried into the next round's synthesis) -----
create table if not exists public.refine_context (
  id              uuid primary key default gen_random_uuid(),
  jam_id          uuid not null references public.jams (id) on delete cascade,
  from_round      int not null,
  participant_id  uuid references public.jam_participants (id) on delete set null,
  reason          text not null,
  created_at      timestamptz not null default now()
);
create index if not exists refine_context_jam_idx on public.refine_context (jam_id);

-- outcomes (the decided result for a round) -----------------------------------
create table if not exists public.outcomes (
  id              uuid primary key default gen_random_uuid(),
  jam_id          uuid not null references public.jams (id) on delete cascade,
  round           int  not null,
  choice          text not null check (choice in ('A', 'B')),
  perspective_id  uuid references public.perspectives (id) on delete set null,
  decided_at      timestamptz not null default now(),
  unique (jam_id, round)
);

-- jam_summaries (AI room summary; round null = whole-jam summary) -------------
create table if not exists public.jam_summaries (
  id              uuid primary key default gen_random_uuid(),
  jam_id          uuid not null references public.jams (id) on delete cascade,
  round           int,
  decisions       text[] not null default '{}',
  open_questions  text[] not null default '{}',
  differences     text[] not null default '{}',
  created_at      timestamptz not null default now()
);
create index if not exists jam_summaries_jam_idx on public.jam_summaries (jam_id);

-- jam_transcripts (Whereby transcript fetched by the webhook) -----------------
create table if not exists public.jam_transcripts (
  id          uuid primary key default gen_random_uuid(),
  jam_id      uuid not null references public.jams (id) on delete cascade,
  content     text,
  fetched_at  timestamptz not null default now()
);
create index if not exists jam_transcripts_jam_idx on public.jam_transcripts (jam_id);

-- Row Level Security ----------------------------------------------------------
-- Enable RLS everywhere (deny-by-default). The server uses the service-role key
-- for guest joins / AI writes / webhooks, which bypasses these policies. The
-- policies below grant safe direct-from-browser access to authenticated users.
alter table public.profiles        enable row level security;
alter table public.team_members    enable row level security;
alter table public.jams            enable row level security;
alter table public.jam_invitees    enable row level security;
alter table public.jam_files       enable row level security;
alter table public.jam_participants enable row level security;
alter table public.reflections     enable row level security;
alter table public.perspectives    enable row level security;
alter table public.votes           enable row level security;
alter table public.refine_context  enable row level security;
alter table public.outcomes        enable row level security;
alter table public.jam_summaries   enable row level security;
alter table public.jam_transcripts enable row level security;

-- profiles: anyone signed in can read basic profiles (names/colors shown in
-- rooms); a user may insert/update only their own row.
create policy profiles_select_authenticated on public.profiles
  for select to authenticated using (true);
create policy profiles_insert_self on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- team_members: fully private to the owner.
create policy team_members_all_owner on public.team_members
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- jams: the creator has full access to their own jams.
create policy jams_all_creator on public.jams
  for all to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

-- Helper: is the current authenticated user the creator of a given jam?
create or replace function public.is_jam_creator(p_jam_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.jams j where j.id = p_jam_id and j.created_by = auth.uid()
  );
$$;

-- Child tables: the jam creator can read everything under their jam from the
-- browser. (Guest and AI writes go through the server's service role.)
create policy jam_invitees_creator on public.jam_invitees
  for all to authenticated using (public.is_jam_creator(jam_id)) with check (public.is_jam_creator(jam_id));
create policy jam_files_creator on public.jam_files
  for all to authenticated using (public.is_jam_creator(jam_id)) with check (public.is_jam_creator(jam_id));
create policy jam_participants_creator on public.jam_participants
  for select to authenticated using (public.is_jam_creator(jam_id));
create policy reflections_creator on public.reflections
  for select to authenticated using (public.is_jam_creator(jam_id));
create policy perspectives_creator on public.perspectives
  for select to authenticated using (public.is_jam_creator(jam_id));
create policy votes_creator on public.votes
  for select to authenticated using (public.is_jam_creator(jam_id));
create policy refine_context_creator on public.refine_context
  for select to authenticated using (public.is_jam_creator(jam_id));
create policy outcomes_creator on public.outcomes
  for select to authenticated using (public.is_jam_creator(jam_id));
create policy jam_summaries_creator on public.jam_summaries
  for select to authenticated using (public.is_jam_creator(jam_id));
create policy jam_transcripts_creator on public.jam_transcripts
  for select to authenticated using (public.is_jam_creator(jam_id));
