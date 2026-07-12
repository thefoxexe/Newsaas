import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/src/supabase/get-session";
import { createStripeClient } from "@/src/billing/stripe-client";
import { createCheckoutSession } from "@/src/billing/checkout";
import { lookupKeyFor } from "@/src/billing/plan-prices";

const CheckoutSchema = z.object({
  plan: z.enum(["starter", "growth", "scale"]),
  billingPeriod: z.enum(["monthly", "annual"]),
});

export async function POST(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = CheckoutSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid body", issues: body.error.issues }, { status: 400 });
  }

  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? new URL(request.url).origin;
  const stripeClient = createStripeClient();
  const lookupKey = lookupKeyFor(body.data.plan, body.data.billingPeriod);

  const prices = await stripeClient.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  const price = prices.data[0];
  if (!price) {
    return NextResponse.json({ error: `no Stripe price found for "${lookupKey}"` }, { status: 500 });
  }

  const url = await createCheckoutSession(stripeClient, {
    userId: session.user.id,
    userEmail: session.user.email,
    priceId: price.id,
    successUrl: `${appUrl}/app/billing?checkout=success`,
    cancelUrl: `${appUrl}/app/billing?checkout=cancelled`,
  });

  return NextResponse.json({ url });
}
