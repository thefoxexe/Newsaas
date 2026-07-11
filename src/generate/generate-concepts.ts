import type { BrandKit } from "../domain/brand-kit.js";
import type { TextConstraints } from "../domain/text-constraints.js";
import { checkTextConstraints } from "../domain/text-constraints.js";
import type { Result } from "../domain/result.js";
import { ok, err } from "../domain/result.js";
import type { LlmClient } from "./llm-client.js";
import { buildGenerationPrompt } from "./build-prompt.js";
import { parseGenerationResponse, type GenerationResponse } from "./parse-generation-response.js";
import { LlmConstraintViolationError, LlmResponseParseError } from "./errors.js";

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

  for (const concept of parsed.value.concepts) {
    const textCheck = checkTextConstraints(textConstraints, concept);
    if (!textCheck.ok) {
      return err(new LlmConstraintViolationError(concept.id, textCheck.error.field, textCheck.error.reason));
    }

    if (concept.productImageIndex !== null && concept.productImageIndex >= productCount) {
      return err(
        new LlmConstraintViolationError(
          concept.id,
          "productImageIndex",
          `index ${concept.productImageIndex} is out of range for ${productCount} products`,
        ),
      );
    }
  }

  return ok(parsed.value);
}
