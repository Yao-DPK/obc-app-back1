"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.players = exports.users = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
// ====== users (core) ======
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).unique(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    role: (0, pg_core_1.varchar)('role', { length: 50 })
        .$type()
        .default('parent')
        .notNull(),
    firstName: (0, pg_core_1.varchar)('first_name', { length: 100 }).notNull().default(''),
    lastName: (0, pg_core_1.varchar)('last_name', { length: 100 }).notNull().default(''),
    gender: (0, pg_core_1.varchar)('gender', { length: 10 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }),
    address: (0, pg_core_1.text)('address'),
    photoUrl: (0, pg_core_1.varchar)('photo_url', { length: 500 }),
    notificationPreferences: (0, pg_core_1.jsonb)('notification_preferences')
        .$type()
        .default({ email: true, sms: false, push: true }),
    registrationStatus: (0, pg_core_1.varchar)('registration_status', { length: 30 })
        .default('pre_inscrit')
        .notNull(), // reste pertinent pour tous,
    confirmationToken: (0, pg_core_1.varchar)('confirmation_token', { length: 255 }).unique(),
    tokenExpiry: (0, pg_core_1.timestamp)('token_expiry'),
    isVerified: (0, pg_core_1.boolean)('isVerified').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// ====== players (données spécifiques aux joueurs) ======
exports.players = (0, pg_core_1.pgTable)('players', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id')
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' })
        .unique()
        .notNull(),
    birthDate: (0, pg_core_1.date)('birth_date'),
    school: (0, pg_core_1.varchar)('school', { length: 255 }),
    class: (0, pg_core_1.varchar)('class', { length: 50 }),
    emergencyContactName: (0, pg_core_1.varchar)('emergency_contact_name', { length: 255 }),
    emergencyContactPhone: (0, pg_core_1.varchar)('emergency_contact_phone', { length: 20 }),
    attestationData: (0, pg_core_1.jsonb)('attestation_data').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
