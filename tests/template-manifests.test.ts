import { describe, expect, it } from "vitest";
import { TemplateManifestSchema } from "../src/render/template-manifest";
import { SHARED_TEMPLATE_TEXT_CONSTRAINTS } from "../src/domain/text-constraints";
import darkNeonManifestJson from "../src/templates/dark-neon/manifest.json";
import lightGradientManifestJson from "../src/templates/light-gradient/manifest.json";
import colorBlocksManifestJson from "../src/templates/color-blocks/manifest.json";
import editorialManifestJson from "../src/templates/editorial/manifest.json";
import splitDuotoneManifestJson from "../src/templates/split-duotone/manifest.json";
import unboxedManifestJson from "../src/templates/unboxed/manifest.json";
import browserFrameManifestJson from "../src/templates/browser-frame/manifest.json";
import reviewWallManifestJson from "../src/templates/review-wall/manifest.json";

// Manifests are static JSON (see template-registry.ts) so they can't import
// the shared constants directly — this is the guard against silent drift
// that the "all templates share identical constraints" simplification
// (see build-prompt.ts) depends on.
describe("template manifests share identical timing and text constraints", () => {
  const manifests = [
    { name: "dark-neon", json: darkNeonManifestJson },
    { name: "light-gradient", json: lightGradientManifestJson },
    { name: "color-blocks", json: colorBlocksManifestJson },
    { name: "editorial", json: editorialManifestJson },
    { name: "split-duotone", json: splitDuotoneManifestJson },
    { name: "unboxed", json: unboxedManifestJson },
    { name: "browser-frame", json: browserFrameManifestJson },
    { name: "review-wall", json: reviewWallManifestJson },
  ];

  it.each(manifests)("$name matches the shared text constraints", ({ json }) => {
    const manifest = TemplateManifestSchema.parse(json);
    expect(manifest.textConstraints).toEqual(SHARED_TEMPLATE_TEXT_CONSTRAINTS);
  });

  it.each(manifests)("$name matches the shared timing (durationMs/fps/formats)", ({ json }) => {
    const manifest = TemplateManifestSchema.parse(json);
    expect(manifest.durationMs).toBe(15000);
    expect(manifest.fps).toBe(30);
    expect(manifest.formats).toEqual(["9:16", "1:1", "16:9"]);
  });
});
