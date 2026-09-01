ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET DEFAULT 'e98f21e8-b0a0-4b90-9657-b26e10e4af7f';--> statement-breakpoint
ALTER TABLE "payment_events" ADD COLUMN "is_recurring_monthly" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_events" ADD COLUMN "is_applicable_at_registration" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_events" ADD COLUMN "excluded_months" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_obligations" ADD COLUMN "period_key" varchar(50);--> statement-breakpoint
CREATE UNIQUE INDEX "pay_oblig_period_unique" ON "payment_obligations" USING btree ("player_id","event_id","period_key");