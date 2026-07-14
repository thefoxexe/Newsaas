import type { BrandKit } from "../domain/brand-kit";
import type { Result } from "../domain/result";
import { ok, err } from "../domain/result";
import type { PageAnalyzer } from "./analyze-page";
import { pickBrandColors } from "./pick-brand-colors";
import { matchTypography } from "./match-typography";
import { pickLogo } from "./pick-logo";
import { parseJsonLdProducts } from "./parse-products";
import { buildCopy } from "./build-copy";
import { computeConfidence } from "./confidence";
import { ExtractionNavigationError, ExtractionTimeoutError } from "./errors";

// JSON-LD image URLs are commonly relative on real storefronts, unlike the
// signals collected in-browser (already resolved against document.baseURI).
function resolveAgainst(base: string, value: string): string | null {
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

export async function extractBrandKit(
  url: string,
  analyzer: PageAnalyzer,
): Promise<Result<BrandKit, ExtractionTimeoutError | ExtractionNavigationError>> {
  let signals;
  try {
    signals = await analyzer.analyze(url);
  } catch (cause) {
    if (cause instanceof ExtractionTimeoutError || cause instanceof ExtractionNavigationError) {
      return err(cause);
    }
    throw cause;
  }

  const colors = pickBrandColors(signals.colorSamples);
  const typography = matchTypography(signals.headingFontFamilies, signals.bodyFontFamilies);
  const logo = pickLogo(signals.iconHrefs, signals.ogImage, signals.headerLogoCandidates);
  const products = parseJsonLdProducts(signals.jsonLdBlocks)
    .map((product) => {
      const imageUrl = resolveAgainst(signals.sourceUrl, product.imageUrl);
      return imageUrl === null ? null : { ...product, imageUrl };
    })
    .filter((product): product is NonNullable<typeof product> => product !== null);
  const copy = buildCopy(signals.metaDescription, signals.ogDescription, signals.headings, signals.reviewLikeSnippets);

  const confidence = computeConfidence({
    hasProducts: products.length > 0,
    colorDominanceRatio: colors.dominanceRatio,
    fontResolved: typography.googleFontMatch !== null,
    hasLogo: logo !== null,
  });

  return ok({
    sourceUrl: signals.sourceUrl,
    colors: {
      primary: colors.primary,
      secondary: colors.secondary,
      background: colors.background,
      text: colors.text,
      accent: colors.accent,
      confidence,
    },
    typography,
    logo,
    products,
    copy,
    services: signals.serviceLikeSnippets,
  });
}
