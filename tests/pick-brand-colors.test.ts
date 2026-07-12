import { describe, expect, it } from "vitest";
import { pickBrandColors } from "../src/extract/pick-brand-colors";
import type { ColorSample } from "../src/extract/page-signals";

describe("pickBrandColors", () => {
  it("picks the dominant background, a prominent CTA as primary, and resolves text color", () => {
    const samples: ColorSample[] = [
      { color: "#0B0B0F", role: "background", areaPx: 2_000_000, isProminent: false },
      { color: "#FF6B35", role: "background", areaPx: 8_000, isProminent: true },
      { color: "#2E294E", role: "background", areaPx: 3_000, isProminent: true },
      { color: "#F5F5F0", role: "text", areaPx: 40_000, isProminent: false },
    ];

    const result = pickBrandColors(samples);

    expect(result.background).toBe("#0B0B0F");
    expect(result.primary).toBe("#FF6B35");
    expect(result.secondary).toBe("#2E294E");
    expect(result.text).toBe("#F5F5F0");
    expect(result.accent).toBeNull();
  });

  it("skips near-neutral clusters when choosing primary/secondary", () => {
    const samples: ColorSample[] = [
      { color: "#FFFFFF", role: "background", areaPx: 2_000_000, isProminent: false },
      { color: "#EDEDED", role: "background", areaPx: 100_000, isProminent: false },
      { color: "#FF6B35", role: "background", areaPx: 1_000, isProminent: true },
    ];

    const result = pickBrandColors(samples);

    expect(result.background).toBe("#FFFFFF");
    expect(result.primary).toBe("#FF6B35");
  });

  it("falls back to a readable text color when no text samples exist", () => {
    const samples: ColorSample[] = [{ color: "#000000", role: "background", areaPx: 1000, isProminent: false }];

    const result = pickBrandColors(samples);

    expect(result.text).toBe("#FAFAFA");
  });
});
