import type { BrandKit } from "../domain/brand-kit.js";
import type { AdConcept } from "../domain/ad-concept.js";
import type { Result } from "../domain/result.js";
import { ok, err } from "../domain/result.js";
import { checkTextConstraints } from "../domain/text-constraints.js";
import { TemplateValidationError } from "./errors.js";
import type { LoadedTemplate } from "./load-template.js";

type TemplateData = {
  colors: { primary: string; background: string; text: string };
  typography: { headingFamily: string; bodyFamily: string; fallbackStack: string };
  hook: string;
  body: string[];
  cta: string;
};

export function renderTemplateHtml(
  template: LoadedTemplate,
  brandKit: BrandKit,
  concept: AdConcept,
): Result<string, TemplateValidationError> {
  const validation = validateTextConstraints(template, concept);
  if (!validation.ok) {
    return validation;
  }

  const data: TemplateData = {
    colors: {
      primary: brandKit.colors.primary,
      background: brandKit.colors.background,
      text: brandKit.colors.text,
    },
    typography: {
      headingFamily: brandKit.typography.headingFamily,
      bodyFamily: brandKit.typography.bodyFamily,
      fallbackStack: brandKit.typography.fallbackStack,
    },
    hook: concept.hook,
    body: concept.body,
    cta: concept.cta,
  };

  // "</" would close the surrounding <script> tag early if left unescaped.
  const dataJson = JSON.stringify(data).replace(/<\//g, "<\\/");

  const withInlineStyles = template.html.replace(
    /<link rel="stylesheet" href="\.\/style\.css" \/>/,
    `<style>${template.css}</style>`,
  );

  const finalHtml = withInlineStyles.replace("__REELJOLT_DATA__", dataJson);

  return ok(finalHtml);
}

function validateTextConstraints(
  template: LoadedTemplate,
  concept: AdConcept,
): Result<true, TemplateValidationError> {
  const violation = checkTextConstraints(template.manifest.textConstraints, concept);
  if (violation.ok) {
    return ok(true);
  }
  return err(new TemplateValidationError(violation.error.field, violation.error.reason));
}
