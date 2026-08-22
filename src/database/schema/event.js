"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.events = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.events = (0, pg_core_1.pgTable)('events', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    startDate: (0, pg_core_1.timestamp)('start_date'),
    endDate: (0, pg_core_1.timestamp)('end_date'),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    // 👇 NOUVEAUX CHAMPS
    documentTypeIds: (0, pg_core_1.jsonb)('document_type_ids').$type().default([]),
    paymentEventIds: (0, pg_core_1.jsonb)('payment_event_ids').$type().default([]),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
