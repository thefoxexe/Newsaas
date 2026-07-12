import type { Plan } from "../entitlements/plans";

export type BillingPeriod = "monthly" | "annual";

export type PriceLookup = {
  plan: Exclude<Plan, "free">;
  billingPeriod: BillingPeriod;
  lookupKey: string;
};

// Mirrors the real Prices created in Stripe (see docs/SPEC_REVIEW.md for the
// account note) — lookup_key is the stable link between Stripe and our plans.
export const PRICE_LOOKUPS: readonly PriceLookup[] = [
  { plan: "starter", billingPeriod: "monthly", lookupKey: "reeljolt_starter_monthly" },
  { plan: "starter", billingPeriod: "annual", lookupKey: "reeljolt_starter_annual" },
  { plan: "growth", billingPeriod: "monthly", lookupKey: "reeljolt_growth_monthly" },
  { plan: "growth", billingPeriod: "annual", lookupKey: "reeljolt_growth_annual" },
  { plan: "scale", billingPeriod: "monthly", lookupKey: "reeljolt_scale_monthly" },
  { plan: "scale", billingPeriod: "annual", lookupKey: "reeljolt_scale_annual" },
];

export function planForLookupKey(lookupKey: string): Plan | null {
  return PRICE_LOOKUPS.find((entry) => entry.lookupKey === lookupKey)?.plan ?? null;
}

export function lookupKeyFor(plan: Exclude<Plan, "free">, billingPeriod: BillingPeriod): string {
  const entry = PRICE_LOOKUPS.find((e) => e.plan === plan && e.billingPeriod === billingPeriod);
  if (entry === undefined) {
    throw new Error(`no price lookup_key configured for plan "${plan}" (${billingPeriod})`);
  }
  return entry.lookupKey;
}
