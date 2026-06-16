ALTER TABLE "payment_obligations" ALTER COLUMN "due_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_payment_obligations_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."payment_obligations"("id") ON DELETE no action ON UPDATE no action;