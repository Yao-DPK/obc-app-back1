"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogs = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var users_1 = require("./users");
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').references(function () { return users_1.users.id; }, {
        onDelete: 'set null',
    }),
    action: (0, pg_core_1.varchar)('action', { length: 255 }).notNull(),
    oldValue: (0, pg_core_1.jsonb)('old_value'),
    newValue: (0, pg_core_1.jsonb)('new_value'),
    ip: (0, pg_core_1.varchar)('ip', { length: 45 }),
    userAgent: (0, pg_core_1.text)('user_agent'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
