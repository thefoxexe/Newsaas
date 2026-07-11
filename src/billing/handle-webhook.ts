import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { stripeEvents, subscriptions } from "../db/schema.js";
import type { Result } from "../domain/result.js";
import { ok, err } from "../domain/result.js";
import { parseWebhookEvent } from "./parse-webhook-event.js";
import { WebhookParseError, WebhookSignatureError } from "./errors.js";

export type WebhookOutcome = { skipped: true } | { skipped: false; kind: string };

/**
 * Stripe is the source of truth for the subscription (spec §8) — this is
 * the only place that ever writes to the subscriptions table, and it only
 * ever mirrors what Stripe reports. Idempotence: stripe_events.id is the
 * event id itself, inserted with ON CONFLICT DO NOTHING before any mutation,
 * so a replayed webhook (Stripe retries on timeout) short-circuits here
 * instead of reapplying the same update twice.
 */
export async function handleStripeWebhook(
  db: Db,
  stripeClient: Stripe,
  rawBody: string | Buffer,
  signature: string,
  webhookSecret: string,
): Promise<Result<WebhookOutcome, WebhookSignatureError | WebhookParseError>> {
  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (cause) {
    return err(new WebhookSignatureError(cause));
  }

  const inserted = await db
    .insert(stripeEvents)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing({ target: stripeEvents.id })
    .returning({ id: stripeEvents.id });

  if (inserted.length === 0) {
    return ok({ skipped: true });
  }

  const parsed = parseWebhookEvent(event);
  if (!parsed.ok) {
    return parsed;
  }

  if (parsed.value.kind === "subscription-upsert") {
    const { userId, stripeCustomerId, stripeSubscriptionId, plan, status, currentPeriodStart, currentPeriodEnd } =
      parsed.value;

    await db
      .insert(subscriptions)
      .values({
        userId,
        stripeCustomerId,
        stripeSubscriptionId,
        plan,
        status,
        currentPeriodStart,
        currentPeriodEnd,
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: { stripeCustomerId, stripeSubscriptionId, plan, status, currentPeriodStart, currentPeriodEnd },
      });
  } else if (parsed.value.kind === "subscription-cancel") {
    await db
      .update(subscriptions)
      .set({ status: "canceled" })
      .where(eq(subscriptions.stripeSubscriptionId, parsed.value.stripeSubscriptionId));
  }

  return ok({ skipped: false, kind: parsed.value.kind });
}
