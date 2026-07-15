import { describe, expect, it } from "vitest";
import { renderTemplateHtml } from "../src/render/render-html";
import type { LoadedTemplate } from "../src/render/load-template";
import type { BrandKit } from "../src/domain/brand-kit";
import type { AdConcept, Scene } from "../src/domain/ad-concept";

const template: LoadedTemplate = {
  manifest: {
    id: "dark-neon",
    durationMs: 15000,
    fps: 30,
    formats: ["9:16", "1:1", "16:9"],
    textConstraints: {
      scene: { maxChars: 20 },
    },
  },
  html: '<html><head><link rel="stylesheet" href="./style.css" /></head><body>__REELJOLT_DATA__</body></html>',
  css: ".stage { color: red; }",
  sharedJs: "",
};

const brandKit: BrandKit = {
  sourceUrl: "https://example.com",
  colors: {
    primary: "#FF0000",
    secondary: "#00FF00",
    background: "#000000",
    text: "#FFFFFF",
    accent: null,
    confidence: 0.9,
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

function makeScenes(overrides: Partial<Record<Scene["role"], Partial<Scene>>> = {}): Scene[] {
  const base: Record<Scene["role"], Scene> = {
    hook: { role: "hook", text: "Short hook", highlight: null, productImageIndex: null },
    proof: { role: "proof", text: "Good review", highlight: null, productImageIndex: null },
    feature: { role: "feature", text: "Nice thing", highlight: null, productImageIndex: null },
    cta: { role: "cta", text: "Go now", highlight: null, productImageIndex: null },
  };
  return (["hook", "proof", "feature", "cta"] as const).map((role) => ({ ...base[role], ...overrides[role] }));
}

function makeConcept(sceneOverrides: Partial<Record<Scene["role"], Partial<Scene>>> = {}): AdConcept {
  return {
    id: "concept-1",
    angle: "test angle",
    recommendedTemplate: "dark-neon",
    scenes: makeScenes(sceneOverrides),
  };
}

describe("renderTemplateHtml", () => {
  it("inlines the CSS and the concept data for a valid concept", () => {
    const result = renderTemplateHtml(template, brandKit, makeConcept());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("<style>.stage { color: red; }</style>");
    expect(result.value).toContain('"text":"Short hook"');
    expect(result.value).toContain('"primary":"#FF0000"');
    expect(result.value).toContain('"angle":"test angle"');
    expect(result.value).toContain('"brandName":"example.com"');
    expect(result.value).toContain('"logoUrl":null');
  });

  it("passes through a logo URL and derives the brand name from the source URL's hostname", () => {
    const result = renderTemplateHtml(
      template,
      { ...brandKit, sourceUrl: "https://www.vestedwear.com/shop", logo: { url: "https://vestedwear.com/logo.png", hasTransparency: true } },
      makeConcept(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('"brandName":"vestedwear.com"');
    expect(result.value).toContain('"logoUrl":"https://vestedwear.com/logo.png"');
  });

  it("resolves a scene's product from the brand kit's products array via productImageIndex", () => {
    const result = renderTemplateHtml(
      template,
      { ...brandKit, products: [{ title: "Veste", price: "CHF 99", imageUrl: "https://example.com/v.jpg", description: null }] },
      makeConcept({ feature: { productImageIndex: 0 } }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('"title":"Veste"');
    expect(result.value).toContain('"price":"CHF 99"');
  });

  it("rejects a scene whose text exceeds the template's maxChars", () => {
    const result = renderTemplateHtml(
      template,
      brandKit,
      makeConcept({ hook: { text: "This hook is definitely too long" } }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("scene");
  });

  it("escapes closing script tags inside injected text to avoid breaking out of the data script", () => {
    const result = renderTemplateHtml(template, brandKit, makeConcept({ hook: { text: "</script>bad" } }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toContain("</script>bad");
    expect(result.value).toContain("<\\/script>bad");
  });

  it("omits the watermark badge by default", () => {
    const result = renderTemplateHtml(template, brandKit, makeConcept());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toContain("Made with ReelJolt");
  });

  it("injects a watermark badge before </body> when requested, with a high explicit z-index", () => {
    const result = renderTemplateHtml(template, brandKit, makeConcept(), true);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("Made with ReelJolt");
    expect(result.value.indexOf("Made with ReelJolt")).toBeLessThan(result.value.indexOf("</body>"));
    // Being last in the DOM isn't enough on its own — the templates' final
    // "cta" scene covers the full viewport at its own z-index, which
    // covered the badge during that beat until this was added explicitly.
    expect(result.value).toContain("z-index:999");
  });
});
