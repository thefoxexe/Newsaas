import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { eq } from "drizzle-orm";
import pino from "pino";
import { db } from "./db/client";
import { brands, concepts, renders } from "./db/schema";
import { BrandKitSchema } from "./domain/brand-kit";
import { AdConceptSchema } from "./domain/ad-concept";
import { extractBrandKit } from "./extract/extract-brand-kit";
import { PlaywrightPageAnalyzer } from "./extract/analyze-page";
import { loadTemplate } from "./render/load-template";
import { PlaywrightFrameCapturer } from "./render/capture-frames";
import { FfmpegVideoEncoder } from "./render/encode-video";
import { renderVideo } from "./render/render-video";
import { refundRenderCredit } from "./entitlements/reserve-credit";
import { LocalDiskStorage } from "./storage/video-storage";

const logger = pino({ name: "reeljolt-worker" });
const POLL_INTERVAL_MS = 3000;
const TEMPLATES_DIR = path.join(process.cwd(), "src", "templates");

const storage = new LocalDiskStorage(
  process.env["RENDER_STORAGE_DIR"] ?? path.join(process.cwd(), "public", "renders"),
  process.env["RENDER_PUBLIC_BASE_URL"] ?? "/renders",
);

async function claimOnePendingBrand() {
  return db.transaction(async (tx) => {
    const [brand] = await tx
      .select()
      .from(brands)
      .where(eq(brands.status, "pending"))
      .limit(1)
      .for("update", { skipLocked: true });

    if (!brand) return null;

    await tx.update(brands).set({ status: "extracting" }).where(eq(brands.id, brand.id));
    return brand;
  });
}

async function processExtraction(brand: { id: string; sourceUrl: string }): Promise<void> {
  logger.info({ brandId: brand.id, url: brand.sourceUrl }, "extraction started");

  const result = await extractBrandKit(brand.sourceUrl, new PlaywrightPageAnalyzer());

  if (!result.ok) {
    await db.update(brands).set({ status: "failed", errorCode: result.error.name }).where(eq(brands.id, brand.id));
    logger.error({ brandId: brand.id, error: result.error.message }, "extraction failed");
    return;
  }

  await db.update(brands).set({ status: "done", brandKit: result.value }).where(eq(brands.id, brand.id));
  logger.info({ brandId: brand.id, confidence: result.value.colors.confidence }, "extraction complete");
}

async function claimOneQueuedRender() {
  return db.transaction(async (tx) => {
    const [render] = await tx
      .select()
      .from(renders)
      .where(eq(renders.status, "queued"))
      .limit(1)
      .for("update", { skipLocked: true });

    if (!render) return null;

    await tx.update(renders).set({ status: "rendering" }).where(eq(renders.id, render.id));
    return render;
  });
}

async function processRender(render: {
  id: string;
  brandId: string;
  conceptId: string;
  templateId: string;
  format: "9:16" | "1:1" | "16:9";
  usageId: string | null;
}): Promise<void> {
  logger.info({ renderId: render.id }, "render started");
  const startedAt = Date.now();

  try {
    const [brand] = await db.select().from(brands).where(eq(brands.id, render.brandId));
    const [concept] = await db.select().from(concepts).where(eq(concepts.id, render.conceptId));

    if (!brand?.brandKit || !concept) {
      throw new Error(`render ${render.id} is missing its brand or concept`);
    }

    const brandKit = BrandKitSchema.parse(brand.brandKit);
    const adConcept = AdConceptSchema.parse({
      id: concept.id,
      angle: concept.angle,
      hook: concept.hook,
      body: concept.body,
      cta: concept.cta,
      recommendedTemplate: concept.templateId,
      productImageIndex: null,
    });

    const template = await loadTemplate(path.join(TEMPLATES_DIR, render.templateId));
    const workDir = await mkdtemp(path.join(tmpdir(), "reeljolt-render-"));
    const localPath = path.join(workDir, `${render.id}.mp4`);

    try {
      const result = await renderVideo({
        template,
        brandKit,
        concept: adConcept,
        format: render.format,
        outputPath: localPath,
        frameCapturer: new PlaywrightFrameCapturer(),
        videoEncoder: new FfmpegVideoEncoder(),
      });

      if (!result.ok) {
        throw result.error;
      }

      const outputUrl = await storage.upload(localPath, `${render.id}.mp4`);

      await db
        .update(renders)
        .set({ status: "done", outputUrl, durationMs: Date.now() - startedAt })
        .where(eq(renders.id, render.id));

      logger.info({ renderId: render.id, outputUrl }, "render complete");
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(renders).set({ status: "failed", errorCode: message }).where(eq(renders.id, render.id));

    if (render.usageId) {
      await refundRenderCredit(db, render.usageId);
    }

    logger.error({ renderId: render.id, error: message }, "render failed, credit refunded");
  }
}

async function tick(): Promise<void> {
  const brand = await claimOnePendingBrand();
  if (brand) {
    await processExtraction(brand);
  }

  const render = await claimOneQueuedRender();
  if (render) {
    await processRender(render);
  }
}

async function main(): Promise<void> {
  logger.info("reeljolt worker started, polling every %dms", POLL_INTERVAL_MS);

  for (;;) {
    try {
      await tick();
    } catch (error) {
      logger.error({ error }, "worker tick failed unexpectedly");
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main().catch((error: unknown) => {
  logger.error({ error }, "worker crashed");
  process.exitCode = 1;
});
