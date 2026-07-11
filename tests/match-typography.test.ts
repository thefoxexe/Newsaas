import { describe, expect, it } from "vitest";
import { matchTypography } from "../src/extract/match-typography.js";

describe("matchTypography", () => {
  it("picks the most frequent resolved font per role", () => {
    const result = matchTypography(["Poppins", "Poppins", "Arial"], ["Inter", "Inter", "Inter", "Arial"]);

    expect(result.headingFamily).toBe("Poppins");
    expect(result.bodyFamily).toBe("Inter");
  });

  it("matches a known family against the Google Fonts catalog, case-insensitively", () => {
    const result = matchTypography(["poppins"], ["arial"]);

    expect(result.googleFontMatch).toBe("Poppins");
  });

  it("returns null when the font isn't in the catalog", () => {
    const result = matchTypography(["Helvetica Neue"], ["Arial"]);

    expect(result.googleFontMatch).toBeNull();
  });

  it("falls back to sans-serif when no heading font was observed", () => {
    const result = matchTypography([], []);

    expect(result.headingFamily).toBe("sans-serif");
  });
});
