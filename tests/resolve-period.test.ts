import { describe, expect, it } from "vitest";
import { resolvePeriod } from "../src/entitlements/resolve-period";

describe("resolvePeriod", () => {
  it("uses the Stripe period verbatim when one is provided", () => {
    const stripePeriod = { periodStart: new Date("2026-03-05T00:00:00Z"), periodEnd: new Date("2026-04-05T00:00:00Z") };
    const result = resolvePeriod(stripePeriod, new Date("2026-03-20T00:00:00Z"));
    expect(result).toEqual(stripePeriod);
  });

  it("falls back to the calendar month when there is no Stripe subscription", () => {
    const result = resolvePeriod(null, new Date("2026-03-20T12:00:00Z"));
    expect(result.periodStart.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(result.periodEnd.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("rolls the calendar month over into the next year in December", () => {
    const result = resolvePeriod(null, new Date("2026-12-15T00:00:00Z"));
    expect(result.periodStart.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(result.periodEnd.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
