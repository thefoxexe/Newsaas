import type { Result } from "./result";
import { ok, err } from "./result";

export type TextConstraints = {
  hook: { maxChars: number };
  body: { maxLines: number; maxCharsPerLine: number };
  cta: { maxChars: number };
};

export type TextConstraintViolation = {
  field: "hook" | "body" | "cta";
  reason: string;
};

export type ConceptText = {
  hook: string;
  body: string[];
  cta: string;
};

export function checkTextConstraints(
  constraints: TextConstraints,
  concept: ConceptText,
): Result<true, TextConstraintViolation> {
  if (concept.hook.length > constraints.hook.maxChars) {
    return err({
      field: "hook",
      reason: `"${concept.hook}" is ${concept.hook.length} chars, max is ${constraints.hook.maxChars}`,
    });
  }

  if (concept.body.length > constraints.body.maxLines) {
    return err({
      field: "body",
      reason: `${concept.body.length} lines, max is ${constraints.body.maxLines}`,
    });
  }

  const tooLongLine = concept.body.find((line) => line.length > constraints.body.maxCharsPerLine);
  if (tooLongLine !== undefined) {
    return err({
      field: "body",
      reason: `"${tooLongLine}" is longer than ${constraints.body.maxCharsPerLine} chars`,
    });
  }

  if (concept.cta.length > constraints.cta.maxChars) {
    return err({
      field: "cta",
      reason: `"${concept.cta}" is ${concept.cta.length} chars, max is ${constraints.cta.maxChars}`,
    });
  }

  return ok(true);
}
