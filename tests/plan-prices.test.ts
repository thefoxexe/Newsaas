import { describe, expect, it } from "vitest";
import { lookupKeyFor, planForLookupKey } from "../src/billing/plan-prices.js";

describe("plan-prices", () => {
  it("resolves a plan from a known lookup_key", () => {
    expect(planForLookupKey("reeljolt_growth_annual")).toBe("growth");
  });

  it("returns null for an unknown lookup_key", () => {
    expect(planForLookupKey("something_else")).toBeNull();
  });

  it("round-trips lookupKeyFor and planForLookupKey for every plan/period", () => {
    for (const plan of ["starter", "growth", "scale"] as const) {
      for (const period of ["monthly", "annual"] as const) {
        expect(planForLookupKey(lookupKeyFor(plan, period))).toBe(plan);
      }
    }
  });
});
