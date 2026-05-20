import { Injectable } from '@nestjs/common';
import { db, payments, eq } from 'src/database/db';
import { TRPCError } from '@trpc/server';

@Injectable()
export class PaymentService {
  async create(userId: number, data: any) {
    const [declaration] = await db.insert(payments).values({
      userId,
      amount: data.amount,
      method: data.method,
      transactionReference: data.transactionReference,
      reason: data.reason,
      playerIds: data.playerIds,
      status: 'pending',
      declaredAt: new Date(),
    }).returning();
    return declaration;
  }

  async listByUser(userId: number) {
    return db.select().from(payments).where(eq(payments.userId, userId));
  }

  async verify(adminId: number, declarationId: number, status: 'verified' | 'rejected') {
    const [updated] = await db.update(payments).set({
      status,
      verifiedBy: adminId,
      verifiedAt: new Date(),
    }).where(eq(payments.id, declarationId)).returning();
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
    return updated;
  }
}