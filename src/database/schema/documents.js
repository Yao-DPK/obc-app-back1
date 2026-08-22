"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentTypes = exports.documents = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var users_1 = require("./users");
exports.documents = (0, pg_core_1.pgTable)('documents', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id')
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' })
        .notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(), // ex: 'certificat_medical', 'paiement_reçu'
    typeId: (0, pg_core_1.integer)('type_id')
        .references(function () { return exports.documentTypes.id; }, { onDelete: 'set null' }),
    fileId: (0, pg_core_1.varchar)('file_id', { length: 255 }).notNull(), // Google Drive file ID
    publicUrl: (0, pg_core_1.varchar)('public_url', { length: 500 }).notNull(),
    documentStatus: (0, pg_core_1.varchar)('document_status', { length: 50 })
        .default('En attente de Validation')
        .notNull(),
    isObligatory: (0, pg_core_1.boolean)('is_obligatory').default(false),
    validatedAt: (0, pg_core_1.timestamp)('validated_at'),
    validatedBy: (0, pg_core_1.integer)('validated_by')
        .references(function () { return users_1.users.id; }),
    uploadedAt: (0, pg_core_1.timestamp)('uploaded_at').defaultNow().notNull(),
});
exports.documentTypes = (0, pg_core_1.pgTable)('document_types', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull().unique(),
    description: (0, pg_core_1.text)('description'),
    isObligatory: (0, pg_core_1.boolean)('is_obligatory').default(false),
    applicableCategories: (0, pg_core_1.varchar)('applicable_categories', { length: 255 }).array(),
    displayOrder: (0, pg_core_1.integer)('display_order').default(0),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
