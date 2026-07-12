import { NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { createStripeClient } from "@/src/billing/stripe-client";
import { handleStripeWebhook } from "@/src/billing/handle-webhook";

export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];

  if (signature === null || webhookSecret === undefined) {
    return NextResponse.json({ error: "missing signature or webhook secret" }, { status: 400 });
  }

  const rawBody = await request.text();
  const result = await handleStripeWebhook(db, createStripeClient(), rawBody, signature, webhookSecret);

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
