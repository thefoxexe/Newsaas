import { z } from "zod";

export const TEMPLATE_IDS = ["dark-neon", "light-gradient", "color-blocks", "editorial", "split-duotone", "unboxed"] as const;

export const TemplateIdSchema = z.enum(TEMPLATE_IDS);

export type TemplateId = z.infer<typeof TemplateIdSchema>;

// Every concept is a fixed 4-scene sequence (see generate-concepts.ts for
// the role-order/coverage checks the domain schema deliberately doesn't
// enforce) instead of one continuous hook/body/cta composition — the fix
// for ads that had 15s of runtime but only ~5s of actual choreography.
export const SCENE_ROLES = ["hook", "proof", "feature", "cta"] as const;

export const SceneRoleSchema = z.enum(SCENE_ROLES);

export type SceneRole = z.infer<typeof SceneRoleSchema>;

export const SceneSchema = z.object({
  role: SceneRoleSchema,
  text: z.string().min(1),
  // A substring of `text` to render in the brand's accent color (the
  // WebAlp/MotionSwell technique: "vous **cherche**", "Think **deeper**")
  // — null renders the whole line in the normal text color.
  highlight: z.string().min(1).nullable(),
  // Only meaningful on the "feature" role; every other role must leave
  // this null (enforced in generate-concepts.ts, not here).
  productImageIndex: z.number().int().nonnegative().nullable(),
});

export type Scene = z.infer<typeof SceneSchema>;

export const AdConceptSchema = z.object({
  id: z.string().min(1),
  angle: z.string().min(1),
  recommendedTemplate: TemplateIdSchema,
  scenes: z.array(SceneSchema).length(4),
});

export type AdConcept = z.infer<typeof AdConceptSchema>;
