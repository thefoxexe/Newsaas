import type Stripe from "stripe";

export type CreateCheckoutSessionInput = {
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
};

// subscription_data.metadata.userId is how the webhook handler later links
// a customer.subscription.* event back to our user (see parse-webhook-event.ts).
export async function createCheckoutSession(stripeClient: Stripe, input: CreateCheckoutSessionInput): Promise<string> {
  const session = await stripeClient.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: input.priceId, quantity: 1 }],
    customer_email: input.userEmail,
    client_reference_id: input.userId,
    allow_promotion_codes: true,
    subscription_data: { metadata: { userId: input.userId } },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });

  if (session.url === null) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return session.url;
}
