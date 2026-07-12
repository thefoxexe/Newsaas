import type { Result } from "../domain/result";
import { ok, err } from "../domain/result";
import { PLAN_LIMITS, type Plan } from "./plans";
import { QuotaError } from "./errors";

export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

export type CanGenerateInput = {
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  creditsUsedInPeriod: number;
};

export type Allowed = {
  creditsRemaining: number;
};

/**
 * Pure quota check. Stripe is the source of truth for the subscription
 * (see docs/SPEC_REVIEW.md, §5) — the free plan never has a real Stripe
 * subscription behind it, so its status is always treated as "active" by
 * the caller when there is no subscription row at all.
 */
export function canGenerate(input: CanGenerateInput): Result<Allowed, QuotaError> {
  if (input.plan !== "free" && !isActiveStatus(input.subscriptionStatus)) {
    return err(
      new QuotaError(
        "subscription_inactive",
        `subscription status "${input.subscriptionStatus}" does not allow generation`,
      ),
    );
  }

  const limit = PLAN_LIMITS[input.plan].creditsPerPeriod;

  if (input.creditsUsedInPeriod >= limit) {
    return err(
      new QuotaError(
        "credits_exhausted",
        `${input.creditsUsedInPeriod}/${limit} credits already used this period`,
      ),
    );
  }

  return ok({ creditsRemaining: limit - input.creditsUsedInPeriod });
}

function isActiveStatus(status: SubscriptionStatus): boolean {
  return (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
}
