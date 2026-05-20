CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" varchar(20) NOT NULL,
	"transaction_reference" varchar(100),
	"reason" varchar(255) NOT NULL,
	"player_ids" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"declared_at" timestamp DEFAULT now() NOT NULL,
	"verified_by" integer,
	"verified_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;