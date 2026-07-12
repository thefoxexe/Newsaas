import pino from "pino";

// Bare Error objects don't serialize usefully through pino's default JSON
// output (no message, no stack) — this is what actually surfaced the
// tsx/Playwright __name bug: the first log line was `{"name":"Error"}` with
// nothing else, until this serializer was added.
export function createLogger(name: string) {
  return pino({ name, serializers: { error: pino.stdSerializers.err } });
}
