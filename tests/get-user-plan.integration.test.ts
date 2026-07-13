import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env["DATABASE_URL"];

describe.skipIf(!databaseUrl)("getUserPlan / hasCompletedPlanSelection (real Postgres)", () => {
  it("treats a brand-new user as free and not having completed plan selection", async () => {
    const { db } = await import("../src/db/client");
    const { authUsers } = await import("../src/db/schema");
    const { getUserPlan, hasCompletedPlanSelection } = await import("../src/entitlements/get-user-plan");

    const [user] = await db.insert(authUsers).values({ id: randomUUID() }).returning();
    if (!user) throw new Error("failed to create test user");

    expect(await getUserPlan(db, user.id)).toBe("free");
    expect(await hasCompletedPlanSelection(db, user.id)).toBe(false);
  });

  it("satisfies the gate once a user explicitly chooses free", async () => {
    const { db } = await import("../src/db/client");
    const { authUsers, planSelections } = await import("../src/db/schema");
    const { getUserPlan, hasCompletedPlanSelection } = await import("../src/entitlements/get-user-plan");

    const [user] = await db.insert(authUsers).values({ id: randomUUID() }).returning();
    if (!user) throw new Error("failed to create test user");

    await db.insert(planSelections).values({ userId: user.id, plan: "free" });

    expect(await hasCompletedPlanSelection(db, user.id)).toBe(true);
    expect(await getUserPlan(db, user.id)).toBe("free");
  });

  it("reports the real plan and satisfies the gate from a subscriptions row alone", async () => {
    const { db } = await import("../src/db/client");
    const { authUsers, subscriptions } = await import("../src/db/schema");
    const { getUserPlan, hasCompletedPlanSelection } = await import("../src/entitlements/get-user-plan");

    const [user] = await db.insert(authUsers).values({ id: randomUUID() }).returning();
    if (!user) throw new Error("failed to create test user");

    await db.insert(subscriptions).values({
      userId: user.id,
      stripeCustomerId: "cus_test",
      plan: "growth",
      status: "active",
      currentPeriodStart: new Date("2026-01-01T00:00:00Z"),
      currentPeriodEnd: new Date("2026-02-01T00:00:00Z"),
    });

    expect(await hasCompletedPlanSelection(db, user.id)).toBe(true);
    expect(await getUserPlan(db, user.id)).toBe("growth");
  });
});
