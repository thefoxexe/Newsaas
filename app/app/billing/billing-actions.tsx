"use client";

import { useState } from "react";

type Plan = "starter" | "growth" | "scale";
type BillingPeriod = "monthly" | "annual";

export function CheckoutButton({
  plan,
  billingPeriod,
  label,
  errorLabel,
}: {
  plan: Plan;
  billingPeriod: BillingPeriod;
  label: string;
  errorLabel: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick(): Promise<void> {
    setLoading(true);
    setError(false);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billingPeriod }),
    });
    setLoading(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    const { url } = (await response.json()) as { url: string };
    window.location.href = url;
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
      >
        {loading ? "..." : label}
      </button>
      {error && <p className="mt-2 text-xs text-danger">{errorLabel}</p>}
    </div>
  );
}

export function ManageSubscriptionButton({ label, errorLabel }: { label: string; errorLabel: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick(): Promise<void> {
    setLoading(true);
    setError(false);
    const response = await fetch("/api/billing/portal", { method: "POST" });
    setLoading(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    const { url } = (await response.json()) as { url: string };
    window.location.href = url;
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-pill border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-border-strong disabled:opacity-50"
      >
        {loading ? "..." : label}
      </button>
      {error && <p className="mt-2 text-xs text-danger">{errorLabel}</p>}
    </div>
  );
}
