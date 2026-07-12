import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// postgres.js connects lazily on the first query, so this module can be
// imported safely even when DATABASE_URL isn't set yet — e.g. while Next.js
// collects route metadata at build time, before any request actually runs.
//
// prepare: false is required when DATABASE_URL points at Supabase's
// "Transaction" pooler (pgbouncer, port 6543) — the recommended connection
// string for serverless environments like Netlify Functions. Pgbouncer in
// transaction mode hands out a different backend connection per query, so
// postgres.js's default prepared statements (tied to one backend session)
// fail silently on every query. Harmless if DATABASE_URL is a direct
// connection instead.
const client = postgres(process.env["DATABASE_URL"] ?? "", { prepare: false });

export const db = drizzle(client, { schema });
export type Db = typeof db;
