ALTER TABLE "users" ADD COLUMN "public_url" varchar(500);--> statement-breakpoint
ALTER TABLE "guardian_relationships" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;