import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';


// Charger les variables d'environnement
dotenv.config()

const pool = new Pool({
  connectionString: process.env.CURRENT_ENV == 'LOCAL' ? process.env.DATABASE_LOCAL_URL! : process.env.DATABASE_REMOTE_URL!,
});

export { eq, and, or, sql, lt, gt, lte, gte, ilike, inArray, not } from 'drizzle-orm'; // Exports utilisés par les autres packages
export { drizzle } from 'drizzle-orm/node-postgres';


export const db = drizzle(pool, { schema });
export * from './schema'; 
