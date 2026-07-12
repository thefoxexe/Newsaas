import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { subscriptions, usage } from "../db/schema";
import type { Result } from "../domain/result";
import { ok, err } from "../domain/result";
import { canGenerate, type SubscriptionStatus } from "./can-generate";
import { resolvePeriod } from "./resolve-period";
import type { Plan } from "./plans";
import { QuotaError } from "./errors";

export type ReservedCredit = {
  usageId: string;
  creditsRemaining: number;
};

/**
 * Decrements at job *acceptance*, not completion (spec §8) — a render that
 * fails for an internal reason is refunded separately by refundRenderCredit.
 * The usage row is locked with SELECT ... FOR UPDATE so two concurrent
 * requests from the same user can't both read the same creditsUsed value
 * and both slip through.
 */
export async function reserveRenderCredit(
  db: Db,
  userId: string,
  now = new Date(),
): Promise<Result<ReservedCredit, QuotaError>> {
  return db.transaction(async (tx) => {
    const subscription = await tx.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    const plan: Plan = subscription?.plan ?? "free";
    const status: SubscriptionStatus = (subscription?.status as SubscriptionStatus | undefined) ?? "active";
    const period = resolvePeriod(
      subscription ? { periodStart: subscription.currentPeriodStart, periodEnd: subscription.currentPeriodEnd } : null,
      now,
    );

    await tx
      .insert(usage)
      .values({ userId, periodStart: period.periodStart, periodEnd: period.periodEnd, creditsUsed: 0 })
      .onConflictDoNothing({ target: [usage.userId, usage.periodStart, usage.periodEnd] });

    const [row] = await tx
      .select()
      .from(usage)
      .where(and(eq(usage.userId, userId), eq(usage.periodStart, period.periodStart), eq(usage.periodEnd, period.periodEnd)))
      .for("update");

    if (row === undefined) {
      throw new Error("usage row was not created by the upsert above");
    }

    const allowed = canGenerate({ plan, subscriptionStatus: status, creditsUsedInPeriod: row.creditsUsed });
    if (!allowed.ok) {
      return err(allowed.error);
    }

    await tx.update(usage).set({ creditsUsed: sql`${usage.creditsUsed} + 1` }).where(eq(usage.id, row.id));

    return ok({ usageId: row.id, creditsRemaining: allowed.value.creditsRemaining - 1 });
  });
}

export async function refundRenderCredit(db: Db, usageId: string): Promise<void> {
  await db
    .update(usage)
    .set({ creditsUsed: sql`GREATEST(${usage.creditsUsed} - 1, 0)` })
    .where(eq(usage.id, usageId));
}
