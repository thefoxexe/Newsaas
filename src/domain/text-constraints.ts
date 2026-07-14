import type { Result } from "./result";
import { ok, err } from "./result";

export type TextConstraints = {
  scene: { maxChars: number };
};

// Both templates deliberately share identical text constraints (and, per
// each template's manifest.json, identical durationMs/fps/formats) — one
// short punchy line per scene, same budget regardless of which of the 4
// roles it fills or which template ends up rendering it. Manifests are
// static JSON (see template-registry.ts for why) so they can't import this
// directly — tests/template-manifests.test.ts asserts each manifest's
// numbers match this so they can't silently drift.
//
// 40 (copied from the old single "hook" budget when this became a
// per-scene constraint) measured too tight in practice: every one of the 4
// scenes is now a full short sentence rather than just a hook, and real
// generations were routinely losing a whole concept to one scene running
// 1-2 chars over on natural French copy. Bumped to 48 after observing this
// directly against a live model call.
export const SHARED_TEMPLATE_TEXT_CONSTRAINTS: TextConstraints = {
  scene: { maxChars: 48 },
};

export type TextConstraintViolation = {
  field: "scene";
  reason: string;
};

export type SceneText = { role: string; text: string };

export function checkTextConstraints(
  constraints: TextConstraints,
  scenes: SceneText[],
): Result<true, TextConstraintViolation> {
  const tooLong = scenes.find((scene) => scene.text.length > constraints.scene.maxChars);
  if (tooLong !== undefined) {
    return err({
      field: "scene",
      reason: `"${tooLong.text}" (${tooLong.role}) is ${tooLong.text.length} chars, max is ${constraints.scene.maxChars}`,
    });
  }

  return ok(true);
}
