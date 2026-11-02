import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock du fichier db.ts (où qu'il soit dans src/)
    '^.*/database/db$': '<rootDir>/test/mocks/db.ts',
  },

  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/database/migrations/**',
  ],
  coverageDirectory: 'coverage',

  testTimeout: 10000,
};

export default config;