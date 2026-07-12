import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";

export const templateIdEnum = pgEnum("template_id", [
  "kinetic-type",
  "product-reveal",
  "split-claim",
  "review-slam",
  "price-drop",
]);

export const formatEnum = pgEnum("format", ["9:16", "1:1", "16:9"]);
export const renderStatusEnum = pgEnum("render_status", ["queued", "rendering", "done", "failed"]);
export const extractionStatusEnum = pgEnum("extraction_status", ["pending", "extracting", "done", "failed"]);
export const planEnum = pgEnum("plan", ["free", "starter", "growth", "scale"]);

// Better Auth owns this table's core fields (id, name, email, emailVerified,
// image, createdAt, updatedAt) via the Drizzle adapter — see src/auth/auth.ts.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nullable: the free DA analysis works without an account (spec §8). The
    // row is attached to a user once they sign up to keep the result.
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sourceUrl: text("source_url").notNull(),
    status: extractionStatusEnum("status").notNull().default("pending"),
    brandKit: jsonb("brand_kit"),
    errorCode: text("error_code"),
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
    hook: text("hook").notNull(),
    body: jsonb("body").notNull().$type<string[]>(),
    cta: text("cta").notNull(),
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
      .references(() => users.id, { onDelete: "cascade" }),
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
    .references(() => users.id, { onDelete: "cascade" }),
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
      .references(() => users.id, { onDelete: "cascade" }),
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
