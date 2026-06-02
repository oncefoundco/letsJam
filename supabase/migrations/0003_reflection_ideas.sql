-- letsJam — reflection ideas (3-takes-per-person)
-- ---------------------------------------------------------------------------
-- The reflection step changed from a single free-text take per person to up to
-- THREE ideas per person, each with a "refine" flag (the author thinks this idea
-- needs another round before it's worth voting on). Downstream, ideas that align
-- across people are clustered into buckets that become the dot-voting options.
--
-- The existing public.reflections row stays as the per-person submitted/passed
-- marker (so the gate + submitted/total counting in the status route keep
-- working unchanged, and synthesis keeps reading reflections.text — we still
-- write the joined idea text there for backward-compat). The individual ideas
-- hang off it here, one row per idea.
-- ---------------------------------------------------------------------------

create table if not exists public.reflection_ideas (
  id              uuid primary key default gen_random_uuid(),
  jam_id          uuid not null references public.jams (id) on delete cascade,
  participant_id  uuid not null references public.jam_participants (id) on delete cascade,
  round           int  not null default 1,
  idx             int  not null,                 -- 0..2, the slot on the form
  text            text not null default '',
  refine          boolean not null default false,
  submitted_at    timestamptz not null default now(),
  unique (jam_id, participant_id, round, idx)
);

create index if not exists reflection_ideas_jam_round_idx
  on public.reflection_ideas (jam_id, round);
