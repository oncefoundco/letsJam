# letsJam — Database design (Supabase / Postgres)

This is the relational schema for everything letsJam stores. It normalizes the
data model that currently lives in **Redis** as one `StoredSession` JSON blob
(see `lib/sessions.ts`) plus the **auth-only** data in Supabase
`auth.users.user_metadata`.

Migration: [`migrations/0001_initial_schema.sql`](./migrations/0001_initial_schema.sql)

## Why

Today the whole session (participants, reflections, perspectives, votes,
outcomes, summary, files) is a single JSON value in Upstash Redis with a 24h
TTL, and identity lives in Supabase auth metadata. That makes querying,
history ("Previous Jams"), and integrity (one vote per person per round, etc.)
hard. This schema gives every concept a table with real keys and constraints.

## Tables

| Table | Purpose |
|-------|---------|
| `profiles` | 1:1 with `auth.users`. App profile: `display_name`, `color`, `default_jam_minutes`. Auto-created on signup by the `handle_new_user` trigger from `user_metadata`. |
| `team_members` | A user's saved roster (the Settings "team") — `name` + `email`, owned by a profile. |
| `jams` | A session. `title` (Name your Jam), `description`, `status` (`draft`→`archived`), `scheduled_for`, Whereby room fields, `started_at`, `current_round`, `expires_at`. `whereby_room_name` is unique (webhook reverse-lookup, replacing the Redis `room:*` index). |
| `jam_invitees` | The "Who will be joining?" emails for a jam. |
| `jam_files` | Attached context files (`name` now; `storage_path` later for Supabase Storage). |
| `jam_participants` | People actually in the room. `user_id` null = guest. `is_host`, `name`, `color`. |
| `reflections` | One per participant per round (`unique(jam_id, participant_id, round)`). |
| `perspectives` | AI-generated A/B paths per round (`unique(jam_id, round, slot)`). |
| `votes` | One per participant per round, `choice` ∈ {A,B,refine} (`unique(jam_id, participant_id, round)`). |
| `refine_context` | Two kinds of carried-forward context (`kind` column): `'narrowed'` = the top-3 ideas the round-1 dot vote chose; `'refine'` = genuine refine reasons. |
| `outcomes` | The decided result for a round → a `perspective` (`unique(jam_id, round)`). |
| `jam_summaries` | AI room summary (`decisions`, `open_questions`, `differences`). |
| `jam_transcripts` | Whereby transcript fetched by the webhook. |

## Mapping from the current `StoredSession`

| `StoredSession` field | New home |
|-----------------------|----------|
| `id`, `topic`, `files`, `roomUrl`, `hostRoomUrl`, `roomName`, `createdAt`, `startedAt`, `round` | `jams` (+ `jam_files` for `files`) |
| `participants[]` (`id,name,bg,joinedAt`) | `jam_participants` |
| `reflections[]` | `reflections` |
| `perspectives[]` | `perspectives` (slot A = index 0, B = index 1) |
| `votes[]` | `votes` |
| `narrowedIdeas[]` | `refine_context` (`kind = 'narrowed'`) |
| `refineContext[]` | `refine_context` (`kind = 'refine'`) |
| `outcome` | `outcomes` |
| `summary` | `jam_summaries` |
| `room:{roomName}` reverse index | `jams.whereby_room_name` (unique) |
| auth `user_metadata.display_name/color` | `profiles` |

## Access model & RLS

The app's reads/writes go through **server-side Next route handlers**, and
**anyone with a jam link can join as a guest** (no auth). So:

- **RLS is enabled on every table** (deny-by-default).
- The **server uses the service-role key** for privileged mutations — guest
  joins, AI writes, the Whereby webhook — which bypasses RLS. (Add
  `SUPABASE_SERVICE_ROLE_KEY` to env and a server-only admin client; the current
  `lib/supabase/*` clients use the publishable key and are RLS-bound.)
- The included policies grant **authenticated users** safe direct-from-browser
  reads: a signed-in host can read their own jams and all child rows (via the
  `is_jam_creator` helper); profiles are world-readable to authenticated users
  (names/colors shown in rooms); `team_members` are private to their owner.

## Applying

Pick one:

1. **Supabase MCP** — run `/mcp`, authorize "claude.ai Supabase", then the
   migration can be applied for you.
2. **SQL editor** — paste `migrations/0001_initial_schema.sql` into the Supabase
   dashboard SQL editor and run it.
3. **Connection string** — provide the project's pooler connection string
   (Dashboard → Connect) and it can be applied via `pg`.

## Not done yet (follow-on)

This delivers the schema. Re-pointing the app's data layer (`lib/sessions.ts`)
from Redis to these tables is a separate migration and is **not** included here —
the app still runs on Redis until that's done.
