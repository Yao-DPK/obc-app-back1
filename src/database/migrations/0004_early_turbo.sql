ALTER TABLE "users" ADD COLUMN "attestation_data" jsonb;--> statement-breakpoint
ALTER TABLE "guardian_relationships" ADD COLUMN "relationship" varchar(30) DEFAULT 'Mère' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "status";