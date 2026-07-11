import { z } from "zod";

export const TEMPLATE_IDS = [
  "kinetic-type",
  "product-reveal",
  "split-claim",
  "review-slam",
  "price-drop",
] as const;

export const TemplateIdSchema = z.enum(TEMPLATE_IDS);

export type TemplateId = z.infer<typeof TemplateIdSchema>;

export const AdConceptSchema = z.object({
  id: z.string().min(1),
  angle: z.string().min(1),
  hook: z.string().min(1),
  body: z.array(z.string().min(1)).min(1).max(4),
  cta: z.string().min(1),
  recommendedTemplate: TemplateIdSchema,
  productImageIndex: z.number().int().nonnegative().nullable(),
});

export type AdConcept = z.infer<typeof AdConceptSchema>;
