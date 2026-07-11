export class ExtractionTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`extraction of "${url}" exceeded the ${timeoutMs}ms budget`);
    this.name = "ExtractionTimeoutError";
  }
}

export class ExtractionNavigationError extends Error {
  constructor(url: string, cause: unknown) {
    super(`could not load "${url}": ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = "ExtractionNavigationError";
    this.cause = cause;
  }
}
