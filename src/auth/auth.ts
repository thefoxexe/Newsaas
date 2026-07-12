import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "../db/client";
import * as schema from "../db/schema";

function socialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string }> = {};

  if (process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]) {
    providers["google"] = {
      clientId: process.env["GOOGLE_CLIENT_ID"],
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
    };
  }

  if (process.env["GITHUB_CLIENT_ID"] && process.env["GITHUB_CLIENT_SECRET"]) {
    providers["github"] = {
      clientId: process.env["GITHUB_CLIENT_ID"],
      clientSecret: process.env["GITHUB_CLIENT_SECRET"],
    };
  }

  return providers;
}

// Social providers only activate once their client id/secret env vars are
// set (each requires registering an OAuth app with that provider) — email
// and password always works with no extra setup.
export const auth = betterAuth({
  baseURL: process.env["BETTER_AUTH_URL"],
  secret: process.env["BETTER_AUTH_SECRET"],
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: socialProviders(),
  plugins: [nextCookies()],
  // Our FK columns (brands.user_id, etc.) are Postgres `uuid`, not text —
  // Better Auth's default id generator produces nanoid-style strings that
  // don't fit that column type, so it's pinned to real UUIDs instead.
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
});
