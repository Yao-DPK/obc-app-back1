import { db, ObligationInsert, paymentObligations } from '@/database/db';
import { eq, and } from 'drizzle-orm';
import { CreatePaymentObligationDto } from './payment-obligation.dto';

export class PaymentObligationRepository {
  async create(data: CreatePaymentObligationDto) {
    const [result] = await db.insert(paymentObligations).values(data).returning();
    return result;
  }

  async findById(id: number) {
    const [result] = await db.select().from(paymentObligations).where(eq(paymentObligations.id, id));
    return result;
  }

  async findByPlayer(playerId: number) {
    return await db.select().from(paymentObligations).where(eq(paymentObligations.playerId, playerId));
  }

  async findAll() {
    return await db.select().from(paymentObligations);
  }

  async update(id: number, data: Partial<ObligationInsert>) {
    const [result] = await db.update(paymentObligations).set(data).where(eq(paymentObligations.id, id)).returning();
    return result;
  }

  async delete(id: number) {
    const [result] = await db.delete(paymentObligations).where(eq(paymentObligations.id, id)).returning();
    return result;
  }

  async updateStatus(id: number, status: string) {
    const [result] = await db.update(paymentObligations).set({ status }).where(eq(paymentObligations.id, id)).returning();
    return result;
  }
}