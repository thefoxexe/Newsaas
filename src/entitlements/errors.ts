export class QuotaError extends Error {
  readonly code: "credits_exhausted" | "subscription_inactive";

  constructor(code: "credits_exhausted" | "subscription_inactive", message: string) {
    super(message);
    this.name = "QuotaError";
    this.code = code;
  }
}
