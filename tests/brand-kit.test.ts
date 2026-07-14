import { describe, expect, it } from "vitest";
import { BrandKitSchema } from "../src/domain/brand-kit";

const validBrandKit = {
  sourceUrl: "https://example.com",
  colors: {
    primary: "#112233",
    secondary: "#445566",
    background: "#000000",
    text: "#FFFFFF",
    accent: null,
    confidence: 0.5,
  },
  typography: {
    headingFamily: "Poppins",
    bodyFamily: "Inter",
    googleFontMatch: "Poppins",
    fallbackStack: "sans-serif",
  },
  logo: null,
  products: [],
  copy: { tagline: null, headings: [], reviewSnippets: [] },
};

describe("BrandKitSchema", () => {
  it("accepts a well-formed brand kit", () => {
    expect(BrandKitSchema.safeParse(validBrandKit).success).toBe(true);
  });

  it("rejects a color that is not a 6-digit hex value", () => {
    const invalid = { ...validBrandKit, colors: { ...validBrandKit.colors, primary: "blue" } };
    expect(BrandKitSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects a confidence score outside 0-1", () => {
    const invalid = { ...validBrandKit, colors: { ...validBrandKit.colors, confidence: 1.5 } };
    expect(BrandKitSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects a source URL that is not a valid URL", () => {
    const invalid = { ...validBrandKit, sourceUrl: "not-a-url" };
    expect(BrandKitSchema.safeParse(invalid).success).toBe(false);
  });

  it("defaults services to an empty array for a brand kit stored before the field existed", () => {
    const parsed = BrandKitSchema.safeParse(validBrandKit);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.services).toEqual([]);
  });
});
