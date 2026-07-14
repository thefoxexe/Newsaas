import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // The real-browser integration tests each launch up to
    // MAX_CONCURRENT_RENDERS (2, see src/worker.ts) Chromium instances
    // internally — that figure was chosen and verified against the CPU
    // budget an actual render worker has. Running multiple *test files*
    // in parallel on top of that (vitest's default) oversubscribes far
    // beyond what the product itself ever does concurrently in production,
    // which produced render non-determinism that was a test-concurrency
    // artifact, not a real regression (confirmed: the same renders are
    // reliably byte-identical when test files don't run concurrently with
    // each other). File-level sequencing keeps the suite testing the same
    // concurrency ceiling the application actually enforces.
    fileParallelism: false,
  },
});
