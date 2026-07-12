import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pino from "pino";
import { BrandKitSchema } from "./domain/brand-kit";
import { AdConceptSchema } from "./domain/ad-concept";
import { FormatSchema } from "./domain/format";
import { loadTemplate } from "./render/load-template";
import { PlaywrightFrameCapturer } from "./render/capture-frames";
import { FfmpegVideoEncoder } from "./render/encode-video";
import { renderVideo } from "./render/render-video";

const logger = pino({ name: "reeljolt-cli" });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      brand: { type: "string" },
      concept: { type: "string" },
      format: { type: "string", default: "9:16" },
      out: { type: "string", default: "out/ad.mp4" },
      template: { type: "string", default: "kinetic-type" },
    },
  });

  if (values.brand === undefined || values.concept === undefined) {
    logger.error("usage: reeljolt render --brand <file> --concept <file> [--format 9:16] [--out out.mp4]");
    process.exitCode = 1;
    return;
  }

  const brandKit = BrandKitSchema.parse(JSON.parse(await readFile(values.brand, "utf-8")));
  const concept = AdConceptSchema.parse(JSON.parse(await readFile(values.concept, "utf-8")));
  const format = FormatSchema.parse(values.format);

  const template = await loadTemplate(path.join(__dirname, "templates", values.template));

  const result = await renderVideo({
    template,
    brandKit,
    concept,
    format,
    outputPath: values.out,
    frameCapturer: new PlaywrightFrameCapturer(),
    videoEncoder: new FfmpegVideoEncoder(),
  });

  if (!result.ok) {
    logger.error({ error: result.error }, "render failed");
    process.exitCode = 1;
    return;
  }

  logger.info(result.value, "render complete");
}

main().catch((error: unknown) => {
  logger.error({ error }, "unexpected failure");
  process.exitCode = 1;
});
