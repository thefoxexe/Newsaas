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

// Known, narrow residual flakiness (roughly 1 in 5-6 runs under real CPU
// load, e.g. two concurrent renders sharing a CPU-constrained host): a
// single captured frame (usually frame 0, but confirmed to occasionally
// land elsewhere too — e.g. frame 82 once during the 6s -> 15s duration
// bump's re-verification) differs by a handful of anti-aliased pixels at
// a real embedded font's glyph edges — root-caused
// to document.fonts.ready resolving once a font finishes *parsing*, not
// once the page has necessarily *repainted* with it, which two Chromium
// processes competing for CPU can occasionally still race. A double
// requestAnimationFrame wait was tried as a fix and made things measurably
// worse (introduced a whole-video mismatch instead of a single-frame one),
// so this is left as a known, accepted gap rather than a broken fix —
// exactly the same category as the logo-image case already documented as
// an accepted limitation in this codebase (extractBrandKit's real network
// fetch is real in production but untested here). It has no visible
// impact on actual output quality (a few sub-pixel AA differences on one
// frame, not a content difference) — same "frames looked fine, only the
// hash differed" character as every other bug this test has ever caught.

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe.skipIf(!chromiumAvailable)("renderVideo (kinetic-type, real browser + ffmpeg)", () => {
  it("produces a bit-identical MP4 across two runs of the same input", async () => {
    const root = path.join(__dirname, "..");
    const template = await loadTemplate(path.join(root, "src", "templates", "kinetic-type"));
    const brandKit = BrandKitSchema.parse(
      JSON.parse(await readFile(path.join(root, "fixtures", "brand-kit.sample.json"), "utf-8")),
    );
    const concept = AdConceptSchema.parse(
      JSON.parse(await readFile(path.join(root, "fixtures", "ad-concept.sample.json"), "utf-8")),
    );

    const outDir = await mkdtemp(path.join(tmpdir(), "reeljolt-test-"));

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
  }, 180_000);

  it("produces a bit-identical MP4 across two runs with the watermark enabled", async () => {
    const root = path.join(__dirname, "..");
    const template = await loadTemplate(path.join(root, "src", "templates", "kinetic-type"));
    const brandKit = BrandKitSchema.parse(
      JSON.parse(await readFile(path.join(root, "fixtures", "brand-kit.sample.json"), "utf-8")),
    );
    const concept = AdConceptSchema.parse(
      JSON.parse(await readFile(path.join(root, "fixtures", "ad-concept.sample.json"), "utf-8")),
    );

    const outDir = await mkdtemp(path.join(tmpdir(), "reeljolt-watermark-test-"));

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
            watermark: true,
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
  }, 180_000);
});
