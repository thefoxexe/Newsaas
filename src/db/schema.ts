import { pgTable, pgSchema, uuid, text, timestamp, jsonb, integer, boolean, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";

// "kinetic-type"/"product-reveal"/"split-claim"/"review-slam"/"price-drop"
// are retired (superseded by the 4-scene templates below) but stay listed
// here — Postgres enums can't cleanly drop values, so the old members just
// sit unused rather than being removed.
export const templateIdEnum = pgEnum("template_id", [
  "kinetic-type",
  "product-reveal",
  "split-claim",
  "review-slam",
  "price-drop",
  "dark-neon",
  "light-gradient",
  "color-blocks",
  "editorial",
  "split-duotone",
  "unboxed",
  "browser-frame",
  "review-wall",
]);

export const formatEnum = pgEnum("format", ["9:16", "1:1", "16:9"]);
export const renderStatusEnum = pgEnum("render_status", ["queued", "rendering", "done", "failed"]);
export const extractionStatusEnum = pgEnum("extraction_status", ["pending", "extracting", "done", "failed"]);
export const planEnum = pgEnum("plan", ["free", "starter", "growth", "scale"]);

// Identity lives entirely in Supabase Auth now (auth.users), not a table we
// own. This is a minimal external reference — just enough to build FK
// constraints against it — not a table Drizzle manages the shape of.
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nullable: the free DA analysis works without an account (spec §8). The
    // row is attached to a user once they sign up to keep the result.
    userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sourceUrl: text("source_url").notNull(),
    status: extractionStatusEnum("status").notNull().default("pending"),
    brandKit: jsonb("brand_kit"),
    errorCode: text("error_code"),
    // False for a brand that only ran through extraction (anonymous hero
    // analysis, or "Add business") but was never confirmed in the review
    // form — it doesn't count against the plan's maxBrands and never shows
    // up in the Brands list until the user explicitly saves it.
    saved: boolean("saved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("brands_user_id_idx").on(table.userId)],
);

export const concepts = pgTable(
  "concepts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    angle: text("angle").notNull(),
    // Fixed 4-scene sequence (hook/proof/feature/cta — see
    // src/domain/ad-concept.ts) replacing the old flat hook/body/cta
    // columns: each scene is its own short beat instead of one continuous
    // composition, which is what actually fills the full render duration
    // with movement instead of a long static hold.
    scenes: jsonb("scenes")
      .notNull()
      .$type<Array<{ role: string; text: string; highlight: string | null; productImageIndex: number | null }>>(),
    templateId: templateIdEnum("template_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("concepts_brand_id_idx").on(table.brandId)],
);

export const renders = pgTable(
  "renders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
    templateId: templateIdEnum("template_id").notNull(),
    format: formatEnum("format").notNull(),
    status: renderStatusEnum("status").notNull().default("queued"),
    outputUrl: text("output_url"),
    durationMs: integer("duration_ms"),
    // 0-100, updated as frames are captured (see capture-frames.ts) so the UI
    // can show a moving percentage instead of an indefinite spinner.
    progress: integer("progress").notNull().default(0),
    errorCode: text("error_code"),
    usageId: uuid("usage_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("renders_user_id_idx").on(table.userId)],
);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: planEnum("plan").notNull().default("free"),
  status: text("status").notNull(),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
});

export const usage = pgTable(
  "usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    creditsUsed: integer("credits_used").notNull().default(0),
  },
  (table) => [uniqueIndex("usage_user_period_unique").on(table.userId, table.periodStart, table.periodEnd)],
);

// Primary key is the Stripe event id itself: an already-processed row means
// the webhook is a replay, so the handler can no-op instead of double-crediting.
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

// Marks that a user has been through the mandatory onboarding plan picker —
// nothing more. This is deliberately separate from `subscriptions`, which
// stays Stripe-webhook-only (see handle-webhook.ts): a user who explicitly
// picks the free tier never gets a real Stripe subscription, so there'd be
// no other row anywhere recording that they've completed this step.
export const planSelections = pgTable("plan_selections", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  plan: planEnum("plan").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
