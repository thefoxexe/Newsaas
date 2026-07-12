-- Identity moves from our own Better Auth tables to Supabase Auth
-- (auth.users, managed by Supabase itself — not created here).
ALTER TABLE "brands" DROP CONSTRAINT "brands_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "renders" DROP CONSTRAINT "renders_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "usage" DROP CONSTRAINT "usage_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_users_id_fk";--> statement-breakpoint

ALTER TABLE "brands" ADD CONSTRAINT "brands_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renders" ADD CONSTRAINT "renders_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

DROP TABLE "sessions";--> statement-breakpoint
DROP TABLE "accounts";--> statement-breakpoint
DROP TABLE "verifications";--> statement-breakpoint
DROP TABLE "users";
