import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands, concepts, renders } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { BrandKitSchema } from "@/src/domain/brand-kit";
import { generateConcepts } from "@/src/generate/generate-concepts";
import { AnthropicLlmClient } from "@/src/generate/llm-client";
import { getTemplateManifest } from "@/src/render/template-registry";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const [brand] = await db.select().from(brands).where(eq(brands.id, id));

  if (!brand || brand.userId !== session.user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (brand.status !== "done" || brand.brandKit === null) {
    return NextResponse.json({ error: "brand extraction is not finished yet" }, { status: 409 });
  }

  // Calling this again ("regenerate") shouldn't just pile more concepts on
  // top forever, but it also must never destroy a concept the user already
  // has a real finished video from. Only concepts with zero "done" renders
  // (never rendered, or only ever failed/still in progress) get cleared —
  // this is also what unblocks a brand stuck on concepts from before a
  // template/schema change (an old concept's only render is a permanent
  // "failed" from a schema mismatch, so it's safe to clear on regenerate).
  const existing = await db.select({ id: concepts.id }).from(concepts).where(eq(concepts.brandId, brand.id));
  if (existing.length > 0) {
    const existingIds = existing.map((c) => c.id);
    const doneRenders = await db
      .select({ conceptId: renders.conceptId })
      .from(renders)
      .where(and(inArray(renders.conceptId, existingIds), eq(renders.status, "done")));
    const keepIds = new Set(doneRenders.map((r) => r.conceptId));
    const clearableIds = existingIds.filter((conceptId) => !keepIds.has(conceptId));
    if (clearableIds.length > 0) {
      await db.delete(concepts).where(inArray(concepts.id, clearableIds));
    }
  }

  const brandKit = BrandKitSchema.parse(brand.brandKit);
  const manifest = getTemplateManifest("dark-neon");

  const result = await generateConcepts(brandKit, new AnthropicLlmClient(), manifest.textConstraints);
  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 502 });
  }

  await db.insert(concepts).values(
    result.value.concepts.map((concept) => ({
      brandId: brand.id,
      angle: concept.angle,
      scenes: concept.scenes,
      templateId: concept.recommendedTemplate,
    })),
  );

  const allConcepts = await db.select().from(concepts).where(eq(concepts.brandId, brand.id));

  return NextResponse.json({ analysis: result.value.analysis, concepts: allConcepts });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const [brand] = await db.select().from(brands).where(eq(brands.id, id));
  if (!brand || brand.userId !== session.user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const rows = await db.select().from(concepts).where(eq(concepts.brandId, id));
  return NextResponse.json({ concepts: rows });
}
