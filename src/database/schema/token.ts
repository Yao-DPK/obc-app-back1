import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { randomUUID } from 'crypto';

// --- Refresh tokens ---

export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),

  // sha256 hex du token brut envoyé au client -> jamais le token en clair en base
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),

  // Gestion de la rotation : tous les tokens issus d'un même login initial
  // partagent le même familyId. Si un token déjà remplacé est réutilisé,
  // on sait qu'il y a eu un vol -> on révoque toute la famille.
  familyId: varchar('family_id', { length: 36 }).notNull().default(randomUUID()),
  replacedBy: integer('replaced_by'), // id du refresh token qui l'a remplacé (self-reference, nullable)

  userAgent: varchar('user_agent', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6-friendly

  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'), // logout explicite ou révocation manuelle
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Verification tokens (confirmation, reset password, first login, invite...) ---

export const verificationTokenType = pgEnum('verification_token_type', [
  'email_confirmation',
  'password_reset',
  'first_login',
  'invite',
]);

export const verificationTokens = pgTable('verification_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),

  type: verificationTokenType('type').notNull(),

  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),

  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'), // null = pas encore consommé
  revokedAt: timestamp('revoked_at'), // ex: annulé car un nouveau token du même type a été émis

  // Donnée annexe ponctuelle selon le type (ex: email cible pour un invite)
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});