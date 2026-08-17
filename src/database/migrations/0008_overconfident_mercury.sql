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
ALTER TABLE "payment_obligations" ALTER COLUMN "due_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "payment_obligations" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET DEFAULT '4693a054-19cb-4b3b-80a8-167bec2af59e';

ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET DEFAULT '61b92298-5153-4d33-b5b8-17150e4bda4a';