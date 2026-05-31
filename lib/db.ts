import "server-only";
import postgres from "postgres";

// Server-only Postgres client for Supabase. Connects through the IPv4
// transaction pooler — the direct host (db.<ref>.supabase.co) is IPv6-only and
// unreachable from some networks. The `postgres` role bypasses RLS on its own
// tables, so server code (guest joins, AI writes, webhooks) needs no
// service-role key. Transaction-mode pooling requires prepare:false.
const password = process.env.SUPABASE_DATABASE_PASSWORD;
if (!password) {
  throw new Error("SUPABASE_DATABASE_PASSWORD is not set");
}

const config = {
  host: process.env.SUPABASE_DB_HOST ?? "aws-1-ap-southeast-2.pooler.supabase.com",
  port: Number(process.env.SUPABASE_DB_PORT ?? 6543),
  user: process.env.SUPABASE_DB_USER ?? "postgres.tkjjgogbhhtinncnwlpp",
  password,
  database: "postgres",
  ssl: "require" as const,
  prepare: false,
  idle_timeout: 20,
  max: 5,
};

// Reuse one pool across HMR reloads in dev so we don't exhaust connections.
const globalForDb = globalThis as unknown as {
  __sql?: ReturnType<typeof postgres>;
};

export const sql = globalForDb.__sql ?? postgres(config);

if (process.env.NODE_ENV !== "production") globalForDb.__sql = sql;
