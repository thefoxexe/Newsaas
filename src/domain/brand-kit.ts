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
});

export type BrandKit = z.infer<typeof BrandKitSchema>;
