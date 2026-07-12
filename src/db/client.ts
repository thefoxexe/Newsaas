import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// postgres.js connects lazily on the first query, so this module can be
// imported safely even when DATABASE_URL isn't set yet — e.g. while Next.js
// collects route metadata at build time, before any request actually runs.
const client = postgres(process.env["DATABASE_URL"] ?? "");

export const db = drizzle(client, { schema });
export type Db = typeof db;
