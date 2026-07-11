import type Stripe from "stripe";

export type CreatePortalSessionInput = {
  stripeCustomerId: string;
  returnUrl: string;
};

// Never reimplement plan changes, cancellation, or invoice history in our
// own UI (spec §8) — the Customer Portal is Stripe's, we only deep-link to it.
export async function createPortalSession(stripeClient: Stripe, input: CreatePortalSessionInput): Promise<string> {
  const session = await stripeClient.billingPortal.sessions.create({
    customer: input.stripeCustomerId,
    return_url: input.returnUrl,
  });

  return session.url;
}
