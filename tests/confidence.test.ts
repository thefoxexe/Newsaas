import { describe, expect, it } from "vitest";
import { computeConfidence } from "../src/extract/confidence";

describe("computeConfidence", () => {
  it("returns 1 when every signal is strong", () => {
    const score = computeConfidence({
      hasProducts: true,
      colorDominanceRatio: 1,
      fontResolved: true,
      hasLogo: true,
    });
    expect(score).toBe(1);
  });

  it("returns 0 when every signal is absent", () => {
    const score = computeConfidence({
      hasProducts: false,
      colorDominanceRatio: 0,
      fontResolved: false,
      hasLogo: false,
    });
    expect(score).toBe(0);
  });

  it("clamps an out-of-range dominance ratio", () => {
    const score = computeConfidence({
      hasProducts: false,
      colorDominanceRatio: 5,
      fontResolved: false,
      hasLogo: false,
    });
    expect(score).toBe(0.3);
  });

  it("weighs missing products and a weak color signal proportionally", () => {
    const score = computeConfidence({
      hasProducts: false,
      colorDominanceRatio: 0.5,
      fontResolved: true,
      hasLogo: true,
    });
    expect(score).toBe(0.55);
  });
});
