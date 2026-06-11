-- letsJam — refine_context kind
-- ---------------------------------------------------------------------------
-- refine_context held two unrelated things in one unlabeled pile:
--   1. The top-3 ideas the round-1 dot vote NARROWED to (narrowToRound2 carries
--      them forward so diamond 2's reflection + synthesis build on them).
--   2. Genuine REFINE reasons (the A/B vote sent a round back).
-- The UI keyed "are we refining?" off mere row presence, so every diamond-2
-- reflection showed "Let's refine and go again", the synthesis prompt called
-- the narrowed ideas "what was missing", and the recap claimed "Why we refined"
-- for jams that never refined.
--
-- `kind` labels each row so the app can tell them apart. from_round can't serve
-- as the discriminator: persistSession rewrites every row stamped with the
-- current round on each background save.
--
-- Default 'refine' matches the historical meaning; pre-existing 'narrowed' rows
-- are mislabeled at worst for the 24h a jam lives (jams expire via expires_at).

alter table public.refine_context
  add column if not exists kind text not null default 'refine'
  check (kind in ('refine', 'narrowed'));
