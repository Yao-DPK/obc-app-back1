ALTER TABLE "payments" DROP CONSTRAINT "payments_user_id_payment_obligations_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "obligation_id" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_obligation_id_payment_obligations_id_fk" FOREIGN KEY ("obligation_id") REFERENCES "public"."payment_obligations"("id") ON DELETE no action ON UPDATE no action;