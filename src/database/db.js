"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.drizzle = exports.isNull = exports.not = exports.inArray = exports.ilike = exports.gte = exports.asc = exports.desc = exports.lte = exports.gt = exports.lt = exports.sql = exports.or = exports.and = exports.eq = void 0;
var node_postgres_1 = require("drizzle-orm/node-postgres");
var pg_1 = require("pg");
var schema = require("./schema");
var dotenv_1 = require("dotenv");
// Charger les variables d'environnement
dotenv_1.default.config({ path: '.env' });
var pool = new pg_1.Pool({
    connectionString: process.env.CURRENT_ENV == 'LOCAL'
        ? process.env.DATABASE_LOCAL_URL
        : process.env.DATABASE_REMOTE_URL,
});
/* pool.on('error', (err) => {
  console.error('🔴 Pool error:', err);
});
 */
var drizzle_orm_1 = require("drizzle-orm"); // Exports utilisés par les autres packages
Object.defineProperty(exports, "eq", { enumerable: true, get: function () { return drizzle_orm_1.eq; } });
Object.defineProperty(exports, "and", { enumerable: true, get: function () { return drizzle_orm_1.and; } });
Object.defineProperty(exports, "or", { enumerable: true, get: function () { return drizzle_orm_1.or; } });
Object.defineProperty(exports, "sql", { enumerable: true, get: function () { return drizzle_orm_1.sql; } });
Object.defineProperty(exports, "lt", { enumerable: true, get: function () { return drizzle_orm_1.lt; } });
Object.defineProperty(exports, "gt", { enumerable: true, get: function () { return drizzle_orm_1.gt; } });
Object.defineProperty(exports, "lte", { enumerable: true, get: function () { return drizzle_orm_1.lte; } });
Object.defineProperty(exports, "desc", { enumerable: true, get: function () { return drizzle_orm_1.desc; } });
Object.defineProperty(exports, "asc", { enumerable: true, get: function () { return drizzle_orm_1.asc; } });
Object.defineProperty(exports, "gte", { enumerable: true, get: function () { return drizzle_orm_1.gte; } });
Object.defineProperty(exports, "ilike", { enumerable: true, get: function () { return drizzle_orm_1.ilike; } });
Object.defineProperty(exports, "inArray", { enumerable: true, get: function () { return drizzle_orm_1.inArray; } });
Object.defineProperty(exports, "not", { enumerable: true, get: function () { return drizzle_orm_1.not; } });
Object.defineProperty(exports, "isNull", { enumerable: true, get: function () { return drizzle_orm_1.isNull; } });
var node_postgres_2 = require("drizzle-orm/node-postgres");
Object.defineProperty(exports, "drizzle", { enumerable: true, get: function () { return node_postgres_2.drizzle; } });
exports.db = (0, node_postgres_1.drizzle)(pool, { schema: schema, }); //
__exportStar(require("./schema"), exports);
//Décommenter le lignes 18 et 42 pour aider à trouver les erreurs db
