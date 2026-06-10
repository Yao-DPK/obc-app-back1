ALTER TABLE "payments" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "transaction_metadata" jsonb;