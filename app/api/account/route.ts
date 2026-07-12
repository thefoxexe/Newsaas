import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { getCurrentSession } from "@/src/auth/get-session";

// Cascades to brands/renders/subscriptions/usage/sessions/accounts via the
// FK "on delete cascade" constraints in src/db/schema.ts. Does not yet purge
// rendered video files from object storage — there is no real object
// storage wired up yet (see src/storage/video-storage.ts).
export async function DELETE(): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await db.delete(users).where(eq(users.id, session.user.id));
  return NextResponse.json({ deleted: true });
}
