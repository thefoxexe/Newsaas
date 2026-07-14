import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadTemplate } from "../src/render/load-template";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.join(__dirname, "..", "src", "templates", "dark-neon");

describe("loadTemplate", () => {
  it("loads and validates the dark-neon manifest", async () => {
    const template = await loadTemplate(templateDir);

    expect(template.manifest.id).toBe("dark-neon");
    expect(template.manifest.formats).toContain("9:16");
    expect(template.html).toContain("__REELJOLT_DATA__");
    expect(template.css).toContain("@keyframes scene-in");
  });
});
