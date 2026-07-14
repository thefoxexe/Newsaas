import type { BrandKit } from "../domain/brand-kit";
import type { TextConstraints } from "../domain/text-constraints";
import { checkTextConstraints } from "../domain/text-constraints";
import { SCENE_ROLES } from "../domain/ad-concept";
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
  // them drifting a few characters past a limit (French copy runs long)
  // shouldn't cost the whole batch a retry when the others are fine. Only
  // the concepts that actually violate a constraint are dropped — the batch
  // as a whole only fails if none of them survive.
  const validConcepts: (typeof parsed.value.concepts)[number][] = [];
  let firstViolation: LlmConstraintViolationError | undefined;

  for (const concept of parsed.value.concepts) {
    const textCheck = checkTextConstraints(textConstraints, concept.scenes);
    if (!textCheck.ok) {
      firstViolation ??= new LlmConstraintViolationError(concept.id, textCheck.error.field, textCheck.error.reason);
      continue;
    }

    const roleCounts = new Map<string, number>();
    for (const scene of concept.scenes) {
      roleCounts.set(scene.role, (roleCounts.get(scene.role) ?? 0) + 1);
    }
    const hasExactlyOneOfEachRole = SCENE_ROLES.every((role) => roleCounts.get(role) === 1);
    if (!hasExactlyOneOfEachRole) {
      firstViolation ??= new LlmConstraintViolationError(
        concept.id,
        "scenes",
        `expected exactly one of each role (${SCENE_ROLES.join(", ")}), got: ${concept.scenes.map((s) => s.role).join(", ")}`,
      );
      continue;
    }

    const featureScene = concept.scenes.find((s) => s.role === "feature");
    if (featureScene?.productImageIndex != null && featureScene.productImageIndex >= productCount) {
      firstViolation ??= new LlmConstraintViolationError(
        concept.id,
        "productImageIndex",
        `index ${featureScene.productImageIndex} is out of range for ${productCount} products`,
      );
      continue;
    }

    // Normalized rather than rejected: a highlight that isn't an exact
    // substring, or a productImageIndex on a non-"feature" scene, is the
    // model being slightly sloppy — not a reason to throw away an
    // otherwise-good concept the way an out-of-range index is.
    const normalizedScenes = concept.scenes.map((scene) => ({
      ...scene,
      highlight: scene.highlight !== null && scene.text.includes(scene.highlight) ? scene.highlight : null,
      productImageIndex: scene.role === "feature" ? scene.productImageIndex : null,
    }));

    validConcepts.push({ ...concept, scenes: normalizedScenes });
  }

  if (validConcepts.length === 0) {
    return err(firstViolation ?? new LlmConstraintViolationError("unknown", "concepts", "no concepts returned"));
  }

  return ok({ ...parsed.value, concepts: validConcepts });
}
