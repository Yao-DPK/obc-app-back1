// Ce fichier remplace le vrai db.ts pendant les tests unitaires.
// Aucune connexion à PostgreSQL n'est créée.
import { beforeEach, describe, expect, it, jest } from '@jest/globals';


export const db = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  transaction: jest.fn(),
};

// Re-export des opérateurs Drizzle (dont les repositories ont besoin)
export {
  eq,
  and,
  or,
  inArray,
  sql,
  desc,
  asc,
  gte,
  lte,
  ilike,
  not,
  isNull,
} from 'drizzle-orm';

// Re-export des schémas (nécessaires pour les requêtes)
export * from '../../src/database/schema';