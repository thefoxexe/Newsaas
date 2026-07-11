import type { BrandKit } from "../domain/brand-kit.js";

const MAX_ITEMS = 10;

export function buildCopy(
  metaDescription: string | null,
  ogDescription: string | null,
  headings: string[],
  reviewSnippets: string[],
): BrandKit["copy"] {
  return {
    tagline: ogDescription ?? metaDescription ?? null,
    headings: headings.slice(0, MAX_ITEMS),
    reviewSnippets: reviewSnippets.slice(0, MAX_ITEMS),
  };
}
