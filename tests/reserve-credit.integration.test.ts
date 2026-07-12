import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

// Needs a real Postgres connection string (see .env.example) — get one from
// the Supabase project dashboard under Settings > Database. Not obtainable
// through the Supabase MCP tools, which never expose the DB password.
const databaseUrl = process.env["DATABASE_URL"];

describe.skipIf(!databaseUrl)("reserveRenderCredit / refundRenderCredit (real Postgres)", () => {
  it("decrements once per reservation, serializes concurrent reservations, and refunds correctly", async () => {
    const { db } = await import("../src/db/client");
    const { users, usage } = await import("../src/db/schema");
    const { reserveRenderCredit, refundRenderCredit } = await import("../src/entitlements/reserve-credit");

    const [user] = await db
      .insert(users)
      .values({ email: `quota-test-${randomUUID()}@example.com` })
      .returning();
    if (!user) throw new Error("failed to create test user");

    try {
      const now = new Date("2026-07-15T00:00:00Z");

      const results = await Promise.all([
        reserveRenderCredit(db, user.id, now),
        reserveRenderCredit(db, user.id, now),
        reserveRenderCredit(db, user.id, now),
      ]);

      expect(results.filter((r) => r.ok)).toHaveLength(3);

      const fourth = await reserveRenderCredit(db, user.id, now);
      expect(fourth.ok).toBe(false);
      if (fourth.ok) return;
      expect(fourth.error.code).toBe("credits_exhausted");

      const firstUsageId = results[0]?.ok ? results[0].value.usageId : undefined;
      if (firstUsageId === undefined) throw new Error("expected the first reservation to succeed");

      await refundRenderCredit(db, firstUsageId);

      const afterRefund = await reserveRenderCredit(db, user.id, now);
      expect(afterRefund.ok).toBe(true);

      const [row] = await db.select().from(usage).where(eq(usage.userId, user.id));
      expect(row?.creditsUsed).toBe(3);
    } finally {
      await db.delete(users).where(eq(users.id, user.id));
    }
  }, 30_000);
});
