import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands, concepts, renders } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { FormatSchema } from "@/src/domain/format";
import { reserveRenderCredit } from "@/src/entitlements/reserve-credit";

// Restricted to the templates that actually have a directory under
// src/templates/ — narrower than the full TemplateIdSchema enum (which
// still reserves ids for templates not built yet), so a manipulated
// request can't ask the worker to render something that doesn't exist.
const BuildableTemplateIdSchema = z.enum(["kinetic-type", "product-reveal", "review-slam"]);

const CreateRenderSchema = z.object({
  conceptId: z.string().uuid(),
  format: FormatSchema,
  // Optional override from the template-picker step in the generator UI —
  // defaults to the concept's own (LLM-recommended) template when omitted.
  templateId: BuildableTemplateIdSchema.optional(),
});

// The worker renders at most MAX_CONCURRENT_RENDERS (2) at a time (see
// worker.ts) on a 2GB host — an unbounded backlog just means a very long,
// silent wait rather than a crash, but it's still a bad experience with no
// feedback. Reject new renders past this backlog size instead of piling
// them up indefinitely; ~15 queued/rendering rows is a few minutes' worth
// of draining at the current concurrency, a reasonable point to ask
// someone to retry rather than wait blind.
const MAX_PENDING_RENDERS = 15;

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

  const templateId = body.data.templateId ?? concept.templateId;
  if (templateId === "product-reveal" && concept.productImageIndex === null) {
    return NextResponse.json({ error: "product-reveal requires a product" }, { status: 400 });
  }

  const pendingCountRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(renders)
    .where(inArray(renders.status, ["queued", "rendering"]));

  if ((pendingCountRows[0]?.count ?? 0) >= MAX_PENDING_RENDERS) {
    return NextResponse.json({ error: "queue_full" }, { status: 503 });
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
      templateId,
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
