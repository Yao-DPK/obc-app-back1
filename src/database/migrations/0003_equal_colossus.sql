ALTER TABLE "users" ADD COLUMN "first_name" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" varchar(10);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "school" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "class" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emergency_contact_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emergency_contact_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "registration_status" varchar(20) DEFAULT 'pre_inscrit' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "registration_step" varchar(50) DEFAULT 'formulaire';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" varchar(50) DEFAULT 'pre_inscrit' NOT NULL;