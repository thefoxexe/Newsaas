import type { BrandKit } from "./brand-kit";

export type BrandKitOverrides = {
  tagline?: string | undefined;
  services?: string[] | undefined;
  logoUrl?: string | undefined;
};

// Merges manual corrections from the review/edit form into an extracted
// BrandKit. A blank/omitted override always keeps whatever extraction
// produced — this only ever fills gaps or fixes mistakes, it never erases a
// working extraction result with an empty form field.
export function applyBrandKitOverrides(brandKit: BrandKit, overrides: BrandKitOverrides): BrandKit {
  return {
    ...brandKit,
    copy: {
      ...brandKit.copy,
      tagline: overrides.tagline?.trim() ? overrides.tagline.trim() : brandKit.copy.tagline,
    },
    services: overrides.services ?? brandKit.services,
    logo: overrides.logoUrl?.trim() ? { url: overrides.logoUrl.trim(), hasTransparency: false } : brandKit.logo,
  };
}
