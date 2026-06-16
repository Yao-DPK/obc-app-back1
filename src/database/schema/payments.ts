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
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { KayDevMetadata } from '@/types/payment.types';

/* Stocke les paiements réalisés et en cours*/
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  method: varchar('method', { length: 20 }).notNull(), // 'wave', 'orange_money', 'cash'
  transactionReference: varchar('transaction_reference', { length: 100 }),
  reason: varchar('reason', { length: 255 }).notNull(),
  playerIds: jsonb('player_ids').$type<number[]>(), // liste des IDs joueurs concernés
  transaction_phone_number: varchar('transaction_phone_number', { length: 20 }), // numéro de téléphone utilisé pour la transaction
  intentId: integer('intent_id').references(() => paymentIntents.id).unique(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, verified, rejected
  transaction_metadata: jsonb('transaction_metadata').$type<KayDevMetadata>(),
  obligationId: integer('obligation_id')
    .references(() => paymentObligations.id),
  declaredAt: timestamp('declared_at').defaultNow().notNull(),
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
});

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


/* Stocke les paiements déclenchés */
export const paymentIntents = pgTable('payment_intents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  eventId: integer('event_id').references(() => paymentEvents.id).notNull(),
  amountToPay: decimal('amount_to_pay', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(), // 'momo', 'card'
  feesAmount: decimal('fees_amount', { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  kadevReference: varchar('kadev_reference', { length: 100 }),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, paid, failed, expired
  playerIds: jsonb('player_ids').$type<number[]>(), // IDs des joueurs concernés (optionnel)
  metadata: jsonb('metadata'), // pour stocker d'autres infos
  updatedAt: timestamp('created_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
});


/* Stocke les paiements obligatoires */
export const paymentObligations = pgTable('payment_obligations', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').references(() => users.id), // optionnel : joueur concerné
  amount: decimal('amount', { precision: 10, scale: 2 }).$type<number>().notNull(),
  dueDate: date('due_date'),
  description: varchar('description', { length: 255 }).notNull(), // "Inscription annuelle 2025", "Mensualité juin"
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, paid, overdue, cancelled
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


export type ObligationInsert = typeof paymentObligations.$inferInsert;
export type ObligationSelect = typeof paymentObligations.$inferSelect;
