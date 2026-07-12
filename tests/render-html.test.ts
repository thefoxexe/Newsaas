import { describe, expect, it } from "vitest";
import { renderTemplateHtml } from "../src/render/render-html";
import type { LoadedTemplate } from "../src/render/load-template";
import type { BrandKit } from "../src/domain/brand-kit";
import type { AdConcept } from "../src/domain/ad-concept";

const template: LoadedTemplate = {
  manifest: {
    id: "kinetic-type",
    durationMs: 6000,
    fps: 30,
    formats: ["9:16", "1:1", "16:9"],
    textConstraints: {
      hook: { maxChars: 20 },
      body: { maxLines: 2, maxCharsPerLine: 15 },
      cta: { maxChars: 10 },
    },
  },
  html: '<html><head><link rel="stylesheet" href="./style.css" /></head><body>__REELJOLT_DATA__</body></html>',
  css: ".stage { color: red; }",
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
};

function makeConcept(overrides: Partial<AdConcept> = {}): AdConcept {
  return {
    id: "concept-1",
    angle: "test angle",
    hook: "Short hook",
    body: ["Body line"],
    cta: "Go now",
    recommendedTemplate: "kinetic-type",
    productImageIndex: null,
    ...overrides,
  };
}

describe("renderTemplateHtml", () => {
  it("inlines the CSS and the concept data for a valid concept", () => {
    const result = renderTemplateHtml(template, brandKit, makeConcept());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("<style>.stage { color: red; }</style>");
    expect(result.value).toContain('"hook":"Short hook"');
    expect(result.value).toContain('"primary":"#FF0000"');
  });

  it("rejects a hook longer than the template's maxChars", () => {
    const result = renderTemplateHtml(
      template,
      brandKit,
      makeConcept({ hook: "This hook is definitely too long" }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("hook");
  });

  it("rejects more body lines than the template supports", () => {
    const result = renderTemplateHtml(
      template,
      brandKit,
      makeConcept({ body: ["Line one", "Line two", "Line three"] }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("body");
  });

  it("rejects a body line longer than maxCharsPerLine", () => {
    const result = renderTemplateHtml(
      template,
      brandKit,
      makeConcept({ body: ["This line is way too long"] }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("body");
  });

  it("rejects a CTA longer than maxChars", () => {
    const result = renderTemplateHtml(template, brandKit, makeConcept({ cta: "Way too long a CTA" }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("cta");
  });

  it("escapes closing script tags inside injected text to avoid breaking out of the data script", () => {
    const result = renderTemplateHtml(template, brandKit, makeConcept({ hook: "</script>bad" }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toContain("</script>bad");
    expect(result.value).toContain("<\\/script>bad");
  });
});
