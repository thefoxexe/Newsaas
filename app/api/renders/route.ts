import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands, concepts, renders } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { FormatSchema } from "@/src/domain/format";
import { reserveRenderCredit } from "@/src/entitlements/reserve-credit";

// Restricted to the templates that actually have a directory under
// src/templates/ — matches TemplateIdSchema today, but kept separate in
// case a template id is ever reserved before it's actually built again.
const BuildableTemplateIdSchema = z.enum(["dark-neon", "light-gradient", "color-blocks", "editorial", "split-duotone"]);

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

  // No per-template product requirement anymore: both templates' "feature"
  // scene gracefully falls back to a text-only beat when the concept has
  // no product tie-in, so either template works regardless of the
  // concept's data (see generate-concepts.ts).
  const templateId = body.data.templateId ?? concept.templateId;

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
