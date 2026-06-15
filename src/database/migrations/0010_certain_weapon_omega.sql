ALTER TABLE "payment_obligations" DROP CONSTRAINT "payment_obligations_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_obligations" DROP COLUMN "user_id";