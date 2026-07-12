import { parseArgs } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pino from "pino";
import { BrandKitSchema } from "./domain/brand-kit.js";
import { generateConcepts } from "./generate/generate-concepts.js";
import { AnthropicLlmClient } from "./generate/llm-client.js";
import { loadTemplate } from "./render/load-template.js";

const logger = pino({ name: "reeljolt-generate-cli" });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      brand: { type: "string" },
      out: { type: "string", default: "out/generation.json" },
      template: { type: "string", default: "kinetic-type" },
    },
  });

  if (values.brand === undefined) {
    logger.error("usage: reeljolt generate --brand <file> [--out out/generation.json]");
    process.exitCode = 1;
    return;
  }

  const brandKit = BrandKitSchema.parse(JSON.parse(await readFile(values.brand, "utf-8")));
  const template = await loadTemplate(path.join(__dirname, "templates", values.template));

  const result = await generateConcepts(brandKit, new AnthropicLlmClient(), template.manifest.textConstraints);

  if (!result.ok) {
    logger.error({ error: result.error }, "generation failed");
    process.exitCode = 1;
    return;
  }

  await mkdir(path.dirname(values.out), { recursive: true });
  await writeFile(values.out, JSON.stringify(result.value, null, 2));
  logger.info({ out: values.out, concepts: result.value.concepts.length }, "generation complete");
}

main().catch((error: unknown) => {
  logger.error({ error }, "unexpected failure");
  process.exitCode = 1;
});
