import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadTemplate } from "../src/render/load-template";
import { PlaywrightFrameCapturer } from "../src/render/capture-frames";
import { FfmpegVideoEncoder } from "../src/render/encode-video";
import { renderVideo } from "../src/render/render-video";
import { BrandKitSchema } from "../src/domain/brand-kit";
import { AdConceptSchema } from "../src/domain/ad-concept";

// Needs a real Chromium binary. Skipped automatically when Playwright's
// browser isn't installed for this Node/OS combination (e.g. bare CI images).
const chromiumAvailable = Boolean(process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function readJsonFixture(filePath: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(filePath, "utf-8")) as Record<string, unknown>;
}

async function renderTwice(templateDir: string, brandKit: unknown, concept: unknown, prefix: string) {
  const root = path.join(__dirname, "..");
  const template = await loadTemplate(path.join(root, "src", "templates", templateDir));
  const outDir = await mkdtemp(path.join(tmpdir(), `reeljolt-${prefix}-test-`));

  try {
    const outputs = await Promise.all(
      ["run-a.mp4", "run-b.mp4"].map((name) =>
        renderVideo({
          template,
          brandKit: BrandKitSchema.parse(brandKit),
          concept: AdConceptSchema.parse(concept),
          format: "9:16",
          outputPath: path.join(outDir, name),
          frameCapturer: new PlaywrightFrameCapturer(),
          videoEncoder: new FfmpegVideoEncoder(),
        }),
      ),
    );

    for (const result of outputs) {
      expect(result.ok).toBe(true);
    }

    const [bufferA, bufferB] = await Promise.all([
      readFile(path.join(outDir, "run-a.mp4")),
      readFile(path.join(outDir, "run-b.mp4")),
    ]);

    return {
      hashA: createHash("md5").update(bufferA).digest("hex"),
      hashB: createHash("md5").update(bufferB).digest("hex"),
    };
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
}

describe.skipIf(!chromiumAvailable)("renderVideo (review-wall, real browser + ffmpeg)", () => {
  it("produces a bit-identical MP4 across two runs (services list)", async () => {
    const root = path.join(__dirname, "..");
    const brandKit = await readJsonFixture(path.join(root, "fixtures", "service-brand-kit.sample.json"));
    const concept = await readJsonFixture(path.join(root, "fixtures", "review-wall-concept.sample.json"));

    const { hashA, hashB } = await renderTwice("review-wall", brandKit, concept, "review-wall");
    expect(hashA).toBe(hashB);
  }, 180_000);

  it("degrades to reviewSnippets (still bit-identical) when services is empty", async () => {
    const root = path.join(__dirname, "..");
    const rawBrandKit = await readJsonFixture(path.join(root, "fixtures", "service-brand-kit.sample.json"));
    const brandKit = { ...rawBrandKit, services: [] };
    const concept = await readJsonFixture(path.join(root, "fixtures", "review-wall-concept.sample.json"));

    const { hashA, hashB } = await renderTwice("review-wall", brandKit, concept, "review-wall-reviews");
    expect(hashA).toBe(hashB);
  }, 180_000);

  it("degrades to plain scene text (still bit-identical) when services and reviewSnippets are both empty", async () => {
    const root = path.join(__dirname, "..");
    const rawBrandKit = await readJsonFixture(path.join(root, "fixtures", "service-brand-kit.sample.json"));
    const brandKit = {
      ...rawBrandKit,
      services: [],
      copy: { ...(rawBrandKit["copy"] as Record<string, unknown>), reviewSnippets: [] },
    };
    const concept = await readJsonFixture(path.join(root, "fixtures", "review-wall-concept.sample.json"));

    const { hashA, hashB } = await renderTwice("review-wall", brandKit, concept, "review-wall-plain");
    expect(hashA).toBe(hashB);
  }, 180_000);
});
