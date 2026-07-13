import { NextResponse } from "next/server";
import { getCurrentSession } from "@/src/supabase/get-session";
import { db } from "@/src/db/client";
import { planSelections } from "@/src/db/schema";

export async function POST(): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await db
    .insert(planSelections)
    .values({ userId: session.user.id, plan: "free" })
    .onConflictDoNothing({ target: planSelections.userId });

  return NextResponse.json({ ok: true });
}
