import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseUrl, supabaseAnonKey } from "@/src/supabase/env";

// Supabase's access token is short-lived; this proxy (formerly "middleware")
// refreshes it on every request so Server Components always see a valid
// session via src/supabase/server.ts, which itself can't write cookies on
// its own.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  // api/webhooks/ is deliberately excluded: Stripe (and any other webhook
  // sender) signs the exact raw request body, and middleware touching the
  // request before the route handler reads it is a well-documented way to
  // end up with a body that no longer matches the signature — exactly the
  // "No signatures found matching the expected signature for payload" error
  // Stripe returns when this happens. Webhook requests never carry a
  // Supabase session cookie to refresh anyway, so there's nothing this
  // middleware needs to do for them.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|demos/|api/webhooks/).*)"],
};
