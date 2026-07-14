import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { and, eq, lt } from "drizzle-orm";
import { createLogger } from "./logger";
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
import { getUserPlan } from "./entitlements/get-user-plan";
import { PLAN_LIMITS } from "./entitlements/plans";
import { LocalDiskStorage } from "./storage/video-storage";
import { startStaticFileServer } from "./storage/static-file-server";

const logger = createLogger("reeljolt-worker");
const POLL_INTERVAL_MS = 3000;
const TEMPLATES_DIR = path.join(process.cwd(), "src", "templates");
const RENDER_STORAGE_DIR = process.env["RENDER_STORAGE_DIR"] ?? path.join(process.cwd(), "public", "renders");
const RENDER_URL_PREFIX = "/renders";

// A real render (180 frames on the kinetic-type template) measures ~20-30s
// end to end locally. 3 minutes is generous headroom for a slower host
// without leaving a hung render silent forever — this is what turns a
// stuck "Rendering..." into an explicit "failed" the UI can show.
const RENDER_TIMEOUT_MS = 3 * 60 * 1000;

// Jobs stuck in an in-progress state (extraction or rendering) this long
// are treated as orphaned: the only realistic cause is the worker process
// that owned them crashing or being restarted mid-job (e.g. the SIGTERM
// restart loop this host is prone to), since a live worker would otherwise
// have already resolved them via the timeout above or a normal
// success/failure path. "queued"/"pending" are deliberately excluded here —
// sitting unclaimed while the worker is asleep or briefly down is normal
// and self-resolves the moment the worker polls again, not a stuck state.
const STALE_JOB_THRESHOLD_MS = 15 * 60 * 1000;
const STALE_SWEEP_INTERVAL_MS = 2 * 60 * 1000;

// Measured peak RSS for one render (headless-shell Chromium + ffmpeg) is
// ~460MB; 2 at once is ~920MB, comfortably under the 2GB host this worker
// now runs on while leaving headroom for Node/Postgres/OS overhead and the
// occasional concurrent extraction (a separate, sequential path below,
// using full Chromium at ~800MB). Deliberately conservative rather than
// maxing out the box: a second OOM crash after a paid upgrade would be
// worse than leaving some throughput on the table.
const MAX_CONCURRENT_RENDERS = 2;

const storage = new LocalDiskStorage(
  RENDER_STORAGE_DIR,
  process.env["RENDER_PUBLIC_BASE_URL"] ?? RENDER_URL_PREFIX,
);

// On a shared-disk local dev setup, Next.js already serves public/renders
// statically — nothing extra to do. On a real deployment the worker runs on
// its own host with no shared disk, so it must serve its own render output;
// Railway (and most container hosts) inject PORT for exactly this purpose.
if (process.env["PORT"]) {
  const port = Number(process.env["PORT"]);
  startStaticFileServer(RENDER_STORAGE_DIR, RENDER_URL_PREFIX, port);
  logger.info({ port }, "serving rendered videos over HTTP");
}

class RenderTimeoutError extends Error {
  constructor(ms: number) {
    super(`render timed out after ${ms}ms`);
    this.name = "RenderTimeoutError";
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new RenderTimeoutError(ms)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: Error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

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

  // Catches both the typed Result errors below and anything unexpected
  // (a bug, a Playwright crash) — without this, an unanticipated throw would
  // leave the brand stuck in "extracting" forever instead of failing loudly.
  let result;
  try {
    result = await extractBrandKit(brand.sourceUrl, new PlaywrightPageAnalyzer());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(brands).set({ status: "failed", errorCode: message }).where(eq(brands.id, brand.id));
    logger.error({ brandId: brand.id, error: message }, "extraction crashed unexpectedly");
    return;
  }

  if (!result.ok) {
    await db.update(brands).set({ status: "failed", errorCode: result.error.message }).where(eq(brands.id, brand.id));
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

// Only writes to the DB when the rounded percentage actually changes
// (roughly once per frame at 30fps/180 frames, ~100 writes max per render)
// instead of on every one of the frames captured. Fire-and-forget: a missed
// or out-of-order progress update is harmless, unlike blocking the capture
// loop on a DB round trip for every single frame.
function makeProgressReporter(renderId: string): (framesDone: number, frameCount: number) => void {
  let lastPercent = -1;
  return (framesDone, frameCount) => {
    const percent = Math.floor((framesDone / frameCount) * 100);
    if (percent === lastPercent) return;
    lastPercent = percent;
    db.update(renders)
      .set({ progress: percent })
      .where(eq(renders.id, renderId))
      .catch((error: unknown) => {
        logger.error({ renderId, error }, "failed to persist render progress");
      });
  };
}

async function processRender(render: {
  id: string;
  userId: string;
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
    const plan = await getUserPlan(db, render.userId);

    try {
      const result = await withTimeout(
        renderVideo({
          template,
          brandKit,
          concept: adConcept,
          format: render.format,
          outputPath: localPath,
          frameCapturer: new PlaywrightFrameCapturer(),
          videoEncoder: new FfmpegVideoEncoder(),
          watermark: PLAN_LIMITS[plan].watermark,
          onProgress: makeProgressReporter(render.id),
        }),
        RENDER_TIMEOUT_MS,
      );

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

async function sweepStaleJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_JOB_THRESHOLD_MS);

  const staleRenders = await db
    .select()
    .from(renders)
    .where(and(eq(renders.status, "rendering"), lt(renders.createdAt, cutoff)));

  for (const render of staleRenders) {
    await db
      .update(renders)
      .set({ status: "failed", errorCode: "orphaned: worker restarted mid-render" })
      .where(eq(renders.id, render.id));

    if (render.usageId) {
      await refundRenderCredit(db, render.usageId);
    }

    logger.error({ renderId: render.id }, "render orphaned by a worker restart, marked failed and refunded");
  }

  const staleBrands = await db
    .select()
    .from(brands)
    .where(and(eq(brands.status, "extracting"), lt(brands.createdAt, cutoff)));

  for (const brand of staleBrands) {
    await db
      .update(brands)
      .set({ status: "failed", errorCode: "orphaned: worker restarted mid-extraction" })
      .where(eq(brands.id, brand.id));

    logger.error({ brandId: brand.id }, "extraction orphaned by a worker restart, marked failed");
  }
}

async function tick(activeRenders: Set<Promise<void>>): Promise<void> {
  // Extraction stays sequential (one at a time, blocking) — it uses full
  // Chromium rather than the lighter headless-shell build (see
  // analyze-page.ts), so it isn't part of the render concurrency budget above.
  const brand = await claimOnePendingBrand();
  if (brand) {
    await processExtraction(brand);
  }

  while (activeRenders.size < MAX_CONCURRENT_RENDERS) {
    const render = await claimOneQueuedRender();
    if (!render) break;

    const job = processRender(render);
    activeRenders.add(job);
    void job.finally(() => activeRenders.delete(job));
  }
}

async function main(): Promise<void> {
  logger.info(
    "reeljolt worker started, polling every %dms, up to %d renders at once",
    POLL_INTERVAL_MS,
    MAX_CONCURRENT_RENDERS,
  );

  let lastSweepAt = 0;
  const activeRenders = new Set<Promise<void>>();

  for (;;) {
    try {
      if (Date.now() - lastSweepAt >= STALE_SWEEP_INTERVAL_MS) {
        await sweepStaleJobs();
        lastSweepAt = Date.now();
      }
      await tick(activeRenders);
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
