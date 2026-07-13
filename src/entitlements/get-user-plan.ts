import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { planSelections, subscriptions } from "../db/schema";
import type { Plan } from "./plans";

export async function getUserPlan(db: Db, userId: string): Promise<Plan> {
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  return subscription?.plan ?? "free";
}

// True once a user has been through the mandatory onboarding plan picker —
// via either an explicit free-plan choice (plan_selections) or a real Stripe
// subscription (which never touches plan_selections at all, see
// handle-webhook.ts). Either one satisfies the gate.
export async function hasCompletedPlanSelection(db: Db, userId: string): Promise<boolean> {
  const [selection] = await db
    .select({ userId: planSelections.userId })
    .from(planSelections)
    .where(eq(planSelections.userId, userId));
  if (selection) return true;

  const [subscription] = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));
  return subscription !== undefined;
}
