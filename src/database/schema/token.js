"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationTokens = exports.verificationTokenType = exports.refreshTokens = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var users_1 = require("./users");
var crypto_1 = require("crypto");
// --- Refresh tokens ---
exports.refreshTokens = (0, pg_core_1.pgTable)('refresh_tokens', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id')
        .references(function () { return users_1.users.id; })
        .notNull(),
    // sha256 hex du token brut envoyé au client -> jamais le token en clair en base
    tokenHash: (0, pg_core_1.varchar)('token_hash', { length: 64 }).notNull().unique(),
    // Gestion de la rotation : tous les tokens issus d'un même login initial
    // partagent le même familyId. Si un token déjà remplacé est réutilisé,
    // on sait qu'il y a eu un vol -> on révoque toute la famille.
    familyId: (0, pg_core_1.varchar)('family_id', { length: 36 }).notNull().default((0, crypto_1.randomUUID)()),
    replacedBy: (0, pg_core_1.integer)('replaced_by'), // id du refresh token qui l'a remplacé (self-reference, nullable)
    userAgent: (0, pg_core_1.varchar)('user_agent', { length: 255 }),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }), // IPv6-friendly
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    revokedAt: (0, pg_core_1.timestamp)('revoked_at'), // logout explicite ou révocation manuelle
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// --- Verification tokens (confirmation, reset password, first login, invite...) ---
exports.verificationTokenType = (0, pg_core_1.pgEnum)('verification_token_type', [
    'email_confirmation',
    'password_reset',
    'first_login',
    'invite',
]);
exports.verificationTokens = (0, pg_core_1.pgTable)('verification_tokens', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id')
        .references(function () { return users_1.users.id; })
        .notNull(),
    type: (0, exports.verificationTokenType)('type').notNull(),
    tokenHash: (0, pg_core_1.varchar)('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    usedAt: (0, pg_core_1.timestamp)('used_at'), // null = pas encore consommé
    revokedAt: (0, pg_core_1.timestamp)('revoked_at'), // ex: annulé car un nouveau token du même type a été émis
    // Donnée annexe ponctuelle selon le type (ex: email cible pour un invite)
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
