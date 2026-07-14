import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { getUserPlan } from "@/src/entitlements/get-user-plan";
import { PLAN_LIMITS } from "@/src/entitlements/plans";
import { BrandKitSchema, blankBrandKit } from "@/src/domain/brand-kit";
import { applyBrandKitOverrides } from "@/src/domain/apply-brand-overrides";

const SaveBrandSchema = z.object({
  name: z.string().trim().min(1).optional(),
  tagline: z.string().optional(),
  services: z.array(z.string()).optional(),
  logoUrl: z.union([z.string().url(), z.literal("")]).optional(),
});

// Turns an extraction (run by POST /api/brands, never counted against a
// plan) into a real, saved business (counted, shown in the Brands list).
// Also the manual-entry path: a failed extraction (brandKit === null) still
// has a sourceUrl to build a blank BrandKit from, so the review form's
// fallback ("extraction failed, fill it in by hand") has something to save.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = SaveBrandSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "invalid body", issues: body.error.issues }, { status: 400 });
  }

  const { id } = await context.params;
  const [brand] = await db.select().from(brands).where(eq(brands.id, id));

  if (!brand || brand.userId !== session.user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (brand.status !== "done" && brand.status !== "failed") {
    return NextResponse.json({ error: "extraction not finished yet" }, { status: 409 });
  }

  const plan = await getUserPlan(db, session.user.id);
  const maxBrands = PLAN_LIMITS[plan].maxBrands;

  if (!brand.saved && maxBrands !== null) {
    const savedRows = await db
      .select({ id: brands.id })
      .from(brands)
      .where(and(eq(brands.userId, session.user.id), eq(brands.saved, true)));

    if (savedRows.length >= maxBrands) {
      return NextResponse.json({ error: "brand_limit_reached", maxBrands }, { status: 409 });
    }
  }

  const baseBrandKit = brand.brandKit ? BrandKitSchema.parse(brand.brandKit) : blankBrandKit(brand.sourceUrl);
  const mergedBrandKit = applyBrandKitOverrides(baseBrandKit, {
    tagline: body.data.tagline,
    services: body.data.services,
    logoUrl: body.data.logoUrl,
  });

  const [updated] = await db
    .update(brands)
    .set({
      name: body.data.name ?? brand.name,
      brandKit: mergedBrandKit,
      saved: true,
    })
    .where(eq(brands.id, id))
    .returning();

  return NextResponse.json({ brand: updated });
}
