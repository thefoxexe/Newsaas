import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { subscriptions } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { createStripeClient } from "@/src/billing/stripe-client";
import { createPortalSession } from "@/src/billing/portal";

export async function POST(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, session.user.id));
  if (!subscription) {
    return NextResponse.json({ error: "no Stripe customer for this account yet" }, { status: 404 });
  }

  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? new URL(request.url).origin;
  const url = await createPortalSession(createStripeClient(), {
    stripeCustomerId: subscription.stripeCustomerId,
    returnUrl: `${appUrl}/app/billing`,
  });

  return NextResponse.json({ url });
}
