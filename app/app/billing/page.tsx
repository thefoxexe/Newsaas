import { PLAN_LIMITS, type Plan } from "@/src/entitlements/plans";
import { getCurrentSession } from "@/src/supabase/get-session";
import { getDictionary } from "@/src/i18n/locale";
import { db } from "@/src/db/client";
import { subscriptions, usage } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { resolvePeriod } from "@/src/entitlements/resolve-period";
import { CheckoutButton, ManageSubscriptionButton } from "./billing-actions";

const PAID_PLANS = ["starter", "growth", "scale"] as const satisfies readonly Plan[];

export default async function BillingPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  const { locale, t } = await getDictionary();

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
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t.billingPage.title}</h1>

      {plan === "free" && (
        <div className="reveal mt-6 rounded-card border border-primary/40 bg-primary/10 p-6">
          <p className="font-display text-lg font-bold">{t.billingPage.freeBannerTitle}</p>
          <p className="mt-1 text-sm text-muted">{t.billingPage.freeBannerBody}</p>
        </div>
      )}

      <div className="mt-6 rounded-card border border-border bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.billingPage.currentPlan}</p>
        <p className="mt-1 font-display text-2xl font-extrabold capitalize">{plan}</p>
        <p className="mt-2 text-foreground">
          {creditsUsed} / {limits.creditsPerPeriod} {t.billingPage.creditsUsed}
        </p>
        <p className="text-sm text-muted">
          {t.billingPage.renewsOn} {new Date(period.periodEnd).toLocaleDateString(locale)}
        </p>
        {subscription && (
          <div className="mt-4">
            <ManageSubscriptionButton label={t.billingPage.managePlan} errorLabel={t.billingPage.manageError} />
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PAID_PLANS.map((p) => (
          <div key={p} className="card-hover rounded-card border border-border bg-surface p-5">
            <p className="font-display font-semibold capitalize">{p}</p>
            <p className="mt-1 text-sm text-muted">
              {PLAN_LIMITS[p].creditsPerPeriod} {t.billingPage.videosPerMonth}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <CheckoutButton plan={p} billingPeriod="monthly" label={t.billingPage.monthly} errorLabel={t.billingPage.checkoutError} />
              <CheckoutButton plan={p} billingPeriod="annual" label={t.billingPage.annual} errorLabel={t.billingPage.checkoutError} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
