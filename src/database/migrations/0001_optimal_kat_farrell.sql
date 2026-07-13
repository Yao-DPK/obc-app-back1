ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "guardian_relationships" ALTER COLUMN "status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "guardian_relationships" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "confirmation_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_confirmation_token_unique" UNIQUE("confirmation_token");