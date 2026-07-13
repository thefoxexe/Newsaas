import type { BrandKit } from "../domain/brand-kit";
import type { AdConcept } from "../domain/ad-concept";
import type { Format } from "../domain/format";
import { dimensionsFor } from "../domain/format";
import type { Result } from "../domain/result";
import { ok, err } from "../domain/result";
import type { LoadedTemplate } from "./load-template";
import type { FrameCapturer } from "./capture-frames";
import type { VideoEncoder } from "./encode-video";
import { renderTemplateHtml } from "./render-html";
import { UnsupportedFormatError, type TemplateValidationError } from "./errors";

export type RenderVideoInput = {
  template: LoadedTemplate;
  brandKit: BrandKit;
  concept: AdConcept;
  format: Format;
  outputPath: string;
  frameCapturer: FrameCapturer;
  videoEncoder: VideoEncoder;
  watermark?: boolean;
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

  const html = renderTemplateHtml(input.template, input.brandKit, input.concept, input.watermark ?? false);
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
