export class WebhookSignatureError extends Error {
  constructor(cause: unknown) {
    super(`invalid Stripe webhook signature: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = "WebhookSignatureError";
  }
}

export class WebhookParseError extends Error {
  constructor(reason: string) {
    super(`could not map Stripe event to a subscription update: ${reason}`);
    this.name = "WebhookParseError";
  }
}
