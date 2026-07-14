export class TemplateValidationError extends Error {
  readonly field: "scene";
  readonly reason: string;

  constructor(field: "scene", reason: string) {
    super(`template validation failed on "${field}": ${reason}`);
    this.name = "TemplateValidationError";
    this.field = field;
    this.reason = reason;
  }
}

export class UnsupportedFormatError extends Error {
  constructor(format: string, templateId: string) {
    super(`template "${templateId}" does not support format "${format}"`);
    this.name = "UnsupportedFormatError";
  }
}

export class FrameCaptureError extends Error {
  constructor(cause: unknown) {
    super(`frame capture failed: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = "FrameCaptureError";
    this.cause = cause;
  }
}

export class VideoEncodeError extends Error {
  readonly exitCode: number | null;
  readonly stderr: string;

  constructor(exitCode: number | null, stderr: string) {
    super(`ffmpeg exited with code ${exitCode ?? "null"}`);
    this.name = "VideoEncodeError";
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}
