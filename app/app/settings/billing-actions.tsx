"use client";

import { useState } from "react";
import { PLANS, type Plan as FullPlan } from "@/src/entitlements/plans";
import { DISPLAY_PLANS } from "../../plans-display";

type Plan = "starter" | "growth" | "scale";
type BillingPeriod = "monthly" | "annual";

export function CheckoutButton({
  plan,
  billingPeriod,
  label,
  errorLabel,
}: {
  plan: Plan;
  billingPeriod: BillingPeriod;
  label: string;
  errorLabel: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick(): Promise<void> {
    setLoading(true);
    setError(false);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billingPeriod }),
    });
    setLoading(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    const { url } = (await response.json()) as { url: string };
    window.location.href = url;
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
      >
        {loading ? "..." : label}
      </button>
      {error && <p className="mt-2 text-xs text-danger">{errorLabel}</p>}
    </div>
  );
}

export function ManageSubscriptionButton({
  label,
  errorLabel,
  variant = "button",
}: {
  label: string;
  errorLabel: string;
  variant?: "button" | "link";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick(): Promise<void> {
    setLoading(true);
    setError(false);
    const response = await fetch("/api/billing/portal", { method: "POST" });
    setLoading(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    const { url } = (await response.json()) as { url: string };
    window.location.href = url;
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={
          variant === "link"
            ? "text-xs text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
            : "rounded-pill border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-border-strong disabled:opacity-50"
        }
      >
        {loading ? "..." : label}
      </button>
      {error && <p className="mt-2 text-xs text-danger">{errorLabel}</p>}
    </div>
  );
}

type ManageSubscriptionModalLabels = {
  trigger: string;
  modalTitle: string;
  modalSubtitle: string;
  topPlanMessage: string;
  downgradeLink: string;
  close: string;
  choose: string;
  monthly: string;
  annual: string;
  videosPerMonth: string;
  checkoutError: string;
  manageError: string;
};

// Deliberately upgrade-only: candidate plans are only those strictly above
// the current one (per PLANS' declared order), never the current plan
// itself or anything below it. Downgrading to free isn't a Checkout flow at
// all — cancelling the Stripe subscription (via the portal) reverts the
// account to free at the end of the period, so it's a single small text
// link instead of a plan card.
export function ManageSubscriptionModal({
  currentPlan,
  hasSubscription,
  creditsByPlan,
  labels,
}: {
  currentPlan: FullPlan;
  hasSubscription: boolean;
  creditsByPlan: Record<Plan, number>;
  labels: ManageSubscriptionModalLabels;
}) {
  const [open, setOpen] = useState(false);
  const currentIndex = PLANS.indexOf(currentPlan);
  const upgradePlans = DISPLAY_PLANS.filter((p) => PLANS.indexOf(p.id) > currentIndex);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline"
      >
        {labels.trigger}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-card border border-border bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg font-bold">{labels.modalTitle}</p>
                <p className="mt-1 text-sm text-muted">{labels.modalSubtitle}</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label={labels.close} className="text-muted hover:text-foreground">
                ✕
              </button>
            </div>

            {upgradePlans.length === 0 ? (
              <p className="mt-6 text-sm text-muted">{labels.topPlanMessage}</p>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {upgradePlans.map((p) => (
                  <div key={p.id} className="rounded-card border border-border p-4">
                    <p className="font-display font-semibold capitalize">{p.id}</p>
                    <p className="mt-1 text-sm text-muted">
                      {creditsByPlan[p.id]} {labels.videosPerMonth}
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      <CheckoutButton
                        plan={p.id}
                        billingPeriod="monthly"
                        label={`${labels.choose} — ${labels.monthly}`}
                        errorLabel={labels.checkoutError}
                      />
                      <CheckoutButton
                        plan={p.id}
                        billingPeriod="annual"
                        label={`${labels.choose} — ${labels.annual}`}
                        errorLabel={labels.checkoutError}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasSubscription && (
              <div className="mt-6 text-center">
                <ManageSubscriptionButton label={labels.downgradeLink} errorLabel={labels.manageError} variant="link" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
