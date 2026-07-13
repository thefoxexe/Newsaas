CREATE TABLE "plan_selections" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"plan" "plan" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plan_selections" ADD CONSTRAINT "plan_selections_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
