// migrate-runner.ts
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './src/database/db';

async function main() {
  console.log('🔄 Running migrations...');
  try {
    await migrate(db, { migrationsFolder: './src/database/migrations' });
    console.log('✅ Migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();