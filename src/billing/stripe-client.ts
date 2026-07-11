import Stripe from "stripe";

export function createStripeClient(apiKey = process.env["STRIPE_SECRET_KEY"]): Stripe {
  if (apiKey === undefined) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(apiKey);
}
