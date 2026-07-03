ALTER TABLE "guardian_relationships" ADD COLUMN "confirmation_token" varchar(255);--> statement-breakpoint
ALTER TABLE "guardian_relationships" ADD COLUMN "token_expires_at" timestamp;