"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guardianRelationships = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var users_1 = require("./users");
exports.guardianRelationships = (0, pg_core_1.pgTable)('guardian_relationships', {
    id: (0, pg_core_1.integer)('id').primaryKey().generatedAlwaysAsIdentity(),
    guardianId: (0, pg_core_1.integer)('guardian_id')
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' })
        .notNull(),
    playerId: (0, pg_core_1.integer)('player_id')
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' })
        .notNull(),
    relationship: (0, pg_core_1.varchar)('relationship', { length: 30 })
        .$type()
        .default('Mère')
        .notNull(),
    permissions: (0, pg_core_1.jsonb)('permissions')
        .$type()
        .default({ canPay: true, canRegister: false }),
    status: (0, pg_core_1.varchar)('status', { length: 50 })
        .$type()
        .default('pending'),
    confirmationToken: (0, pg_core_1.varchar)('confirmation_token', { length: 255 }),
    tokenExpiresAt: (0, pg_core_1.timestamp)('token_expires_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
