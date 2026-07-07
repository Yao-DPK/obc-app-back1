import {
  pgTable,
  serial,
  integer,
  decimal,
  varchar,
  jsonb,
  timestamp,
  boolean,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { KayDevMetadata } from '../../types/payment.types';



/* Stocke les types de paiements */
export const paymentEvents = pgTable('payment_events', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 500 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  allowInstallments: boolean('allow_installments').default(false),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type EventInsert = typeof paymentEvents.$inferInsert;
export type EventSelect = typeof paymentEvents.$inferSelect;

/* Stocke les transactions déclenchés */
export const paymentIntents = pgTable('payment_intents', {
  id: serial('id').primaryKey(),
  obligationId: integer('obligation_id')
    .references(() => paymentObligations.id)
    .notNull(), // lien vers l'obligation correspondante
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  method: varchar('method', { length: 20 }).notNull(), // wave, orange_money, card
  transactionReference: varchar('transaction_reference', { length: 100 }),
  transactionMetadata: jsonb('transaction_metadata').$type<KayDevMetadata>(),
  status: varchar('status', { length: 20 })
    .default('pending')
    .notNull(), // pending, paid, failed, expired
  declaredAt: timestamp('declared_at').defaultNow().notNull(),
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  obligationIdx: index('pay_intent_oblig_idx').on(table.obligationId),
  userIdx: index('pay_intent_user_idx').on(table.userId),
  statusIds: index('pay_intent_status_idx').on(table.status)
}));

export type IntentInsert = typeof paymentIntents.$inferInsert;
export type IntentSelect = typeof paymentIntents.$inferSelect;


/* Stocke l'avancée des paiements */
export const paymentObligations = pgTable('payment_obligations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  eventId: integer('event_id')
    .references(() => paymentEvents.id)
    .notNull(),
  playerIds: jsonb('player_ids').$type<number[]>(), // joueurs concernés
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).$type<number>().default(0),
  remainingAmount: decimal('remaining_amount', { precision: 10, scale: 2 }), // calculable, stocké pour requêtes
  dueDate: date('due_date'),
  description: varchar('description', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 })
    .default('pending')
    .notNull(), // pending, partial, paid, overdue, cancelled
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('pay_oblig_user_idx').on(table.userId),
  statusIdx: index('pay_oblig_status_idx').on(table.status),
  eventIdx: index('pay_oblig_event_idx').on(table.eventId)
}));


export type ObligationInsert = typeof paymentObligations.$inferInsert;
export type ObligationSelect = typeof paymentObligations.$inferSelect;
