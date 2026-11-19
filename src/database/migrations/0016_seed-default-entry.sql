INSERT INTO "document_types" ("name", "isPhoto", "description", "is_obligatory", "applicable_categories", "is_active")
VALUES ('Signature Attestation', FALSE, '', FALSE, '{}', FALSE)
ON CONFLICT ("name") DO NOTHING;
