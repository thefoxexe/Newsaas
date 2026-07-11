import { z } from "zod";
import type { BrandKit } from "../domain/brand-kit.js";

const OfferSchema = z
  .object({
    price: z.union([z.string(), z.number()]).optional(),
    priceCurrency: z.string().optional(),
  })
  .passthrough();

const ProductNodeSchema = z
  .object({
    "@type": z.union([z.string(), z.array(z.string())]).optional(),
    name: z.string().optional(),
    image: z.union([z.string(), z.array(z.string())]).optional(),
    description: z.string().optional(),
    offers: z.union([OfferSchema, z.array(OfferSchema)]).optional(),
  })
  .passthrough();

type BrandKitProduct = BrandKit["products"][number];

function flattenJsonLdNodes(blocks: unknown[]): unknown[] {
  const nodes: unknown[] = [];

  for (const block of blocks) {
    if (Array.isArray(block)) {
      nodes.push(...flattenJsonLdNodes(block));
      continue;
    }
    if (block !== null && typeof block === "object") {
      const graph = (block as { "@graph"?: unknown })["@graph"];
      if (Array.isArray(graph)) {
        nodes.push(...flattenJsonLdNodes(graph));
      }
      nodes.push(block);
    }
  }

  return nodes;
}

function isProductType(type: string | string[] | undefined): boolean {
  if (type === undefined) return false;
  const types = Array.isArray(type) ? type : [type];
  return types.includes("Product");
}

function formatPrice(offers: z.infer<typeof OfferSchema> | z.infer<typeof OfferSchema>[] | undefined): string | null {
  const offer = Array.isArray(offers) ? offers[0] : offers;
  if (offer?.price === undefined) return null;
  return offer.priceCurrency !== undefined ? `${offer.priceCurrency} ${offer.price}` : String(offer.price);
}

export function parseJsonLdProducts(blocks: unknown[]): BrandKitProduct[] {
  const nodes = flattenJsonLdNodes(blocks);
  const products: BrandKitProduct[] = [];

  for (const node of nodes) {
    const parsed = ProductNodeSchema.safeParse(node);
    if (!parsed.success || !isProductType(parsed.data["@type"])) continue;

    const image = Array.isArray(parsed.data.image) ? parsed.data.image[0] : parsed.data.image;
    if (parsed.data.name === undefined || image === undefined) continue;

    products.push({
      title: parsed.data.name,
      price: formatPrice(parsed.data.offers),
      imageUrl: image,
      description: parsed.data.description ?? null,
    });
  }

  return products;
}
