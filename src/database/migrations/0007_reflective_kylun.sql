ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET DEFAULT '0b4b8400-8f71-4cfc-967f-e8ccb45b6ad5';
UPDATE "users" SET "first_name" = 'Inconnu' WHERE "first_name" IS NULL;
UPDATE "users" SET "last_name" = 'Inconnu' WHERE "last_name" IS NULL;
