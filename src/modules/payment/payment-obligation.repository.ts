import { Injectable } from '@nestjs/common';
import { db, paymentObligations, eq, and, desc, sql, or } from '@/database/db';
import type { ObligationInsert, ObligationSelect } from '@/database/db';

@Injectable()
export class PaymentObligationRepository {
  async create(data: ObligationInsert): Promise<ObligationSelect> {
    const [obligation] = await db.insert(paymentObligations).values(data).returning();
    return obligation;
  }

  async findAll(): Promise<ObligationSelect[] | null > {
    const obligations = await db.select().from(paymentObligations);
    return obligations || null;
  }

  async findById(id: number): Promise<ObligationSelect | null> {
    const [obligation] = await db.select().from(paymentObligations).where(eq(paymentObligations.id, id));
    return obligation || null;
  }

   async findByUserId(userId: number): Promise<ObligationSelect[]> {
    return db
        .select()
        .from(paymentObligations)
        .where(eq(paymentObligations.userId, userId));
    }

    async findByPlayerIds(playerIds: number[]): Promise<ObligationSelect[]> {
      if (!playerIds.length) return [];

      // On filtre les obligations dont playerIds contient au moins un des IDs
      const conditions = playerIds.map(id =>
        sql`${paymentObligations.playerIds} @> ${JSON.stringify([id])}::jsonb`
      );
      return db
        .select()
        .from(paymentObligations)
        .where(or(...conditions));
    }

  async findByEvent(eventId: number): Promise<ObligationSelect[]> {
    return db
      .select()
      .from(paymentObligations)
      .where(eq(paymentObligations.eventId, eventId));
  }

  async findByStatus(status: string): Promise<ObligationSelect[]> {
    return db
      .select()
      .from(paymentObligations)
      .where(eq(paymentObligations.status, status));
  }

  async update(id: number, data: Partial<ObligationInsert>): Promise<ObligationSelect | null> {
    const [updated] = await db
      .update(paymentObligations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentObligations.id, id))
      .returning();
    return updated || null;
  }

  async updateStatus(id: number, status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled') {
    return this.update(id, { status });
  }

  async updatePaidAmount(id: number, amount: number) {
    const obligation = await this.findById(id);
    if (!obligation) return null;
    const newPaid = Number(obligation.paidAmount || 0) + amount;
    const remaining = Number(obligation.totalAmount || 0) - newPaid;
    const status = newPaid >= Number(obligation.totalAmount) ? 'paid' : 'partial';
    return this.update(id, {
      paidAmount: newPaid,
      remainingAmount: remaining.toString(),
      status,
    });
  }
}