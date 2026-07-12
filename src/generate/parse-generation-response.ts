import { z } from "zod";
import { BrandAnalysisSchema } from "../domain/brand-analysis";
import { AdConceptSchema } from "../domain/ad-concept";
import type { Result } from "../domain/result";
import { ok, err } from "../domain/result";
import { LlmResponseParseError } from "./errors";

const GenerationResponseSchema = z.object({
  analysis: BrandAnalysisSchema,
  concepts: z.array(AdConceptSchema).min(1),
});

export type GenerationResponse = z.infer<typeof GenerationResponseSchema>;

export function parseGenerationResponse(raw: string): Result<GenerationResponse, LlmResponseParseError> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (cause) {
    return err(new LlmResponseParseError(cause instanceof Error ? cause.message : String(cause)));
  }

  const parsed = GenerationResponseSchema.safeParse(json);
  if (!parsed.success) {
    return err(new LlmResponseParseError(parsed.error.message));
  }

  return ok(parsed.data);
}
