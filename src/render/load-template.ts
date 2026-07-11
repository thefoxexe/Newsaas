import { readFile } from "node:fs/promises";
import path from "node:path";
import { TemplateManifestSchema, type TemplateManifest } from "./template-manifest.js";

export type LoadedTemplate = {
  manifest: TemplateManifest;
  html: string;
  css: string;
};

export async function loadTemplate(templateDir: string): Promise<LoadedTemplate> {
  const [html, css, manifestRaw] = await Promise.all([
    readFile(path.join(templateDir, "index.html"), "utf-8"),
    readFile(path.join(templateDir, "style.css"), "utf-8"),
    readFile(path.join(templateDir, "manifest.json"), "utf-8"),
  ]);

  const manifest = TemplateManifestSchema.parse(JSON.parse(manifestRaw));

  return { manifest, html, css };
}
