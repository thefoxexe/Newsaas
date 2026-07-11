import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadTemplate } from "../src/render/load-template.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.join(__dirname, "..", "src", "templates", "kinetic-type");

describe("loadTemplate", () => {
  it("loads and validates the kinetic-type manifest", async () => {
    const template = await loadTemplate(templateDir);

    expect(template.manifest.id).toBe("kinetic-type");
    expect(template.manifest.formats).toContain("9:16");
    expect(template.html).toContain("__ADFORGE_DATA__");
    expect(template.css).toContain("@keyframes word-in");
  });
});
