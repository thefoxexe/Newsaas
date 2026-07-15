import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TemplateManifestSchema, type TemplateManifest } from "./template-manifest";

export type LoadedTemplate = {
  manifest: TemplateManifest;
  html: string;
  css: string;
  sharedJs: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The scene timeline (0/3500/7000/10500/15000ms) is identical across every
// template, so it lives once as CSS custom properties here instead of being
// duplicated as literal timestamps in each template's style.css. Similarly,
// the kinetic-typography renderer (__reeljoltRenderKineticText) is shared
// JS every template calls instead of duplicating its own text-splitting
// logic — see render-html.ts for where it gets inlined.
const SHARED_CSS_PATH = path.join(__dirname, "../templates/_shared/timeline.css");
const SHARED_JS_PATH = path.join(__dirname, "../templates/_shared/kinetic-text.js");

export async function loadTemplate(templateDir: string): Promise<LoadedTemplate> {
  const [sharedCss, sharedJs, css, html, manifestRaw] = await Promise.all([
    readFile(SHARED_CSS_PATH, "utf-8"),
    readFile(SHARED_JS_PATH, "utf-8"),
    readFile(path.join(templateDir, "style.css"), "utf-8"),
    readFile(path.join(templateDir, "index.html"), "utf-8"),
    readFile(path.join(templateDir, "manifest.json"), "utf-8"),
  ]);

  const manifest = TemplateManifestSchema.parse(JSON.parse(manifestRaw));

  return { manifest, html, css: `${sharedCss}\n${css}`, sharedJs };
}
