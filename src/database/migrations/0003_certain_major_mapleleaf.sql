UPDATE "users" SET "first_name" = 'Inconnu' WHERE "first_name" IS NULL;
UPDATE "users" SET "last_name" = 'Inconnu' WHERE "last_name" IS NULL;
ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;