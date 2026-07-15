import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { extractBrandKit } from "../src/extract/extract-brand-kit";
import { PlaywrightPageAnalyzer } from "../src/extract/analyze-page";
import { BrandKitSchema } from "../src/domain/brand-kit";

// Needs a real Chromium binary, same gating as the render integration test.
const chromiumAvailable = Boolean(process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fixtureUrl(name: string): string {
  return pathToFileURL(path.join(__dirname, "fixtures", name)).toString();
}

// A screenshot data URI over a sane size ceiling would suggest the JPEG
// quality/viewport-only choice in analyze-page.ts needs revisiting.
const MAX_SCREENSHOT_DATA_URI_LENGTH = 2_000_000;

describe.skipIf(!chromiumAvailable)("extractBrandKit (real browser, local fixtures)", () => {
  it("extracts a JSON-LD-driven storefront (shop-a)", async () => {
    const start = Date.now();
    const result = await extractBrandKit(fixtureUrl("shop-a.html"), new PlaywrightPageAnalyzer());
    const elapsedMs = Date.now() - start;

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

    // Has products -> ecommerce.
    expect(result.value.businessType).toBe("ecommerce");
    expect(result.value.screenshotUrl).toMatch(/^data:image\/jpeg;base64,/);
    expect(result.value.screenshotUrl?.length ?? 0).toBeLessThan(MAX_SCREENSHOT_DATA_URI_LENGTH);
    // The added screenshot step shouldn't meaningfully eat into the
    // extractor's own TOTAL_BUDGET_MS/NETWORK_IDLE_TIMEOUT_MS budgets.
    expect(elapsedMs).toBeLessThan(30_000);
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

    // No products, no service-labelled sections in this fixture -> unknown.
    expect(result.value.businessType).toBeNull();
    expect(result.value.screenshotUrl).toMatch(/^data:image\/jpeg;base64,/);
  }, 30_000);
});
