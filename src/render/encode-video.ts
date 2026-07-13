import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { VideoEncodeError } from "./errors";

export type EncodeOptions = {
  fps: number;
  outputPath: string;
};

export interface VideoEncoder {
  // frameDir must already contain frame-00000.png .. frame-{frameCount-1}.png
  // (written by a FrameCapturer) — encoding no longer takes frames in memory.
  encode(frameDir: string, frameCount: number, options: EncodeOptions): Promise<void>;
}

export class FfmpegVideoEncoder implements VideoEncoder {
  private readonly ffmpegBinary: string;

  constructor(ffmpegBinary = process.env["FFMPEG_PATH"] ?? "ffmpeg") {
    this.ffmpegBinary = ffmpegBinary;
  }

  async encode(frameDir: string, _frameCount: number, options: EncodeOptions): Promise<void> {
    await mkdir(path.dirname(options.outputPath), { recursive: true });

    await this.runFfmpeg([
      "-y",
      "-framerate",
      String(options.fps),
      "-i",
      path.join(frameDir, "frame-%05d.png"),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      // Without this, ffmpeg writes the moov atom (the index a browser
      // needs before it can start decoding) at the end of the file, so
      // playback can't start until that tail has downloaded. Moving it to
      // the front makes the file playable progressively, as web video
      // should be — standard practice, independent of any specific bug.
      "-movflags",
      "+faststart",
      options.outputPath,
    ]);
  }

  private runFfmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.ffmpegBinary, args);
      let stderr = "";
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new VideoEncodeError(code, stderr));
        }
      });
    });
  }
}
