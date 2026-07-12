"use client";

import { useState } from "react";

type Plan = "starter" | "growth" | "scale";
type BillingPeriod = "monthly" | "annual";

export function CheckoutButton({ plan, billingPeriod }: { plan: Plan; billingPeriod: BillingPeriod }) {
  const [loading, setLoading] = useState(false);

  async function handleClick(): Promise<void> {
    setLoading(true);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billingPeriod }),
    });
    setLoading(false);

    if (!response.ok) {
      window.alert("Impossible de lancer le paiement.");
      return;
    }

    const { url } = (await response.json()) as { url: string };
    window.location.href = url;
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
    >
      {loading ? "..." : billingPeriod === "monthly" ? "Mensuel" : "Annuel (2 mois offerts)"}
    </button>
  );
}

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick(): Promise<void> {
    setLoading(true);
    const response = await fetch("/api/billing/portal", { method: "POST" });
    setLoading(false);

    if (!response.ok) {
      window.alert("Aucun abonnement Stripe à gérer pour l'instant.");
      return;
    }

    const { url } = (await response.json()) as { url: string };
    window.location.href = url;
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-pill border border-border px-4 py-2 text-sm font-semibold"
    >
      {loading ? "..." : "Gérer mon abonnement"}
    </button>
  );
}
