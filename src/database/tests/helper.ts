import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '../schema';
import path from 'path';

let container: StartedPostgreSqlContainer;
let pool: Pool;

export async function setupTestDb() {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  pool = new Pool({ connectionString: container.getConnectionUri() });
  const db = drizzle(pool, { schema });
  await migrate(db, {
  migrationsFolder: path.join(__dirname, '../migrations'), // 👈 résolu depuis helper.ts
});
  return { db, pool };
}

export async function teardownTestDb() {
  await pool?.end();
  await container?.stop();
}