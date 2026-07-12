import { TemplateManifestSchema, type TemplateManifest } from "./template-manifest";
import kineticTypeManifestJson from "../templates/kinetic-type/manifest.json";

// Bundled as static JSON (not read from disk at runtime) specifically so
// this is safe to import from a Next.js API route running on a serverless
// function, where arbitrary fs reads of repo files aren't guaranteed to be
// packaged into the deployment — unlike the CLI/worker, which load
// templates straight off disk (see render/load-template.ts).
const MANIFESTS: Record<string, TemplateManifest> = {
  "kinetic-type": TemplateManifestSchema.parse(kineticTypeManifestJson),
};

export function getTemplateManifest(templateId: string): TemplateManifest {
  const manifest = MANIFESTS[templateId];
  if (manifest === undefined) {
    throw new Error(`unknown template "${templateId}"`);
  }
  return manifest;
}
