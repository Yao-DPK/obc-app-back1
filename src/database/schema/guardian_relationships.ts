import { pgTable, integer, jsonb, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const guardianRelationships = pgTable('guardian_relationships', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  guardianId: integer('guardian_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  playerId: integer('player_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  relationship: varchar('relationship', { length: 30 }).$type<'Mère' | 'Père' | 'Tuteur'>().default('Mère').notNull(),
  permissions: jsonb('permissions').$type<{
    canPay?: boolean;
    canRegister?: boolean;
  }>().default({ canPay: true, canRegister: false }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/* registrationStatus: varchar('registration_status', { length: 20 }).$type<'pre_inscrit' | 'inscrit' | 'actif' | 'suspendu' | 'parent_invité' | 'validé'>().default('pre_inscrit').notNull(),
  registrationStep: varchar('registration_step', { length: 50 }).default('formulaire'), */