import { redirect } from "next/navigation";
import { getCurrentSession } from "@/src/supabase/get-session";
import { getDictionary } from "@/src/i18n/locale";
import { PLAN_LIMITS } from "@/src/entitlements/plans";
import { DISPLAY_PLANS } from "../../plans-display";
import { CheckoutButton } from "../../app/billing/billing-actions";
import { ContinueFreeButton } from "./continue-free-button";

export default async function OnboardingPlanPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in");
  }

  const { t } = await getDictionary();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{t.onboardingPlanPage.title}</h1>
        <p className="mt-4 text-muted">{t.onboardingPlanPage.subtitle}</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {DISPLAY_PLANS.map((plan) => {
          const limits = PLAN_LIMITS[plan.id];
          return (
            <div
              key={plan.id}
              className={`card-hover relative flex flex-col rounded-card border p-8 ${
                plan.highlight ? "border-primary bg-surface-elevated" : "border-border bg-surface"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {t.pricing.popular}
                </span>
              )}
              <p className="text-sm uppercase tracking-wide text-muted">{plan.id}</p>
              <p className="mt-1 text-sm text-muted">{t.pricing.taglines[plan.id]}</p>
              <p className="mt-6 font-display text-4xl font-bold">
                ${plan.price}
                <span className="text-base font-normal text-muted"> {t.pricing.perMonth}</span>
              </p>
              <ul className="mt-8 flex-1 space-y-3 text-sm text-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {limits.creditsPerPeriod} {t.pricing.videosPerMonth}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {limits.maxBrands === null ? t.pricing.unlimitedBrands : `${limits.maxBrands} ${t.pricing.brand}`}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {limits.watermark ? t.pricing.withWatermark : t.pricing.noWatermark}
                </li>
              </ul>
              <div className="mt-8">
                <CheckoutButton
                  plan={plan.id}
                  billingPeriod="monthly"
                  label={`${t.pricing.choose} ${plan.id}`}
                  errorLabel={t.billingPage.checkoutError}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <ContinueFreeButton label={t.onboardingPlanPage.continueFree} />
      </div>
    </main>
  );
}
