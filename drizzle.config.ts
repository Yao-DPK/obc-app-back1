import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import * as path from 'path';


config({ path: path.resolve(__dirname, '.env')});

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url:  process.env.CURRENT_ENV=='LOCAL' ? process.env.DATABASE_LOCAL_URL!: process.env.DATABASE_REMOTE_URL!,
  },
  verbose: true,
  strict: true,
});

