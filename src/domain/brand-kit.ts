import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "expected a 6-digit hex color");

export const BrandKitSchema = z.object({
  sourceUrl: z.string().url(),
  colors: z.object({
    primary: hexColor,
    secondary: hexColor,
    background: hexColor,
    text: hexColor,
    accent: hexColor.nullable(),
    confidence: z.number().min(0).max(1),
  }),
  typography: z.object({
    headingFamily: z.string().min(1),
    bodyFamily: z.string().min(1),
    googleFontMatch: z.string().nullable(),
    fallbackStack: z.string().min(1),
  }),
  logo: z
    .object({
      url: z.string().url(),
      hasTransparency: z.boolean(),
    })
    .nullable(),
  products: z.array(
    z.object({
      title: z.string().min(1),
      price: z.string().nullable(),
      imageUrl: z.string().url(),
      description: z.string().nullable(),
    }),
  ),
  copy: z.object({
    tagline: z.string().nullable(),
    headings: z.array(z.string()),
    reviewSnippets: z.array(z.string()),
  }),
  // Best-effort: only populated when the site has service-labelled sections
  // (agency/service sites, which have no schema.org Product data at all).
  // `.default([])` keeps this optional on already-stored brand kits.
  services: z.array(z.string()).default([]),
});

export type BrandKit = z.infer<typeof BrandKitSchema>;

// Used when extraction fails outright (no signals to work from at all) but
// the user still wants to manually fill in and save a business — the review
// form's fallback path. Colors/typography get inert placeholders since the
// render pipeline requires *some* valid value; the fields the manual form
// actually asks for (tagline, services, logo) start empty/null.
export function blankBrandKit(sourceUrl: string): BrandKit {
  return {
    sourceUrl,
    colors: {
      primary: "#000000",
      secondary: "#000000",
      background: "#FFFFFF",
      text: "#000000",
      accent: null,
      confidence: 0,
    },
    typography: {
      headingFamily: "sans-serif",
      bodyFamily: "sans-serif",
      googleFontMatch: null,
      fallbackStack: "sans-serif",
    },
    logo: null,
    products: [],
    copy: { tagline: null, headings: [], reviewSnippets: [] },
    services: [],
  };
}
