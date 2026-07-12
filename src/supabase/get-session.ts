import { createClient } from "./server";

export type CurrentSession = {
  user: { id: string; email: string; name: string };
};

// getUser() (not getSession()) is deliberate: it revalidates the JWT
// against Supabase's Auth server instead of trusting whatever is in the
// cookie, which a tampered/stale cookie could otherwise spoof.
export async function getCurrentSession(): Promise<CurrentSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  const metadata: unknown = data.user.user_metadata;
  const name =
    typeof metadata === "object" && metadata !== null && "name" in metadata && typeof metadata.name === "string"
      ? metadata.name
      : "";

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? "",
      name,
    },
  };
}
