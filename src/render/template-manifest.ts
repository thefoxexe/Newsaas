import { z } from "zod";
import { FormatSchema } from "../domain/format";
import { TemplateIdSchema } from "../domain/ad-concept";

export const TemplateManifestSchema = z.object({
  id: TemplateIdSchema,
  durationMs: z.number().int().positive(),
  fps: z.number().int().positive(),
  formats: z.array(FormatSchema).min(1),
  textConstraints: z.object({
    scene: z.object({ maxChars: z.number().int().positive() }),
  }),
});

export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;

// Shared by every template's manifest.json (see SHARED_TEMPLATE_TEXT_CONSTRAINTS
// in ../domain/text-constraints for why) — manifests are static JSON so this
// can't be imported by them directly, only compared against in
// tests/template-manifests.test.ts.
export const SHARED_TEMPLATE_TIMING = {
  durationMs: 15000,
  fps: 30,
  formats: ["9:16", "1:1", "16:9"],
};
