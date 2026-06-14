CREATE TABLE "payment_obligations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"player_id" integer,
	"amount" numeric(10, 2) NOT NULL,
	"due_date" date NOT NULL,
	"description" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "registration_status" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "registration_status" SET DEFAULT 'pre_inscrit';--> statement-breakpoint
ALTER TABLE "payment_obligations" ADD CONSTRAINT "payment_obligations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_obligations" ADD CONSTRAINT "payment_obligations_player_id_users_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;