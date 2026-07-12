import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

function requireServiceRoleKey(): string {
  const value = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!value) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return value;
}

// Service-role client — bypasses RLS and can manage any user. Only ever
// used server-side (e.g. account deletion via supabase.auth.admin.*),
// never sent to the browser.
export function createAdminClient() {
  return createSupabaseClient(supabaseUrl(), requireServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
