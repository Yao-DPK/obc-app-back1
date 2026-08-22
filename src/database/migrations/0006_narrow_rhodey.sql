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
ALTER TABLE "payment_obligations" DROP CONSTRAINT IF EXISTS "payment_obligations_player_id_players_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "first_name" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "payment_obligations" ALTER COLUMN "due_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "payment_obligations" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET DEFAULT gen_random_uuid();
