ALTER TABLE "brands" ADD COLUMN "saved" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "brands" SET "saved" = true WHERE "user_id" IS NOT NULL;
