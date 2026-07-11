export type Period = {
  periodStart: Date;
  periodEnd: Date;
};

/**
 * Credits reset per billing period (spec §8). Paid plans mirror Stripe's
 * current_period_start/end exactly. The free plan has no Stripe
 * subscription behind it, so it resets on calendar months instead.
 */
export function resolvePeriod(stripePeriod: Period | null, now: Date): Period {
  if (stripePeriod !== null) {
    return stripePeriod;
  }

  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return { periodStart, periodEnd };
}
