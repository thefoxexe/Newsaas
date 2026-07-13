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
    const { authUsers, subscriptions, usage } = await import("../src/db/schema");
    const { reserveRenderCredit, refundRenderCredit } = await import("../src/entitlements/reserve-credit");

    // Identity lives in Supabase Auth's auth.users, which this test doesn't
    // own — insert the minimal row (id only) our FK needs to be satisfied.
    const [user] = await db.insert(authUsers).values({ id: randomUUID() }).returning();
    if (!user) throw new Error("failed to create test user");

    const now = new Date("2026-07-15T00:00:00Z");

    // A real subscription (not the free default) so this test's headroom —
    // and thus its assertions below — doesn't depend on the exact free-tier
    // credit count, a business rule that changes independently of what this
    // test actually exercises (transactional concurrency + refund). The
    // boundary/exhaustion behavior itself is covered exhaustively by
    // can-generate.test.ts's pure-logic tests.
    await db.insert(subscriptions).values({
      userId: user.id,
      stripeCustomerId: "cus_test",
      plan: "starter",
      status: "active",
      currentPeriodStart: new Date("2026-07-01T00:00:00Z"),
      currentPeriodEnd: new Date("2026-08-01T00:00:00Z"),
    });

    try {
      const results = await Promise.all([
        reserveRenderCredit(db, user.id, now),
        reserveRenderCredit(db, user.id, now),
        reserveRenderCredit(db, user.id, now),
      ]);

      expect(results.filter((r) => r.ok)).toHaveLength(3);

      const firstUsageId = results[0]?.ok ? results[0].value.usageId : undefined;
      if (firstUsageId === undefined) throw new Error("expected the first reservation to succeed");

      await refundRenderCredit(db, firstUsageId);

      const afterRefund = await reserveRenderCredit(db, user.id, now);
      expect(afterRefund.ok).toBe(true);

      const [row] = await db.select().from(usage).where(eq(usage.userId, user.id));
      expect(row?.creditsUsed).toBe(3);
    } finally {
      await db.delete(authUsers).where(eq(authUsers.id, user.id));
    }
  }, 30_000);
});
