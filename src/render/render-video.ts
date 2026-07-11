import type { BrandKit } from "../domain/brand-kit.js";
import type { AdConcept } from "../domain/ad-concept.js";
import type { Format } from "../domain/format.js";
import { dimensionsFor } from "../domain/format.js";
import type { Result } from "../domain/result.js";
import { ok, err } from "../domain/result.js";
import type { LoadedTemplate } from "./load-template.js";
import type { FrameCapturer } from "./capture-frames.js";
import type { VideoEncoder } from "./encode-video.js";
import { renderTemplateHtml } from "./render-html.js";
import { UnsupportedFormatError, type TemplateValidationError } from "./errors.js";

export type RenderVideoInput = {
  template: LoadedTemplate;
  brandKit: BrandKit;
  concept: AdConcept;
  format: Format;
  outputPath: string;
  frameCapturer: FrameCapturer;
  videoEncoder: VideoEncoder;
};

export type RenderVideoOutput = {
  outputPath: string;
  frameCount: number;
};

export async function renderVideo(
  input: RenderVideoInput,
): Promise<Result<RenderVideoOutput, TemplateValidationError | UnsupportedFormatError>> {
  if (!input.template.manifest.formats.includes(input.format)) {
    return err(new UnsupportedFormatError(input.format, input.template.manifest.id));
  }

  const html = renderTemplateHtml(input.template, input.brandKit, input.concept);
  if (!html.ok) {
    return html;
  }

  const { width, height } = dimensionsFor(input.format);
  const { durationMs, fps } = input.template.manifest;

  const frames = await input.frameCapturer.captureFrames(html.value, {
    width,
    height,
    durationMs,
    fps,
  });

  await input.videoEncoder.encode(frames, { fps, outputPath: input.outputPath });

  return ok({ outputPath: input.outputPath, frameCount: frames.length });
}
