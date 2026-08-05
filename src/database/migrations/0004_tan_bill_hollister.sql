CREATE TYPE "public"."verification_token_type" AS ENUM('email_confirmation', 'password_reset', 'first_login', 'invite');--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "verification_token_type" NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"revoked_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verification_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "payment_obligations" RENAME COLUMN "player_ids" TO "player_id";--> statement-breakpoint
ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "token_hash";--> statement-breakpoint
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_token_unique";--> statement-breakpoint
ALTER TABLE "payment_obligations" DROP CONSTRAINT "payment_obligations_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "pay_oblig_user_idx";--> statement-breakpoint
ALTER TABLE "payment_obligations" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "family_id" varchar(36) DEFAULT '9ffe609e-c618-4cad-b9fb-444165cdb870' NOT NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "replaced_by" integer;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "user_agent" varchar(255);--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "ip_address" varchar(45);--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "revoked_at" timestamp;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_obligations" DROP CONSTRAINT IF EXISTS "payment_obligations_player_id_players_id_fk";

ALTER TABLE "payment_obligations"
    ALTER COLUMN "player_id" TYPE INTEGER 
    USING ("player_id"->>0)::INTEGER;
ALTER TABLE "payment_obligations" ADD CONSTRAINT "payment_obligations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_obligations" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash");