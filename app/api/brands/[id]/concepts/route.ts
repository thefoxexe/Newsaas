import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands, concepts } from "@/src/db/schema";
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

  const brandKit = BrandKitSchema.parse(brand.brandKit);
  const manifest = getTemplateManifest("kinetic-type");

  const result = await generateConcepts(brandKit, new AnthropicLlmClient(), manifest.textConstraints);
  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 502 });
  }

  const inserted = await db
    .insert(concepts)
    .values(
      result.value.concepts.map((concept) => ({
        brandId: brand.id,
        angle: concept.angle,
        hook: concept.hook,
        body: concept.body,
        cta: concept.cta,
        templateId: concept.recommendedTemplate,
        productImageIndex: concept.productImageIndex,
      })),
    )
    .returning();

  return NextResponse.json({ analysis: result.value.analysis, concepts: inserted });
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
