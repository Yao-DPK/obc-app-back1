import { boolean, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
  // 👇 NOUVEAUX CHAMPS
  documentTypeIds: jsonb('document_type_ids').$type<number[]>().default([]),
  paymentEventIds: jsonb('payment_event_ids').$type<number[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export type EventInsert = typeof events.$inferInsert;
export type EventSelect = typeof events.$inferSelect;
