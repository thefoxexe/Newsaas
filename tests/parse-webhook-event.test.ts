import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { parseWebhookEvent } from "../src/billing/parse-webhook-event";

function fakeEvent(type: string, object: Record<string, unknown>): Stripe.Event {
  return { id: "evt_test", type, data: { object } } as unknown as Stripe.Event;
}

const baseSubscription = {
  id: "sub_123",
  customer: "cus_123",
  status: "active",
  current_period_start: 1_780_000_000,
  current_period_end: 1_782_600_000,
  metadata: { userId: "user-1" },
  items: { data: [{ price: { lookup_key: "reeljolt_starter_monthly" } }] },
};

describe("parseWebhookEvent", () => {
  it("maps customer.subscription.created to a subscription upsert", () => {
    const result = parseWebhookEvent(fakeEvent("customer.subscription.created", baseSubscription));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      kind: "subscription-upsert",
      userId: "user-1",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      plan: "starter",
      status: "active",
      currentPeriodStart: new Date(1_780_000_000 * 1000),
      currentPeriodEnd: new Date(1_782_600_000 * 1000),
    });
  });

  it("reads the billing period from the subscription item when it isn't on the root object", () => {
    const { current_period_start: _s, current_period_end: _e, ...withoutRootPeriod } = baseSubscription;
    void _s;
    void _e;
    const event = fakeEvent("customer.subscription.updated", {
      ...withoutRootPeriod,
      items: {
        data: [
          {
            price: { lookup_key: "reeljolt_growth_annual" },
            current_period_start: 1_780_000_000,
            current_period_end: 1_811_536_000,
          },
        ],
      },
    });

    const result = parseWebhookEvent(event);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.kind).toBe("subscription-upsert");
    if (result.value.kind !== "subscription-upsert") return;
    expect(result.value.plan).toBe("growth");
  });

  it("maps customer.subscription.deleted to a cancellation", () => {
    const result = parseWebhookEvent(fakeEvent("customer.subscription.deleted", baseSubscription));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({ kind: "subscription-cancel", stripeSubscriptionId: "sub_123" });
  });

  it("acknowledges event types it doesn't mutate state for, like invoice.paid", () => {
    const result = parseWebhookEvent(fakeEvent("invoice.paid", { id: "in_123" }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({ kind: "acknowledged", eventType: "invoice.paid" });
  });

  it("rejects a subscription with no metadata.userId", () => {
    const { metadata: _m, ...withoutMetadata } = baseSubscription;
    void _m;
    const result = parseWebhookEvent(fakeEvent("customer.subscription.created", withoutMetadata));

    expect(result.ok).toBe(false);
  });

  it("rejects a subscription whose price lookup_key isn't one of ours", () => {
    const event = fakeEvent("customer.subscription.created", {
      ...baseSubscription,
      items: { data: [{ price: { lookup_key: "some_other_product" } }] },
    });

    const result = parseWebhookEvent(event);
    expect(result.ok).toBe(false);
  });

  it("rejects a subscription with no resolvable billing period at all", () => {
    const { current_period_start: _s, current_period_end: _e, ...withoutRootPeriod } = baseSubscription;
    void _s;
    void _e;
    const event = fakeEvent("customer.subscription.created", {
      ...withoutRootPeriod,
      items: { data: [{ price: { lookup_key: "reeljolt_starter_monthly" } }] },
    });

    const result = parseWebhookEvent(event);
    expect(result.ok).toBe(false);
  });
});
