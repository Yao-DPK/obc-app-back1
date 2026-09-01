// src/database/database.providers.ts
import { db } from '../db';

export const DATABASE = 'DATABASE';

export const databaseProvider = {
  provide: DATABASE,
  useValue: db,
};