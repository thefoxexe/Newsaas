import { NextResponse } from "next/server";
import { createClient } from "@/src/supabase/server";

// Where Google/GitHub land the browser back after signInWithOAuth. Supabase
// appends a `code` we exchange for a real session cookie before continuing
// into the app.
export async function GET(request: Request): Promise<Response> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/app`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in`);
}
