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

describe.skipIf(!chromiumAvailable)("renderVideo (review-slam, real browser + ffmpeg)", () => {
  it("produces a bit-identical MP4 across two runs of the same input", async () => {
    const root = path.join(__dirname, "..");
    const template = await loadTemplate(path.join(root, "src", "templates", "review-slam"));
    const brandKit = BrandKitSchema.parse(
      JSON.parse(await readFile(path.join(root, "fixtures", "brand-kit.sample.json"), "utf-8")),
    );
    const concept = AdConceptSchema.parse(
      JSON.parse(await readFile(path.join(root, "fixtures", "review-slam-concept.sample.json"), "utf-8")),
    );

    const outDir = await mkdtemp(path.join(tmpdir(), "reeljolt-review-slam-test-"));

    try {
      const outputs = await Promise.all(
        ["run-a.mp4", "run-b.mp4"].map((name) =>
          renderVideo({
            template,
            brandKit,
            concept,
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

      const hashA = createHash("md5").update(bufferA).digest("hex");
      const hashB = createHash("md5").update(bufferB).digest("hex");

      expect(hashA).toBe(hashB);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  }, 60_000);
});
