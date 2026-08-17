import {
  pgTable,
  serial,
  integer,
  varchar,
  boolean,
  timestamp,
  text,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  type: varchar('type', { length: 50 }).notNull(), // ex: 'certificat_medical', 'paiement_reçu'
  typeId: integer('type_id')
    .references(() => documentTypes.id, { onDelete: 'set null' }),
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


export type DocumentInsert = typeof documents.$inferInsert;
export type DocumentSelect = typeof documents.$inferSelect;



export const documentTypes = pgTable('document_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isObligatory: boolean('is_obligatory').default(false),
  applicableCategories: varchar('applicable_categories', { length: 255 }).array(),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type DocumentTypeInsert = typeof documentTypes.$inferInsert;
export type DocumentTypeSelect = typeof documentTypes.$inferSelect;