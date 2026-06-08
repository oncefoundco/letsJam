-- letsJam — jam description
-- ---------------------------------------------------------------------------
-- The /start form has always had a "Describe your Jam" field, but only the
-- one-line topic (jams.title) was persisted. The redesigned session sidebar
-- shows the host's description under "Our Challenge", so we keep it.
--
-- Additive and nullable: existing jams simply have a null description and the
-- sidebar renders without the line.

alter table jams add column if not exists description text;
