import type { BrandKit } from "../domain/brand-kit";
import type { AdConcept } from "../domain/ad-concept";
import type { Result } from "../domain/result";
import { ok, err } from "../domain/result";
import { checkTextConstraints } from "../domain/text-constraints";
import { deriveBrandName } from "../domain/brand-name";
import { matchGoogleFont } from "../extract/match-typography";
import { TemplateValidationError } from "./errors";
import type { LoadedTemplate } from "./load-template";

type TemplateData = {
  colors: { primary: string; secondary: string; background: string; text: string };
  typography: {
    headingFamily: string;
    bodyFamily: string;
    fallbackStack: string;
    headingGoogleFontMatch: string | null;
    bodyGoogleFontMatch: string | null;
  };
  brandName: string;
  logoUrl: string | null;
  // Best-effort site screenshot captured during extraction (see
  // src/extract/analyze-page.ts) — null when it wasn't captured. Only the
  // SaaS-vertical "browser-frame" template uses this; every other template
  // just ignores it.
  screenshotUrl: string | null;
  // Service-vertical "review-wall" template's feature-scene list, degrading
  // to reviewSnippets then to plain scene text when both are empty (see
  // that template's own index.html) — every other template ignores both.
  services: string[];
  reviewSnippets: string[];
  angle: string;
  // Fixed 4-entry sequence (hook/proof/feature/cta) — each scene resolves
  // its own product independently (only ever populated on the "feature"
  // role in practice, but templates just check whether it's non-null
  // rather than special-casing the role name).
  scenes: Array<{
    role: string;
    text: string;
    highlight: string | null;
    product: { title: string; price: string | null; imageUrl: string; description: string | null } | null;
  }>;
};

export function renderTemplateHtml(
  template: LoadedTemplate,
  brandKit: BrandKit,
  concept: AdConcept,
  watermark = false,
  embeddedFontsCss = "",
): Result<string, TemplateValidationError> {
  const validation = validateTextConstraints(template, concept);
  if (!validation.ok) {
    return validation;
  }

  const data: TemplateData = {
    colors: {
      primary: brandKit.colors.primary,
      secondary: brandKit.colors.secondary,
      background: brandKit.colors.background,
      text: brandKit.colors.text,
    },
    typography: {
      headingFamily: brandKit.typography.headingFamily,
      bodyFamily: brandKit.typography.bodyFamily,
      fallbackStack: brandKit.typography.fallbackStack,
      // The stored googleFontMatch only ever matched the heading family
      // (see match-typography.ts) — the body match is computed fresh here,
      // no BrandKit schema change needed for it.
      headingGoogleFontMatch: brandKit.typography.googleFontMatch,
      bodyGoogleFontMatch: matchGoogleFont(brandKit.typography.bodyFamily),
    },
    brandName: deriveBrandName(brandKit.sourceUrl),
    logoUrl: brandKit.logo?.url ?? null,
    screenshotUrl: brandKit.screenshotUrl,
    services: brandKit.services,
    reviewSnippets: brandKit.copy.reviewSnippets,
    angle: concept.angle,
    scenes: concept.scenes.map((scene) => ({
      role: scene.role,
      text: scene.text,
      highlight: scene.highlight,
      product: scene.productImageIndex !== null ? brandKit.products[scene.productImageIndex] ?? null : null,
    })),
  };

  // "</" would close the surrounding <script> tag early if left unescaped.
  const dataJson = JSON.stringify(data).replace(/<\//g, "<\\/");

  // embeddedFontsCss (real, base64-embedded @font-face blocks fetched by the
  // caller — see render-video.ts) goes first so it's declared before the
  // template's own CSS references it via --font-heading/--font-body.
  const withInlineStyles = template.html.replace(
    /<link rel="stylesheet" href="\.\/style\.css" \/>/,
    `<style>${embeddedFontsCss}${template.css}</style>`,
  );

  const withData = withInlineStyles.replace("__REELJOLT_DATA__", dataJson);

  // Inlines the shared kinetic-typography renderer ahead of each template's
  // own data script, which calls window.__reeljoltRenderKineticText instead
  // of duplicating its own text-splitting logic (see
  // src/templates/_shared/kinetic-text.js).
  const withSharedJs = withData.replace("<!-- __REELJOLT_SHARED_JS__ -->", `<script>${template.sharedJs}</script>`);

  // Flat solid background, plain text, fixed position, modest (non-circular)
  // border-radius — matching the safe-for-determinism patterns established
  // for this renderer (see docs/SPEC_REVIEW.md): fully rounded/pill shapes
  // sit closer to the documented risky family (GPU-dependent sub-pixel
  // anti-aliasing at the curve under load) than a plain rounded rectangle.
  // z-index: 999 because the templates' final "cta" scene sits at a lower
  // z-index while covering the full viewport — without going higher, the
  // watermark would be covered during that beat despite being later in
  // the DOM.
  const finalHtml = watermark
    ? withSharedJs.replace(
        "</body>",
        `<div style="position:fixed;z-index:999;bottom:20px;right:20px;padding:8px 16px;border-radius:8px;background:#000000;color:#ffffff;font-family:system-ui,sans-serif;font-size:16px;font-weight:700;">Made with ReelJolt</div></body>`,
      )
    : withSharedJs;

  return ok(finalHtml);
}

function validateTextConstraints(
  template: LoadedTemplate,
  concept: AdConcept,
): Result<true, TemplateValidationError> {
  const violation = checkTextConstraints(template.manifest.textConstraints, concept.scenes);
  if (violation.ok) {
    return ok(true);
  }
  return err(new TemplateValidationError(violation.error.field, violation.error.reason));
}
