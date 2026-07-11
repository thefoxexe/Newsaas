import type { BrandKit } from "../domain/brand-kit.js";
import type { AdConcept } from "../domain/ad-concept.js";
import type { Result } from "../domain/result.js";
import { ok, err } from "../domain/result.js";
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

  const finalHtml = withInlineStyles.replace("__ADFORGE_DATA__", dataJson);

  return ok(finalHtml);
}

function validateTextConstraints(
  template: LoadedTemplate,
  concept: AdConcept,
): Result<true, TemplateValidationError> {
  const { textConstraints } = template.manifest;

  if (concept.hook.length > textConstraints.hook.maxChars) {
    return err(
      new TemplateValidationError(
        "hook",
        `"${concept.hook}" is ${concept.hook.length} chars, max is ${textConstraints.hook.maxChars}`,
      ),
    );
  }

  if (concept.body.length > textConstraints.body.maxLines) {
    return err(
      new TemplateValidationError(
        "body",
        `${concept.body.length} lines, max is ${textConstraints.body.maxLines}`,
      ),
    );
  }

  const tooLongLine = concept.body.find((line) => line.length > textConstraints.body.maxCharsPerLine);
  if (tooLongLine !== undefined) {
    return err(
      new TemplateValidationError(
        "body",
        `"${tooLongLine}" is longer than ${textConstraints.body.maxCharsPerLine} chars`,
      ),
    );
  }

  if (concept.cta.length > textConstraints.cta.maxChars) {
    return err(
      new TemplateValidationError(
        "cta",
        `"${concept.cta}" is ${concept.cta.length} chars, max is ${textConstraints.cta.maxChars}`,
      ),
    );
  }

  return ok(true);
}
