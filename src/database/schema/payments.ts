import { pgTable, serial, integer, decimal, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  method: varchar('method', { length: 20 }).notNull(), // 'wave', 'orange_money', 'cash'
  transactionReference: varchar('transaction_reference', { length: 100 }),
  reason: varchar('reason', { length: 255 }).notNull(),
  playerIds: jsonb('player_ids').$type<number[]>(), // liste des IDs joueurs concernés
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, verified, rejected
  declaredAt: timestamp('declared_at').defaultNow().notNull(),
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
});