import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import Stripe from "stripe";

// Needs a real Postgres connection string, same as reserve-credit's
// integration test — see .env.example.
const databaseUrl = process.env["DATABASE_URL"];
const webhookSecret = "whsec_test_secret_for_local_verification_only";

describe.skipIf(!databaseUrl)("handleStripeWebhook (real Postgres, signed test event)", () => {
  it("upserts the subscriptions cache once, then skips the exact same event on replay", async () => {
    const { db } = await import("../src/db/client");
    const { users, subscriptions, stripeEvents } = await import("../src/db/schema");
    const { handleStripeWebhook } = await import("../src/billing/handle-webhook");

    const stripeClient = new Stripe("sk_test_placeholder_not_a_real_key");

    const [user] = await db.insert(users).values({ email: `webhook-test-${randomUUID()}@example.com` }).returning();
    if (!user) throw new Error("failed to create test user");

    const eventId = `evt_test_${randomUUID()}`;
    const payload = JSON.stringify({
      id: eventId,
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_test_123",
          customer: "cus_test_123",
          status: "active",
          current_period_start: 1_780_000_000,
          current_period_end: 1_782_600_000,
          metadata: { userId: user.id },
          items: { data: [{ price: { lookup_key: "reeljolt_starter_monthly" } }] },
        },
      },
    });

    const signature = stripeClient.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });

    try {
      const first = await handleStripeWebhook(db, stripeClient, payload, signature, webhookSecret);
      expect(first.ok).toBe(true);
      if (!first.ok) return;
      expect(first.value).toEqual({ skipped: false, kind: "subscription-upsert" });

      const [subRow] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id));
      expect(subRow?.plan).toBe("starter");
      expect(subRow?.stripeSubscriptionId).toBe("sub_test_123");

      const replay = await handleStripeWebhook(db, stripeClient, payload, signature, webhookSecret);
      expect(replay.ok).toBe(true);
      if (!replay.ok) return;
      expect(replay.value).toEqual({ skipped: true });
    } finally {
      await db.delete(stripeEvents).where(eq(stripeEvents.id, eventId));
      await db.delete(users).where(eq(users.id, user.id));
    }
  }, 30_000);

  it("rejects a payload whose signature doesn't match", async () => {
    const { db } = await import("../src/db/client");
    const { handleStripeWebhook } = await import("../src/billing/handle-webhook");

    const stripeClient = new Stripe("sk_test_placeholder_not_a_real_key");
    const result = await handleStripeWebhook(db, stripeClient, '{"id":"evt_bad"}', "t=1,v1=deadbeef", webhookSecret);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.name).toBe("WebhookSignatureError");
  });
});
