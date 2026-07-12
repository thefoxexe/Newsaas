import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands, concepts, renders } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { FormatSchema } from "@/src/domain/format";
import { reserveRenderCredit } from "@/src/entitlements/reserve-credit";

const CreateRenderSchema = z.object({
  conceptId: z.string().uuid(),
  format: FormatSchema,
});

export async function POST(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = CreateRenderSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid body", issues: body.error.issues }, { status: 400 });
  }

  const [concept] = await db.select().from(concepts).where(eq(concepts.id, body.data.conceptId));
  if (!concept) {
    return NextResponse.json({ error: "concept not found" }, { status: 404 });
  }

  const [brand] = await db.select().from(brands).where(eq(brands.id, concept.brandId));
  if (!brand || brand.userId !== session.user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const reservation = await reserveRenderCredit(db, session.user.id);
  if (!reservation.ok) {
    return NextResponse.json({ error: reservation.error.code, message: reservation.error.message }, { status: 402 });
  }

  const [render] = await db
    .insert(renders)
    .values({
      userId: session.user.id,
      brandId: brand.id,
      conceptId: concept.id,
      templateId: concept.templateId,
      format: body.data.format,
      status: "queued",
      usageId: reservation.value.usageId,
    })
    .returning({ id: renders.id });

  if (!render) {
    return NextResponse.json({ error: "failed to create render" }, { status: 500 });
  }

  return NextResponse.json({ id: render.id, creditsRemaining: reservation.value.creditsRemaining }, { status: 201 });
}

export async function GET(): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db.select().from(renders).where(eq(renders.userId, session.user.id));
  return NextResponse.json({ renders: rows });
}
