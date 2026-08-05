import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

// Charger les variables d'environnement

dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString:
    process.env.CURRENT_ENV == 'LOCAL'
      ? process.env.DATABASE_LOCAL_URL!
      : process.env.DATABASE_REMOTE_URL!,
});


pool.on('error', (err) => {
  console.error('🔴 Pool error:', err);
});


export {
  eq,
  and,
  or,
  sql,
  lt,
  gt,
  lte,
  desc,
  asc,
  gte,
  ilike,
  inArray,
  not,
  isNull
  
} from 'drizzle-orm'; // Exports utilisés par les autres packages
export { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(pool, { schema, logger: true });
export * from './schema';
