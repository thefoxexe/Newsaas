export const PLANS = ["free", "starter", "growth", "scale"] as const;
export type Plan = (typeof PLANS)[number];

export type PlanLimits = {
  creditsPerPeriod: number;
  // null means unlimited. `Infinity` used to sit here, but
  // JSON.stringify(Infinity) produces `null` anyway once this crosses an API
  // boundary (it does, via /api/subscription) — so any client-side check
  // like `count < maxBrands` would have silently broken for this plan the
  // moment maxBrands actually started being enforced. Being explicit avoids
  // that trap entirely.
  maxBrands: number | null;
  watermark: boolean;
  maxResolution: "720p" | "1080p" | "4k";
  queuePriority: "low" | "normal" | "high" | "priority";
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { creditsPerPeriod: 1, maxBrands: 1, watermark: true, maxResolution: "720p", queuePriority: "low" },
  starter: {
    creditsPerPeriod: 30,
    maxBrands: 1,
    watermark: false,
    maxResolution: "1080p",
    queuePriority: "normal",
  },
  growth: {
    creditsPerPeriod: 120,
    maxBrands: 3,
    watermark: false,
    maxResolution: "1080p",
    queuePriority: "high",
  },
  scale: {
    creditsPerPeriod: 500,
    maxBrands: null,
    watermark: false,
    maxResolution: "4k",
    queuePriority: "priority",
  },
};
