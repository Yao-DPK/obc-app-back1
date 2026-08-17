import { Injectable } from '@nestjs/common';
import { db, paymentIntents, eq, desc } from '@/database/db';
import type { PayIntentInsert, PayIntentSelect } from '@/database/db';

@Injectable()
export class PaymentIntentRepository {
  async create(data: PayIntentInsert): Promise<PayIntentSelect> {
    const [intent] = await db.insert(paymentIntents).values(data).returning();
    return intent;
  }

  async findAll(): Promise<PayIntentSelect[] | null > {
      const intents = await db.select().from(paymentIntents);
      return intents || null;
    }

  async findById(id: number): Promise<PayIntentSelect | null> {
    const [intent] = await db.select().from(paymentIntents).where(eq(paymentIntents.id, id));
    return intent || null;
  }

  async findByObligation(obligationId: number): Promise<PayIntentSelect[]> {
    return db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.obligationId, obligationId))
      .orderBy(desc(paymentIntents.declaredAt));
  }

  async findByUser(userId: number): Promise<PayIntentSelect[]> {
    return db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.userId, userId))
      .orderBy(desc(paymentIntents.declaredAt));
  }

  async findByStatus(status: string): Promise<PayIntentSelect[]> {
    return db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.status, status));
  }

  async update(id: number, data: Partial<PayIntentInsert>): Promise<PayIntentSelect | null> {
    const [updated] = await db
      .update(paymentIntents)
      .set({ ...data })
      .where(eq(paymentIntents.id, id))
      .returning();
    return updated || null;
  }

  async updateStatus(id: number, status: 'pending' | 'paid' | 'failed' | 'expired') {
    return this.update(id, { status });
  }

  async verify(id: number, adminId: number) {
    return this.update(id, {
      status: 'paid',
      verifiedBy: adminId,
      verifiedAt: new Date(),
    });
  }

  async findByTransactionReference(ref: string): Promise<PayIntentSelect | null> {
    const [intent] = await db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.transactionReference, ref));
    return intent || null;
  }
}