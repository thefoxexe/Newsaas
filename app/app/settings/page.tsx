import { PLAN_LIMITS, type Plan } from "@/src/entitlements/plans";
import { getCurrentSession } from "@/src/supabase/get-session";
import { getDictionary } from "@/src/i18n/locale";
import { db } from "@/src/db/client";
import { subscriptions, usage } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { resolvePeriod } from "@/src/entitlements/resolve-period";
import { SignOutButton, DeleteAccountButton } from "./account-actions";
import { ManageSubscriptionModal } from "./billing-actions";

export default async function SettingsPage() {
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
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t.settingsPage.title}</h1>

      <div className="mt-6 rounded-card border border-border bg-surface p-6">
        <p className="text-sm text-muted">{t.settingsPage.name}</p>
        <p className="font-semibold">{session.user.name}</p>
        <p className="mt-4 text-sm text-muted">{t.settingsPage.email}</p>
        <p className="font-semibold">{session.user.email}</p>
      </div>

      {plan === "free" && (
        <div className="reveal mt-6 rounded-card border border-primary/40 bg-primary/10 p-6">
          <p className="font-display text-lg font-bold">{t.settingsPage.freeBannerTitle}</p>
          <p className="mt-1 text-sm text-muted">{t.settingsPage.freeBannerBody}</p>
        </div>
      )}

      <div className="mt-6 rounded-card border border-border bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.settingsPage.currentPlan}</p>
        <p className="mt-1 font-display text-2xl font-extrabold capitalize">{plan}</p>
        <p className="mt-2 text-foreground">
          {creditsUsed} / {limits.creditsPerPeriod} {t.settingsPage.creditsUsed}
        </p>
        <p className="text-sm text-muted">
          {t.settingsPage.renewsOn} {new Date(period.periodEnd).toLocaleDateString(locale)}
        </p>

        <div className="mt-4">
          <ManageSubscriptionModal
            currentPlan={plan}
            hasSubscription={subscription !== undefined}
            creditsByPlan={{
              starter: PLAN_LIMITS.starter.creditsPerPeriod,
              growth: PLAN_LIMITS.growth.creditsPerPeriod,
              scale: PLAN_LIMITS.scale.creditsPerPeriod,
            }}
            labels={{
              trigger: t.settingsPage.manageSubscriptionLink,
              modalTitle: t.settingsPage.modalTitle,
              modalSubtitle: t.settingsPage.modalSubtitle,
              topPlanMessage: t.settingsPage.topPlanMessage,
              downgradeLink: t.settingsPage.downgradeLink,
              close: t.settingsPage.close,
              choose: t.pricing.choose,
              monthly: t.billingPage.monthly,
              annual: t.billingPage.annual,
              videosPerMonth: t.billingPage.videosPerMonth,
              checkoutError: t.billingPage.checkoutError,
              manageError: t.billingPage.manageError,
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <SignOutButton label={t.settingsPage.signOut} />
        <DeleteAccountButton
          labels={{
            deleteAccount: t.settingsPage.deleteAccount,
            deleteWarning: t.settingsPage.deleteWarning,
            confirmDelete: t.settingsPage.confirmDelete,
            cancel: t.settingsPage.cancel,
          }}
        />
      </div>
    </div>
  );
}
