ALTER TYPE "template_id" ADD VALUE IF NOT EXISTS 'dark-neon';
--> statement-breakpoint
ALTER TYPE "template_id" ADD VALUE IF NOT EXISTS 'light-gradient';
--> statement-breakpoint
ALTER TABLE "concepts" ADD COLUMN "scenes" jsonb;
--> statement-breakpoint
UPDATE "concepts" SET "scenes" = '[]'::jsonb WHERE "scenes" IS NULL;
--> statement-breakpoint
ALTER TABLE "concepts" ALTER COLUMN "scenes" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "concepts" DROP COLUMN "hook";
--> statement-breakpoint
ALTER TABLE "concepts" DROP COLUMN "body";
--> statement-breakpoint
ALTER TABLE "concepts" DROP COLUMN "cta";
--> statement-breakpoint
ALTER TABLE "concepts" DROP COLUMN "product_image_index";
