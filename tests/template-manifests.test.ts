import { describe, expect, it } from "vitest";
import { TemplateManifestSchema } from "../src/render/template-manifest";
import { SHARED_TEMPLATE_TEXT_CONSTRAINTS } from "../src/domain/text-constraints";
import kineticTypeManifestJson from "../src/templates/kinetic-type/manifest.json";
import productRevealManifestJson from "../src/templates/product-reveal/manifest.json";
import reviewSlamManifestJson from "../src/templates/review-slam/manifest.json";

// Manifests are static JSON (see template-registry.ts) so they can't import
// the shared constants directly — this is the guard against silent drift
// that the "all templates share identical constraints" simplification
// (see build-prompt.ts) depends on.
describe("template manifests share identical timing and text constraints", () => {
  const manifests = [
    { name: "kinetic-type", json: kineticTypeManifestJson },
    { name: "product-reveal", json: productRevealManifestJson },
    { name: "review-slam", json: reviewSlamManifestJson },
  ];

  it.each(manifests)("$name matches the shared text constraints", ({ json }) => {
    const manifest = TemplateManifestSchema.parse(json);
    expect(manifest.textConstraints).toEqual(SHARED_TEMPLATE_TEXT_CONSTRAINTS);
  });

  it.each(manifests)("$name matches the shared timing (durationMs/fps/formats)", ({ json }) => {
    const manifest = TemplateManifestSchema.parse(json);
    expect(manifest.durationMs).toBe(6000);
    expect(manifest.fps).toBe(30);
    expect(manifest.formats).toEqual(["9:16", "1:1", "16:9"]);
  });
});
