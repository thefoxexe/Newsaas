import type { BrandKit } from "../domain/brand-kit";
import type { TextConstraints } from "../domain/text-constraints";
import { checkTextConstraints } from "../domain/text-constraints";
import type { Result } from "../domain/result";
import { ok, err } from "../domain/result";
import type { LlmClient } from "./llm-client";
import { buildGenerationPrompt } from "./build-prompt";
import { parseGenerationResponse, type GenerationResponse } from "./parse-generation-response";
import { LlmConstraintViolationError, LlmResponseParseError } from "./errors";

export async function generateConcepts(
  brandKit: BrandKit,
  llmClient: LlmClient,
  textConstraints: TextConstraints,
): Promise<Result<GenerationResponse, LlmResponseParseError | LlmConstraintViolationError>> {
  const prompt = buildGenerationPrompt(brandKit, textConstraints);

  const firstAttempt = await tryOnce(llmClient, prompt, brandKit.products.length, textConstraints);
  if (firstAttempt.ok) {
    return firstAttempt;
  }

  return tryOnce(llmClient, prompt, brandKit.products.length, textConstraints);
}

async function tryOnce(
  llmClient: LlmClient,
  prompt: ReturnType<typeof buildGenerationPrompt>,
  productCount: number,
  textConstraints: TextConstraints,
): Promise<Result<GenerationResponse, LlmResponseParseError | LlmConstraintViolationError>> {
  const raw = await llmClient.complete(prompt);

  const parsed = parseGenerationResponse(raw);
  if (!parsed.ok) {
    return parsed;
  }

  // The model is asked for several independent concepts per call; one of
  // them drifting a few characters past a limit (French body copy runs long)
  // shouldn't cost the whole batch a retry when the others are fine. Only
  // the concepts that actually violate a constraint are dropped — the batch
  // as a whole only fails if none of them survive.
  const validConcepts: (typeof parsed.value.concepts)[number][] = [];
  let firstViolation: LlmConstraintViolationError | undefined;

  for (const concept of parsed.value.concepts) {
    const textCheck = checkTextConstraints(textConstraints, concept);
    if (!textCheck.ok) {
      firstViolation ??= new LlmConstraintViolationError(concept.id, textCheck.error.field, textCheck.error.reason);
      continue;
    }

    if (concept.productImageIndex !== null && concept.productImageIndex >= productCount) {
      firstViolation ??= new LlmConstraintViolationError(
        concept.id,
        "productImageIndex",
        `index ${concept.productImageIndex} is out of range for ${productCount} products`,
      );
      continue;
    }

    validConcepts.push(concept);
  }

  if (validConcepts.length === 0) {
    return err(firstViolation ?? new LlmConstraintViolationError("unknown", "concepts", "no concepts returned"));
  }

  return ok({ ...parsed.value, concepts: validConcepts });
}
