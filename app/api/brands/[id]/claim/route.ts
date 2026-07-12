import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";

// Attaches an anonymous extraction to the account that just signed up.
// Guarded by `isNull(userId)` so a brand already claimed by someone else
// can't be taken over by guessing its id.
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const [claimed] = await db
    .update(brands)
    .set({ userId: session.user.id })
    .where(and(eq(brands.id, id), isNull(brands.userId)))
    .returning({ id: brands.id });

  if (!claimed) {
    return NextResponse.json({ error: "brand not found or already claimed" }, { status: 409 });
  }

  return NextResponse.json({ id: claimed.id });
}
