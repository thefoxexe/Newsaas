import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { subscriptions, usage } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { PLAN_LIMITS, type Plan } from "@/src/entitlements/plans";
import { resolvePeriod } from "@/src/entitlements/resolve-period";

export async function GET(): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id));

  const plan: Plan = subscription?.plan ?? "free";
  const period = resolvePeriod(
    subscription ? { periodStart: subscription.currentPeriodStart, periodEnd: subscription.currentPeriodEnd } : null,
    new Date(),
  );

  const [usageRow] = await db
    .select()
    .from(usage)
    .where(
      and(eq(usage.userId, session.user.id), eq(usage.periodStart, period.periodStart), eq(usage.periodEnd, period.periodEnd)),
    );

  return NextResponse.json({
    plan,
    status: subscription?.status ?? "active",
    limits: PLAN_LIMITS[plan],
    creditsUsed: usageRow?.creditsUsed ?? 0,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
  });
}
