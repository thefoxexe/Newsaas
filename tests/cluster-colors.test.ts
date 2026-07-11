import { describe, expect, it } from "vitest";
import { clusterColors } from "../src/extract/cluster-colors.js";
import type { ColorSample } from "../src/extract/page-signals.js";

function sample(color: string, areaPx: number, isProminent = false): ColorSample {
  return { color, role: "background", areaPx, isProminent };
}

describe("clusterColors", () => {
  it("merges near-identical colors into a single cluster", () => {
    const clusters = clusterColors([sample("#FF0000", 100), sample("#FE0101", 50), sample("#0000FF", 30)]);

    expect(clusters).toHaveLength(2);
    expect(clusters[0]?.color).toBe("#FF0000");
    expect(clusters[0]?.weight).toBe(150);
  });

  it("keeps visually distinct colors in separate clusters", () => {
    const clusters = clusterColors([sample("#FF0000", 100), sample("#00FF00", 100), sample("#0000FF", 100)]);

    expect(clusters).toHaveLength(3);
  });

  it("boosts prominent samples over raw surface area", () => {
    const clusters = clusterColors([
      sample("#111111", 100_000, false), // large neutral background
      sample("#FF6B35", 5_000, true), // small but prominent CTA
    ]);

    expect(clusters[0]?.color).toBe("#111111");
    expect(clusters[1]?.weight).toBe(30_000);
  });

  it("flags near-gray colors as neutral", () => {
    const clusters = clusterColors([sample("#101010", 10), sample("#FF6B35", 10)]);

    const neutral = clusters.find((c) => c.color === "#101010");
    const brand = clusters.find((c) => c.color === "#FF6B35");

    expect(neutral?.isNeutral).toBe(true);
    expect(brand?.isNeutral).toBe(false);
  });

  it("sorts clusters by weight, heaviest first", () => {
    const clusters = clusterColors([sample("#AAAAAA", 10), sample("#FF6B35", 200)]);

    expect(clusters[0]?.color).toBe("#FF6B35");
  });
});
