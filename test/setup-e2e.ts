import { config } from 'dotenv';
import {jest } from '@jest/globals';

// Charger les variables d'env pour les tests e2e
config({ path: '.env.test' });

// Augmenter le timeout global si nécessaire
jest.setTimeout(30000);