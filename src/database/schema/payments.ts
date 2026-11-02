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
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { players, users } from './users';
import { KayDevMetadata, NormalPaymentMetadata } from '../../types/payment.types';



/* Stocke les types de paiements */
export const paymentEvents = pgTable('payment_events', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 500 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).$type<number>().notNull(),
  allowInstallments: boolean('allow_installments').default(false),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),

  // 👇 NOUVEAUX CHAMPS
  isRecurringMonthly: boolean('is_recurring_monthly').default(false).notNull(),
  isApplicableAtRegistration: boolean('is_applicable_at_registration').default(true).notNull(),
  excludedMonths: jsonb('excluded_months').$type<number[]>().default([]).notNull(), // excludedMonths = [7, 8] pour exclure juillet et août
});

export type PayEventInsert = typeof paymentEvents.$inferInsert;
export type PayEventSelect = typeof paymentEvents.$inferSelect;

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
  transactionMetadata: jsonb('transaction_metadata').$type<KayDevMetadata | NormalPaymentMetadata>(),
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

export type PayIntentInsert = typeof paymentIntents.$inferInsert;
export type PayIntentSelect = typeof paymentIntents.$inferSelect;

 
/* Stocke l'avancée des paiements */
export const paymentObligations = pgTable('payment_obligations', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .references(() => paymentEvents.id)
    .notNull(),
  playerId: integer('player_id').references(() => users.id)
    .notNull(), // joueurs concernés
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).$type<number>().notNull(),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).$type<number>().default(0),
  remainingAmount: decimal('remaining_amount', { precision: 10, scale: 2 }).$type<number>(), // calculable, stocké pour requêtes
  dueDate: timestamp('due_date'),
  description: varchar('description', { length: 255 }).default(''),
  periodKey: varchar('period_key', { length: 50 }),
  // "2026-10" pour les mensualités
  // "saison-2026-2027" pour l'inscription annuelle
  // "event-42-2026" pour un camp 2026
  status: varchar('status', { length: 20 })
    .default('pending')
    .notNull(), // pending, partial, paid, overdue, cancelled
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  statusIdx: index('pay_oblig_status_idx').on(table.status),
  eventIdx: index('pay_oblig_event_idx').on(table.eventId),
  uniquePeriodIdx: uniqueIndex('pay_oblig_period_unique')
    .on(table.playerId, table.eventId, table.periodKey),
}));


export type PayObligationInsert = typeof paymentObligations.$inferInsert;
export type PayObligationSelect = typeof paymentObligations.$inferSelect;
