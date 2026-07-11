import { describe, expect, it } from "vitest";
import { canGenerate } from "../src/entitlements/can-generate.js";
import { PLAN_LIMITS, type Plan } from "../src/entitlements/plans.js";

describe("canGenerate", () => {
  for (const plan of ["free", "starter", "growth", "scale"] as Plan[]) {
    it(`allows generation for "${plan}" when under the credit limit`, () => {
      const result = canGenerate({ plan, subscriptionStatus: "active", creditsUsedInPeriod: 0 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.creditsRemaining).toBe(PLAN_LIMITS[plan].creditsPerPeriod);
    });

    it(`blocks generation for "${plan}" once the credit limit is reached`, () => {
      const limit = PLAN_LIMITS[plan].creditsPerPeriod;
      const result = canGenerate({ plan, subscriptionStatus: "active", creditsUsedInPeriod: limit });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("credits_exhausted");
    });

    it(`blocks generation for "${plan}" one credit past the limit too`, () => {
      const limit = PLAN_LIMITS[plan].creditsPerPeriod;
      const result = canGenerate({ plan, subscriptionStatus: "active", creditsUsedInPeriod: limit + 1 });
      expect(result.ok).toBe(false);
    });

    it(`allows the very last credit for "${plan}"`, () => {
      const limit = PLAN_LIMITS[plan].creditsPerPeriod;
      const result = canGenerate({ plan, subscriptionStatus: "active", creditsUsedInPeriod: limit - 1 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.creditsRemaining).toBe(1);
    });
  }

  it("allows the free plan regardless of subscriptionStatus (it never has a real Stripe subscription)", () => {
    const result = canGenerate({ plan: "free", subscriptionStatus: "canceled", creditsUsedInPeriod: 0 });
    expect(result.ok).toBe(true);
  });

  for (const status of ["past_due", "canceled", "incomplete", "incomplete_expired", "unpaid"] as const) {
    it(`blocks a paid plan whose subscription status is "${status}"`, () => {
      const result = canGenerate({ plan: "starter", subscriptionStatus: status, creditsUsedInPeriod: 0 });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("subscription_inactive");
    });
  }

  for (const status of ["active", "trialing"] as const) {
    it(`allows a paid plan whose subscription status is "${status}"`, () => {
      const result = canGenerate({ plan: "starter", subscriptionStatus: status, creditsUsedInPeriod: 0 });
      expect(result.ok).toBe(true);
    });
  }

  it("checks subscription status before credits, so an inactive subscription is reported even at zero usage", () => {
    const result = canGenerate({ plan: "growth", subscriptionStatus: "past_due", creditsUsedInPeriod: 0 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("subscription_inactive");
  });
});
