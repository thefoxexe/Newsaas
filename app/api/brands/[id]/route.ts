import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands } from "@/src/db/schema";

// Deliberately not ownership-gated: brand ids are unguessable UUIDs, and
// anonymous visitors need to poll a brand they don't own yet (spec §8/§10 —
// the free DA analysis works before sign-up). Once claimed, the brand also
// shows up in the authenticated GET /api/brands list.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;

  const [brand] = await db.select().from(brands).where(eq(brands.id, id));
  if (!brand) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ brand });
}
