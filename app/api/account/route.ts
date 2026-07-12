import { NextResponse } from "next/server";
import { getCurrentSession } from "@/src/supabase/get-session";
import { createAdminClient } from "@/src/supabase/admin";

// Deleting the auth.users row cascades to brands/renders/subscriptions/usage
// via the FK "on delete cascade" constraints in src/db/schema.ts. Does not
// yet purge rendered video files from object storage — there is no real
// object storage wired up yet (see src/storage/video-storage.ts).
export async function DELETE(): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(session.user.id);
  if (error) {
    return NextResponse.json({ error: "failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
