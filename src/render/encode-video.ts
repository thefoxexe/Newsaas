import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { VideoEncodeError } from "./errors";

export type EncodeOptions = {
  fps: number;
  outputPath: string;
};

export interface VideoEncoder {
  encode(frames: Buffer[], options: EncodeOptions): Promise<void>;
}

export class FfmpegVideoEncoder implements VideoEncoder {
  private readonly ffmpegBinary: string;

  constructor(ffmpegBinary = process.env["FFMPEG_PATH"] ?? "ffmpeg") {
    this.ffmpegBinary = ffmpegBinary;
  }

  async encode(frames: Buffer[], options: EncodeOptions): Promise<void> {
    await mkdir(path.dirname(options.outputPath), { recursive: true });
    const frameDir = await mkdtemp(path.join(tmpdir(), "reeljolt-frames-"));

    try {
      await Promise.all(
        frames.map((frame, i) =>
          writeFile(path.join(frameDir, `frame-${String(i).padStart(5, "0")}.png`), frame),
        ),
      );

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
    } finally {
      await rm(frameDir, { recursive: true, force: true });
    }
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
