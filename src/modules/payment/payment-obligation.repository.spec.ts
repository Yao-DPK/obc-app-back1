// packages/database/src/repositories/payment-obligation.repository.spec.ts
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { setupTestDb, teardownTestDb } from '@/database/tests/helper';
import { PaymentObligationRepository } from './payment-obligation.repository';
import { paymentEvents, paymentObligations, users } from '@/database/schema';
import { eq, sql } from 'drizzle-orm';
import { Test } from '@nestjs/testing';
import { DATABASE } from '@/database/providers/database.providers';

describe('PaymentObligationRepository – createIfNotExists', () => {
  let repo: PaymentObligationRepository;
  let db: any;

  beforeAll(async () => {
  ({ db } = await setupTestDb());
  const module = await Test.createTestingModule({
    providers: [
      PaymentObligationRepository,
      { provide: DATABASE, useValue: db },
    ],
  }).compile();
  repo = module.get(PaymentObligationRepository);

  // Seed des dépendances
  await db.insert(paymentEvents).values({
    id: 1,
    name: 'Mensualités Saison 2026-2027',
    amount: 15000,
    isRecurringMonthly: true,
    isActive: true,
  });

  await db.insert(users).values({
    id: 10,
    email: 'player10@test.com',
    passwordHash: 'hash',
    role: 'player',
    firstName: 'Player',
    lastName: 'Ten',
    registrationStatus: 'inscrit',
  });
});

  afterAll(async () => {
    await teardownTestDb();
  });

  it('utilise bien la base de test', async () => {
    const result = await db.execute(sql`SELECT current_database() as db`);
    console.log('Current DB:', result.rows[0]);
    expect(result.rows[0].db).not.toBe('centredb'); // nom de ta vraie base
  });

  
  
  it('vérifie la contrainte unique', async () => {
    const result = await db.execute(sql`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'payment_obligations'
    `);
    console.log('INDEXES:', result.rows);
  });

  it('vérifie que periodKey est persisté', async () => {
    const { obligation } = await repo.createIfNotExists({
      eventId: 1,
      playerId: 10,
      totalAmount: 15000,
      paidAmount: 0,
      remainingAmount: 15000,
      periodKey: '2026-12',
      description: 'Mensualité octobre 2026',
      status: 'pending',
    });
    const [row] = await db.select().from(paymentObligations).where(eq(paymentObligations.id, obligation!.id));

    console.log('periodKey en DB:', row.periodKey); // 👈 si null → c'est le bug

    const cols = await db.execute(sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'payment_obligations'
  `);
    console.log('column rows:', cols.rows);

    const idx = await db.execute(sql`
      SELECT indexdef FROM pg_indexes WHERE indexname = 'pay_oblig_period_unique'
    `);
    console.log('idx rows', idx.rows);
  });


  it('colonnes du schéma runtime', () => {
    console.log('COLUMNS:', Object.keys(paymentObligations));
  });

  it('crée la première obligation', async () => {
    const { created } = await repo.createIfNotExists({
      eventId: 1,
      playerId: 10,
      totalAmount: 15000,
      paidAmount: 0,
      remainingAmount: 15000,
      periodKey: '2026-10',
      description: 'Mensualité octobre 2026',
      status: 'pending',
    });

    expect(created).toBe(true);
  });

  it('refuse le doublon et retourne created=false', async () => {
    const { created } = await repo.createIfNotExists({
      eventId: 1,
      playerId: 10,
      totalAmount: 15000,
      paidAmount: 0,
      remainingAmount: 15000,
      periodKey: '2026-10',
      description: 'Mensualité octobre 2026',
      status: 'pending',
    });

    expect(created).toBe(false);
  });

  it('autorise des obligations avec periodKey différents', async () => {
    const { created } = await repo.createIfNotExists({
      eventId: 1,
      playerId: 10,
      totalAmount: 15000,
      paidAmount: 0,
      remainingAmount: 15000,
      periodKey: '2026-11',
      description: 'Mensualité novembre 2026',
      status: 'pending',
    });

    expect(created).toBe(true);
  });
});