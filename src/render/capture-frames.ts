import { chromium } from "playwright";
import { FrameCaptureError } from "./errors.js";

export type CaptureOptions = {
  width: number;
  height: number;
  durationMs: number;
  fps: number;
};

export interface FrameCapturer {
  captureFrames(html: string, options: CaptureOptions): Promise<Buffer[]>;
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

  async captureFrames(html: string, options: CaptureOptions): Promise<Buffer[]> {
    const browser = await chromium.launch(
      this.executablePath === undefined ? {} : { executablePath: this.executablePath },
    );
    try {
      const page = await browser.newPage({
        viewport: { width: options.width, height: options.height },
      });
      await page.setContent(html, { waitUntil: "load" });
      await page.waitForFunction(() => window.__reeljoltReady === true);

      const frameCount = Math.round((options.durationMs / 1000) * options.fps);
      const frames: Buffer[] = [];

      for (let i = 0; i < frameCount; i += 1) {
        const timeMs = Math.round((i * 1000) / options.fps);
        await page.evaluate((ms) => window.__reeljoltSeek?.(ms), timeMs);
        frames.push(await page.screenshot({ type: "png" }));
      }

      return frames;
    } catch (cause) {
      throw new FrameCaptureError(cause);
    } finally {
      await browser.close();
    }
  }
}
