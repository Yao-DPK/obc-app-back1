import {
  pgTable,
  serial,
  integer,
  varchar,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  type: varchar('type', { length: 50 }).notNull(), // ex: 'certificat_medical', 'paiement_reçu'
  fileId: varchar('file_id', { length: 255 }).notNull(), // Google Drive file ID
  publicUrl: varchar('public_url', { length: 500 }).notNull(),
  documentStatus: varchar('document_status', { length: 50 })
    .default('En attente de Validation')
    .notNull(),
  isObligatory: boolean('is_obligatory').default(false),
  validatedAt: timestamp('validated_at'),
  validatedBy: integer('validated_by')
    .references(() => users.id),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});
