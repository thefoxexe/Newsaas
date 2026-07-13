import type { BrandKit } from "../domain/brand-kit";
import type { AdConcept } from "../domain/ad-concept";
import type { Result } from "../domain/result";
import { ok, err } from "../domain/result";
import { checkTextConstraints } from "../domain/text-constraints";
import { deriveBrandName } from "../domain/brand-name";
import { TemplateValidationError } from "./errors";
import type { LoadedTemplate } from "./load-template";

type TemplateData = {
  colors: { primary: string; background: string; text: string };
  typography: { headingFamily: string; bodyFamily: string; fallbackStack: string };
  brandName: string;
  logoUrl: string | null;
  angle: string;
  hook: string;
  body: string[];
  cta: string;
};

export function renderTemplateHtml(
  template: LoadedTemplate,
  brandKit: BrandKit,
  concept: AdConcept,
  watermark = false,
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
    brandName: deriveBrandName(brandKit.sourceUrl),
    logoUrl: brandKit.logo?.url ?? null,
    angle: concept.angle,
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

  const withData = withInlineStyles.replace("__REELJOLT_DATA__", dataJson);

  // Flat solid background, plain text, fixed position, modest (non-circular)
  // border-radius — matching the safe-for-determinism patterns established
  // for this renderer (see docs/SPEC_REVIEW.md): fully rounded/pill shapes
  // sit closer to the documented risky family (GPU-dependent sub-pixel
  // anti-aliasing at the curve under load) than a plain rounded rectangle.
  // z-index: 999 because the template's full-screen CTA card beat sits at
  // z-index: 10 — without going higher, the watermark would be covered
  // during that beat despite being later in the DOM.
  const finalHtml = watermark
    ? withData.replace(
        "</body>",
        `<div style="position:fixed;z-index:999;bottom:20px;right:20px;padding:8px 16px;border-radius:8px;background:#000000;color:#ffffff;font-family:system-ui,sans-serif;font-size:16px;font-weight:700;">Made with ReelJolt</div></body>`,
      )
    : withData;

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
