import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { deriveBrandName } from "@/src/domain/brand-name";
import { getUserPlan } from "@/src/entitlements/get-user-plan";
import { PLAN_LIMITS } from "@/src/entitlements/plans";

const CreateBrandSchema = z.object({
  url: z.string().url(),
});

// Anonymous submissions are allowed on purpose: the free DA analysis works
// without an account (spec §8/§10) and is claimed after sign-up. The
// maxBrands limit only applies once a brand is attached to an account —
// there's exactly one anonymous row per hero visit anyway, and it becomes
// the user's first business once claimed.
export async function POST(request: Request): Promise<Response> {
  const body = CreateBrandSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid body", issues: body.error.issues }, { status: 400 });
  }

  const session = await getCurrentSession();

  if (session) {
    const plan = await getUserPlan(db, session.user.id);
    const maxBrands = PLAN_LIMITS[plan].maxBrands;

    if (maxBrands !== null) {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(brands)
        .where(eq(brands.userId, session.user.id));

      if ((row?.count ?? 0) >= maxBrands) {
        return NextResponse.json({ error: "brand_limit_reached", maxBrands }, { status: 409 });
      }
    }
  }

  const [brand] = await db
    .insert(brands)
    .values({
      userId: session?.user.id ?? null,
      name: deriveBrandName(body.data.url),
      sourceUrl: body.data.url,
      status: "pending",
    })
    .returning({ id: brands.id });

  if (!brand) {
    return NextResponse.json({ error: "failed to create brand" }, { status: 500 });
  }

  return NextResponse.json({ id: brand.id }, { status: 201 });
}

export async function GET(): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db.select().from(brands).where(eq(brands.userId, session.user.id));
  return NextResponse.json({ brands: rows });
}
