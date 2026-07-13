import path from "node:path";
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { FrameCaptureError } from "./errors";

export type CaptureOptions = {
  width: number;
  height: number;
  durationMs: number;
  fps: number;
};

export interface FrameCapturer {
  // Writes frame-00000.png, frame-00001.png, ... directly into frameDir and
  // returns the frame count. Streaming to disk one frame at a time (instead
  // of returning every frame as an in-memory Buffer[]) is deliberate: a
  // typical render is 180 frames, and holding all of them in memory at once
  // alongside a live Chromium instance is exactly the kind of thing that
  // exhausts RAM on a constrained host (512MB free-tier containers included)
  // — the previous version did this, and rendering died silently (OOM-killed
  // mid-render, no application-level error) once actually deployed to one.
  captureFrames(html: string, options: CaptureOptions, frameDir: string): Promise<number>;
}

declare global {
  interface Window {
    __reeljoltReady?: boolean;
    __reeljoltSeek?: (ms: number) => void;
  }
}

export class PlaywrightFrameCapturer implements FrameCapturer {
  private readonly executablePath: string | undefined;

  constructor(executablePath = process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"]) {
    this.executablePath = executablePath;
  }

  async captureFrames(html: string, options: CaptureOptions, frameDir: string): Promise<number> {
    const browser = await chromium.launch({
      // The "headless shell" build strips the parts of Chromium only needed
      // for a real browser window (full UI, extensions, devtools chrome) —
      // Playwright installs it side-by-side with regular Chromium by
      // default, and it measured at roughly half the combined RSS of a full
      // Chromium instance for this same render (~800MB -> ~460MB), which is
      // the difference between fitting in a 512MB container or not.
      // executablePath (set locally for sandbox-specific browser paths)
      // takes priority when present; channel is what production actually
      // uses.
      ...(this.executablePath === undefined
        ? { channel: "chromium-headless-shell" }
        : { executablePath: this.executablePath }),
      // --disable-dev-shm-usage: most containers (Docker/Render/etc.) mount
      // /dev/shm far smaller than a real host, which is the single most
      // common cause of Chromium instability/crashes in containers —
      // this makes it use /tmp instead. --disable-gpu: no real GPU exists
      // in these containers anyway, and forcing software rendering removes
      // one more source of the GPU-dependent sub-pixel variance already
      // documented as a determinism risk in this codebase — a plausible net
      // win for reproducibility, not just memory.
      args: ["--disable-dev-shm-usage", "--disable-gpu"],
    });
    try {
      const page = await browser.newPage({
        viewport: { width: options.width, height: options.height },
      });
      await page.setContent(html, { waitUntil: "load" });
      await page.waitForFunction(() => window.__reeljoltReady === true);

      const frameCount = Math.round((options.durationMs / 1000) * options.fps);

      for (let i = 0; i < frameCount; i += 1) {
        const timeMs = Math.round((i * 1000) / options.fps);
        await page.evaluate((ms) => window.__reeljoltSeek?.(ms), timeMs);
        const frame = await page.screenshot({ type: "png" });
        await writeFile(path.join(frameDir, `frame-${String(i).padStart(5, "0")}.png`), frame);
      }

      return frameCount;
    } catch (cause) {
      throw new FrameCaptureError(cause);
    } finally {
      await browser.close();
    }
  }
}
