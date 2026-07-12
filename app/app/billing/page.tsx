import { PLAN_LIMITS, type Plan } from "@/src/entitlements/plans";
import { getCurrentSession } from "@/src/auth/get-session";
import { db } from "@/src/db/client";
import { subscriptions, usage } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { resolvePeriod } from "@/src/entitlements/resolve-period";
import { CheckoutButton, ManageSubscriptionButton } from "./billing-actions";

const PAID_PLANS = ["starter", "growth", "scale"] as const satisfies readonly Plan[];

export default async function BillingPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, session.user.id));
  const plan: Plan = subscription?.plan ?? "free";
  const period = resolvePeriod(
    subscription ? { periodStart: subscription.currentPeriodStart, periodEnd: subscription.currentPeriodEnd } : null,
    new Date(),
  );
  const [usageRow] = await db
    .select()
    .from(usage)
    .where(and(eq(usage.userId, session.user.id), eq(usage.periodStart, period.periodStart), eq(usage.periodEnd, period.periodEnd)));

  const limits = PLAN_LIMITS[plan];
  const creditsUsed = usageRow?.creditsUsed ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold">Abonnement</h1>

      <div className="mt-6 rounded-card border border-border bg-surface p-6">
        <p className="text-sm uppercase tracking-wide text-muted">Plan actuel</p>
        <p className="mt-1 text-2xl font-extrabold">{plan}</p>
        <p className="mt-2 text-foreground">
          {creditsUsed} / {limits.creditsPerPeriod} crédits utilisés ce mois
        </p>
        <p className="text-sm text-muted">
          Renouvellement le {new Date(period.periodEnd).toLocaleDateString("fr-CH")}
        </p>
        {subscription && (
          <div className="mt-4">
            <ManageSubscriptionButton />
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PAID_PLANS.map((p) => (
          <div key={p} className="rounded-card border border-border bg-surface p-5">
            <p className="font-semibold capitalize">{p}</p>
            <p className="mt-1 text-sm text-muted">{PLAN_LIMITS[p].creditsPerPeriod} vidéos/mois</p>
            <div className="mt-4 flex flex-col gap-2">
              <CheckoutButton plan={p} billingPeriod="monthly" />
              <CheckoutButton plan={p} billingPeriod="annual" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
