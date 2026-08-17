CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true,
	"document_type_ids" jsonb DEFAULT '[]'::jsonb,
	"payment_event_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET DEFAULT '5dd9fb33-9870-4597-9196-e27ca6714c11';
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET DEFAULT '0b4b8400-8f71-4cfc-967f-e8ccb45b6ad5';
UPDATE "users" SET "first_name" = 'Inconnu' WHERE "first_name" IS NULL;
UPDATE "users" SET "last_name" = 'Inconnu' WHERE "last_name" IS NULL;
