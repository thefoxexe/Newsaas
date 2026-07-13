// Hardcoded fallbacks for these two specific values only. This is safe
// *because* they're already public by Next.js's own NEXT_PUBLIC_ convention
// — anything with that prefix ships inside the browser JS bundle no matter
// where its value comes from, so there's nothing to leak by also having it
// in source. Real secrets (STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY,
// DATABASE_URL, etc.) must never get this treatment — those stay
// env-var-only. This fallback exists because Netlify wasn't reliably
// inlining these at build time even after a cache-cleared redeploy; env
// vars, when present, still take priority.
const FALLBACK_SUPABASE_URL = "https://licyqmgwqsswyjjwnomr.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpY3lxbWd3cXNzd3lqandub21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3OTY0ODIsImV4cCI6MjA5OTM3MjQ4Mn0.Q2H-Ydv0KcALOkD-KINU8PDU8n2iVZTl5Lw5EC3kzCE";

export function supabaseUrl(): string {
  return process.env["NEXT_PUBLIC_SUPABASE_URL"] || FALLBACK_SUPABASE_URL;
}

export function supabaseAnonKey(): string {
  return process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] || FALLBACK_SUPABASE_ANON_KEY;
}
