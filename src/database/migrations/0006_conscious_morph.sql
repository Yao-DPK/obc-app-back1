ALTER TABLE "payment_obligations" DROP CONSTRAINT "payment_obligations_player_id_players_id_fk";
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET DEFAULT 'c766ff3a-5f11-40a3-88f5-adde77e1e312';--> statement-breakpoint
ALTER TABLE "payment_obligations" ADD CONSTRAINT "payment_obligations_player_id_users_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;