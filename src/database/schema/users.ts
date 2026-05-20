import { pgTable, serial, varchar, timestamp, text, integer, jsonb, date } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).$type<'parent' | 'player' | 'admin' | 'super_admin'>().default('parent').notNull(),

  // Nouveaux champs pour les informations personnelles
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  birthDate: date('birth_date'),
  gender: varchar('gender', { length: 10 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  school: varchar('school', { length: 255 }),
  class: varchar('class', { length: 50 }),

  // Pour les joueurs autonomes mineurs
  emergencyContactName: varchar('emergency_contact_name', { length: 255 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),

  // Statuts d'inscription
  registrationStatus: varchar('registration_status', { length: 20 }).$type<'pre_inscrit' | 'inscrit' | 'actif' | 'suspendu' | 'parent_invité' | 'validé'>().default('pre_inscrit').notNull(),
  registrationStep: varchar('registration_step', { length: 50 }).default('formulaire'),

  notificationPreferences: jsonb('notification_preferences').$type<{
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  }>().default({ email: true, sms: false, push: true }),

  attestationData: jsonb('attestation_data').$type<{
    signatoryType: 'self' | 'guardian';
    selectedGuardianIndex?: number;
    signatoryFullName: string;
    acceptedTerms: boolean;
    signatureUrl: string;
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;
