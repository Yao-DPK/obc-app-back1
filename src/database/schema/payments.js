"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentObligations = exports.paymentIntents = exports.paymentEvents = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var users_1 = require("./users");
/* Stocke les types de paiements */
exports.paymentEvents = (0, pg_core_1.pgTable)('payment_events', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.varchar)('description', { length: 500 }),
    amount: (0, pg_core_1.decimal)('amount', { precision: 10, scale: 2 }).$type().notNull(),
    allowInstallments: (0, pg_core_1.boolean)('allow_installments').default(false),
    startDate: (0, pg_core_1.timestamp)('start_date'),
    endDate: (0, pg_core_1.timestamp)('end_date'),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
/* Stocke les transactions déclenchés */
exports.paymentIntents = (0, pg_core_1.pgTable)('payment_intents', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    obligationId: (0, pg_core_1.integer)('obligation_id')
        .references(function () { return exports.paymentObligations.id; })
        .notNull(), // lien vers l'obligation correspondante
    userId: (0, pg_core_1.integer)('user_id')
        .references(function () { return users_1.users.id; })
        .notNull(),
    amount: (0, pg_core_1.decimal)('amount', { precision: 10, scale: 2 }).notNull(),
    method: (0, pg_core_1.varchar)('method', { length: 20 }).notNull(), // wave, orange_money, card
    transactionReference: (0, pg_core_1.varchar)('transaction_reference', { length: 100 }),
    transactionMetadata: (0, pg_core_1.jsonb)('transaction_metadata').$type(),
    status: (0, pg_core_1.varchar)('status', { length: 20 })
        .default('pending')
        .notNull(), // pending, paid, failed, expired
    declaredAt: (0, pg_core_1.timestamp)('declared_at').defaultNow().notNull(),
    verifiedBy: (0, pg_core_1.integer)('verified_by').references(function () { return users_1.users.id; }),
    verifiedAt: (0, pg_core_1.timestamp)('verified_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, function (table) { return ({
    obligationIdx: (0, pg_core_1.index)('pay_intent_oblig_idx').on(table.obligationId),
    userIdx: (0, pg_core_1.index)('pay_intent_user_idx').on(table.userId),
    statusIds: (0, pg_core_1.index)('pay_intent_status_idx').on(table.status)
}); });
/* Stocke l'avancée des paiements */
exports.paymentObligations = (0, pg_core_1.pgTable)('payment_obligations', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    eventId: (0, pg_core_1.integer)('event_id')
        .references(function () { return exports.paymentEvents.id; })
        .notNull(),
    playerId: (0, pg_core_1.integer)('player_id').references(function () { return users_1.users.id; })
        .notNull(), // joueurs concernés
    totalAmount: (0, pg_core_1.decimal)('total_amount', { precision: 10, scale: 2 }).$type().notNull(),
    paidAmount: (0, pg_core_1.decimal)('paid_amount', { precision: 10, scale: 2 }).$type().default(0),
    remainingAmount: (0, pg_core_1.decimal)('remaining_amount', { precision: 10, scale: 2 }).$type(), // calculable, stocké pour requêtes
    dueDate: (0, pg_core_1.timestamp)('due_date'),
    description: (0, pg_core_1.varchar)('description', { length: 255 }).default(''),
    status: (0, pg_core_1.varchar)('status', { length: 20 })
        .default('pending')
        .notNull(), // pending, partial, paid, overdue, cancelled
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, function (table) { return ({
    statusIdx: (0, pg_core_1.index)('pay_oblig_status_idx').on(table.status),
    eventIdx: (0, pg_core_1.index)('pay_oblig_event_idx').on(table.eventId)
}); });
