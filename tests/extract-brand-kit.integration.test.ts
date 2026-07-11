import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { extractBrandKit } from "../src/extract/extract-brand-kit.js";
import { PlaywrightPageAnalyzer } from "../src/extract/analyze-page.js";
import { BrandKitSchema } from "../src/domain/brand-kit.js";

// Needs a real Chromium binary, same gating as the render integration test.
const chromiumAvailable = Boolean(process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fixtureUrl(name: string): string {
  return pathToFileURL(path.join(__dirname, "fixtures", name)).toString();
}

describe.skipIf(!chromiumAvailable)("extractBrandKit (real browser, local fixtures)", () => {
  it("extracts a JSON-LD-driven storefront (shop-a)", async () => {
    const result = await extractBrandKit(fixtureUrl("shop-a.html"), new PlaywrightPageAnalyzer());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const parsed = BrandKitSchema.safeParse(result.value);
    expect(parsed.success).toBe(true);

    expect(result.value.colors.background).toBe("#0B0B0F");
    expect(result.value.colors.primary).toBe("#FF6B35");
    expect(result.value.products).toHaveLength(1);
    expect(result.value.products[0]?.title).toBe("Veste technique Aro");
    expect(result.value.logo?.url).toContain("favicon-512.png");
    expect(result.value.copy.tagline).toBe("Le vestiaire technique de la ville.");
    expect(result.value.colors.confidence).toBeGreaterThan(0.5);
  }, 30_000);

  it("falls back to heuristics when there is no structured data (shop-b)", async () => {
    const result = await extractBrandKit(fixtureUrl("shop-b.html"), new PlaywrightPageAnalyzer());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.products).toHaveLength(0);
    expect(result.value.colors.background).toBe("#FFFFFF");
    expect(result.value.colors.primary).toBe("#2E7D32");
    expect(result.value.logo?.url).toContain("social-preview.jpg");
    expect(result.value.copy.tagline).toBe("Sacs et accessoires de voyage minimalistes.");
  }, 30_000);
});
