import { parseArgs } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pino from "pino";
import { extractBrandKit } from "./extract/extract-brand-kit.js";
import { PlaywrightPageAnalyzer } from "./extract/analyze-page.js";

const logger = pino({ name: "reeljolt-extract-cli" });

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      url: { type: "string" },
      out: { type: "string", default: "out/brand-kit.json" },
    },
  });

  if (values.url === undefined) {
    logger.error("usage: reeljolt extract --url <https://shop.example.com> [--out out/brand-kit.json]");
    process.exitCode = 1;
    return;
  }

  const result = await extractBrandKit(values.url, new PlaywrightPageAnalyzer());

  if (!result.ok) {
    logger.error({ error: result.error }, "extraction failed");
    process.exitCode = 1;
    return;
  }

  await mkdir(path.dirname(values.out), { recursive: true });
  await writeFile(values.out, JSON.stringify(result.value, null, 2));
  logger.info({ out: values.out, confidence: result.value.colors.confidence }, "extraction complete");
}

main().catch((error: unknown) => {
  logger.error({ error }, "unexpected failure");
  process.exitCode = 1;
});
