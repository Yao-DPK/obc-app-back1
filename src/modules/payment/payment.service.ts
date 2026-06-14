import { Injectable } from '@nestjs/common';
import { db, payments, eq, paymentIntents } from '../../database/db';

@Injectable()
export class PaymentService {
  async create(userId: number, data: any) {
    const [declaration] = await db
      .insert(payments)
      .values({
        userId,
        amount: data.amount,
        method: data.method,
        transactionReference: data.transactionReference,
        reason: data.reason,
        playerIds: data.playerIds,
        status: 'pending',
        declaredAt: new Date(),
      })
      .returning();
    return declaration;
  }

  async listByUser(userId: number) {
    return db.select().from(payments).where(eq(payments.userId, userId));
  }

  async verify(
    adminId: number,
    declarationId: number,
    status: 'verified' | 'rejected',
  ) {
    const [updated] = await db
      .update(payments)
      .set({
        status,
        verifiedBy: adminId,
        verifiedAt: new Date(),
      })
      .where(eq(payments.id, declarationId))
      .returning();
    if (!updated) throw new Error('NOT_FOUND');
    return updated;
  }

  async createFromIntent(intentId: number, transactionReference: string) {
    // Récupérer l'intention
    const [intent] = await db.select().from(paymentIntents).where(eq(paymentIntents.id, intentId));
    if (!intent) throw new Error('Intent not found');

    // Insérer le paiement final
    const [payment] = await db.insert(payments).values({
      userId: intent.userId,
      amount: intent.totalAmount,
      method: intent.paymentMethod,
      transactionReference,
      reason: `Payment for event ${intent.eventId}`,
      playerIds: intent.playerIds,
      status: 'verified',
      verifiedAt: new Date(),
      intentId: intent.id,
    }).returning();
    return payment;
  }
}
