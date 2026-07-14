import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { getUserPlan } from "@/src/entitlements/get-user-plan";
import { PLAN_LIMITS } from "@/src/entitlements/plans";
import { BrandKitSchema, blankBrandKit } from "@/src/domain/brand-kit";
import { applyBrandKitOverrides } from "@/src/domain/apply-brand-overrides";

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

const EditBrandSchema = z.object({
  name: z.string().trim().min(1).optional(),
  tagline: z.string().optional(),
  services: z.array(z.string()).optional(),
  logoUrl: z.union([z.string().url(), z.literal("")]).optional(),
});

// Editing/deleting an already-saved business is only available on plans
// that allow more than one business at all (growth/scale) — on a 1-business
// plan the single saved business is permanent, so people can't cycle
// through brands by deleting and re-adding.
async function canManageBrands(userId: string): Promise<boolean> {
  const plan = await getUserPlan(db, userId);
  return PLAN_LIMITS[plan].maxBrands !== 1;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const [brand] = await db.select().from(brands).where(eq(brands.id, id));

  if (!brand || brand.userId !== session.user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (!(await canManageBrands(session.user.id))) {
    return NextResponse.json({ error: "plan_locked" }, { status: 403 });
  }

  const body = EditBrandSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "invalid body", issues: body.error.issues }, { status: 400 });
  }

  const baseBrandKit = brand.brandKit ? BrandKitSchema.parse(brand.brandKit) : blankBrandKit(brand.sourceUrl);
  const mergedBrandKit = applyBrandKitOverrides(baseBrandKit, {
    tagline: body.data.tagline,
    services: body.data.services,
    logoUrl: body.data.logoUrl,
  });

  const [updated] = await db
    .update(brands)
    .set({ name: body.data.name ?? brand.name, brandKit: mergedBrandKit })
    .where(eq(brands.id, id))
    .returning();

  return NextResponse.json({ brand: updated });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const [brand] = await db.select().from(brands).where(eq(brands.id, id));

  if (!brand || brand.userId !== session.user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (!(await canManageBrands(session.user.id))) {
    return NextResponse.json({ error: "plan_locked" }, { status: 403 });
  }

  await db.delete(brands).where(eq(brands.id, id));

  return NextResponse.json({ ok: true });
}
