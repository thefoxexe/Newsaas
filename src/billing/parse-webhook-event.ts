import { z } from "zod";
import type Stripe from "stripe";
import type { Result } from "../domain/result";
import { ok, err } from "../domain/result";
import { planForLookupKey } from "./plan-prices";
import type { Plan } from "../entitlements/plans";
import { WebhookParseError } from "./errors";

const SubscriptionItemSchema = z
  .object({
    price: z.object({ lookup_key: z.string().nullable().optional() }).passthrough(),
    current_period_start: z.number().optional(),
    current_period_end: z.number().optional(),
  })
  .passthrough();

// Stripe moved current_period_start/end from the subscription root to each
// subscription item in newer API versions — this schema accepts either
// shape instead of assuming one, since we can't pin down which applies here.
const SubscriptionObjectSchema = z
  .object({
    id: z.string(),
    customer: z.string(),
    status: z.string(),
    current_period_start: z.number().optional(),
    current_period_end: z.number().optional(),
    metadata: z.record(z.string()).optional(),
    items: z.object({ data: z.array(SubscriptionItemSchema).min(1) }),
  })
  .passthrough();

export type SubscriptionUpsert = {
  kind: "subscription-upsert";
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: Plan;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
};

export type SubscriptionCancel = {
  kind: "subscription-cancel";
  stripeSubscriptionId: string;
};

export type Acknowledged = {
  kind: "acknowledged";
  eventType: string;
};

export type ParsedWebhookEvent = SubscriptionUpsert | SubscriptionCancel | Acknowledged;

const MUTATING_EVENT_TYPES = new Set(["customer.subscription.created", "customer.subscription.updated"]);

export function parseWebhookEvent(event: Stripe.Event): Result<ParsedWebhookEvent, WebhookParseError> {
  if (event.type === "customer.subscription.deleted") {
    const parsed = SubscriptionObjectSchema.safeParse(event.data.object);
    if (!parsed.success) {
      return err(new WebhookParseError(parsed.error.message));
    }
    return ok({ kind: "subscription-cancel", stripeSubscriptionId: parsed.data.id });
  }

  if (MUTATING_EVENT_TYPES.has(event.type)) {
    return parseSubscriptionUpsert(event.data.object);
  }

  return ok({ kind: "acknowledged", eventType: event.type });
}

function parseSubscriptionUpsert(raw: unknown): Result<SubscriptionUpsert, WebhookParseError> {
  const parsed = SubscriptionObjectSchema.safeParse(raw);
  if (!parsed.success) {
    return err(new WebhookParseError(parsed.error.message));
  }
  const subscription = parsed.data;

  const userId = subscription.metadata?.["userId"];
  if (userId === undefined) {
    return err(new WebhookParseError(`subscription ${subscription.id} has no metadata.userId`));
  }

  const lookupKey = subscription.items.data[0]?.price.lookup_key;
  const plan = lookupKey ? planForLookupKey(lookupKey) : null;
  if (plan === null) {
    return err(new WebhookParseError(`subscription ${subscription.id} has no recognized price lookup_key`));
  }

  const period = resolvePeriodFields(subscription);
  if (period === null) {
    return err(new WebhookParseError(`subscription ${subscription.id} has no resolvable billing period`));
  }

  return ok({
    kind: "subscription-upsert",
    userId,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    plan,
    status: subscription.status,
    currentPeriodStart: new Date(period.start * 1000),
    currentPeriodEnd: new Date(period.end * 1000),
  });
}

function resolvePeriodFields(
  subscription: z.infer<typeof SubscriptionObjectSchema>,
): { start: number; end: number } | null {
  if (subscription.current_period_start !== undefined && subscription.current_period_end !== undefined) {
    return { start: subscription.current_period_start, end: subscription.current_period_end };
  }

  const item = subscription.items.data[0];
  if (item?.current_period_start !== undefined && item.current_period_end !== undefined) {
    return { start: item.current_period_start, end: item.current_period_end };
  }

  return null;
}
