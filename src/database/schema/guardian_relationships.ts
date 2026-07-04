import {
  pgTable,
  integer,
  jsonb,
  timestamp,
  boolean,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const guardianRelationships = pgTable('guardian_relationships', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  guardianId: integer('guardian_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  playerId: integer('player_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  relationship: varchar('relationship', { length: 30 })
    .$type<'Mère' | 'Père' | 'Tuteur'>()
    .default('Mère')
    .notNull(),
  permissions: jsonb('permissions')
    .$type<{
      canPay?: boolean;
      canRegister?: boolean;
    }>()
    .default({ canPay: true, canRegister: false }),
  status: boolean('status').default(false),
  confirmationToken: varchar('confirmation_token', { length: 255 }),
  tokenExpiresAt: timestamp('token_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type GuardianRelationshipInsert = typeof guardianRelationships.$inferInsert;
export type GuardianRelationshipSelect = typeof guardianRelationships.$inferSelect;