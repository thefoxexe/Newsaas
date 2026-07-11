import { z } from "zod";
import { FormatSchema } from "../domain/format.js";
import { TemplateIdSchema } from "../domain/ad-concept.js";

export const TemplateManifestSchema = z.object({
  id: TemplateIdSchema,
  durationMs: z.number().int().positive(),
  fps: z.number().int().positive(),
  formats: z.array(FormatSchema).min(1),
  textConstraints: z.object({
    hook: z.object({ maxChars: z.number().int().positive() }),
    body: z.object({
      maxLines: z.number().int().positive(),
      maxCharsPerLine: z.number().int().positive(),
    }),
    cta: z.object({ maxChars: z.number().int().positive() }),
  }),
});

export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;
