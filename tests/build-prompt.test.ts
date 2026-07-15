import { describe, expect, it } from "vitest";
import { buildGenerationPrompt } from "../src/generate/build-prompt";
import type { BrandKit } from "../src/domain/brand-kit";

const baseBrandKit: BrandKit = {
  sourceUrl: "https://example.com",
  colors: {
    primary: "#FF6B35",
    secondary: "#2E294E",
    background: "#0B0B0F",
    text: "#F5F5F0",
    accent: null,
    confidence: 0.8,
  },
  typography: {
    headingFamily: "Arial",
    bodyFamily: "Arial",
    googleFontMatch: null,
    fallbackStack: "sans-serif",
  },
  logo: null,
  products: [],
  copy: { tagline: null, headings: [], reviewSnippets: [] },
  services: [],
  businessType: null,
  screenshotUrl: null,
};

const textConstraints = { scene: { maxChars: 48 } };

describe("buildGenerationPrompt", () => {
  it("tells the model to infer the business type itself when unknown", () => {
    const prompt = buildGenerationPrompt(baseBrandKit, textConstraints);
    expect(prompt.user).toContain("Type d'activite detecte : inconnu");
    expect(prompt.user).toContain("deduis-le toi-meme");
  });

  it("passes through a known ecommerce business type without the inference instruction", () => {
    const prompt = buildGenerationPrompt({ ...baseBrandKit, businessType: "ecommerce" }, textConstraints);
    expect(prompt.user).toContain("Type d'activite detecte : e-commerce");
    expect(prompt.user).not.toContain("deduis-le toi-meme");
  });

  it("passes through a known saas business type", () => {
    const prompt = buildGenerationPrompt({ ...baseBrandKit, businessType: "saas" }, textConstraints);
    expect(prompt.user).toContain("Type d'activite detecte : SaaS");
  });

  it("passes through a known service business type", () => {
    const prompt = buildGenerationPrompt({ ...baseBrandKit, businessType: "service" }, textConstraints);
    expect(prompt.user).toContain("Type d'activite detecte : prestation de service");
  });

  it("includes the services list when present", () => {
    const prompt = buildGenerationPrompt({ ...baseBrandKit, services: ["Conseil", "Formation"] }, textConstraints);
    expect(prompt.user).toContain("Services releves : Conseil | Formation");
  });

  it("falls back to 'aucun' when there are no services", () => {
    const prompt = buildGenerationPrompt(baseBrandKit, textConstraints);
    expect(prompt.user).toContain("Services releves : aucun");
  });
});
