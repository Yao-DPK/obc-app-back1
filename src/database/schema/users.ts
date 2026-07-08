import {
  pgTable,
  serial,
  varchar,
  timestamp,
  text,
  integer,
  jsonb,
  date,
} from 'drizzle-orm/pg-core';

// ====== users (core) ======
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 })
    .$type<'parent' | 'player' | 'admin' | 'super_admin'>()
    .default('parent')
    .notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  gender: varchar('gender', { length: 10 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  photoUrl: varchar('photo_url', { length: 500 }),
  notificationPreferences: jsonb('notification_preferences')
    .$type<{ email?: boolean; sms?: boolean; push?: boolean }>()
    .default({ email: true, sms: false, push: true }),
  registrationStatus: varchar('registration_status', { length: 30 })
    .default('pre_inscrit')
    .notNull(), // reste pertinent pour tous
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;

// ====== players (données spécifiques aux joueurs) ======
export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  birthDate: date('birth_date'),
  school: varchar('school', { length: 255 }),
  emergencyContactName: varchar('emergency_contact_name', { length: 255 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
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

export type PlayerInsert = typeof players.$inferInsert;
export type PlayerSelect = typeof players.$inferSelect;

