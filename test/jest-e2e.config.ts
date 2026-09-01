import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],

  // Tests e2e uniquement
  testMatch: ['**/*.e2e-spec.ts'],

  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // Résolution des alias monorepo
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
    '^@obc/(.*)$': '<rootDir>/../../../packages/$1/src',
  },

  // Setup global (démarrage DB, etc.)
  setupFilesAfterEnv: ['<rootDir>/setup-e2e.ts'],

  // ⚠️ Important pour les tests DB : exécution séquentielle
  maxWorkers: 1,

  // Évite les connexions qui restent ouvertes
  forceExit: true,
  detectOpenHandles: true,

  testTimeout: 30000,
};

export default config;