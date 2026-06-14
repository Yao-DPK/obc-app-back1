import { Injectable, BadRequestException } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { addHours } from 'date-fns';
import { paymentEvents, paymentIntents } from '@/database/schema';
import { db, eq } from '../../../database/db';
import { CreateIntentDto } from '../dto/payment.dto';

@Injectable()
export class PaymentIntentsService {

  async create(dto: CreateIntentDto, userId: number) {
    // 1. Récupérer l'événement
    const event = await db.select().from(paymentEvents).where(eq(paymentEvents.id, dto.eventId)).then(res => res[0]);
    if (!event || !event.isActive) throw new BadRequestException('Event not available');
    // Vérifier éligibilité utilisateur (ex: pas déjà payé) -> à implémenter

    // 2. Calculer les frais selon paymentMethod
    const feeRate = dto.paymentMethod === 'momo' ? 0.023 : 0.045;
    const amount = parseFloat(event.amount);
    const fees = amount * feeRate;
    const total = amount + fees;

    // 3. Créer l'intention
    const expiresAt = addHours(new Date(), 24);
    const [intent] = await db.insert(paymentIntents).values({
      userId,
      eventId: dto.eventId,
      amountToPay: amount.toString(),
      paymentMethod: dto.paymentMethod,
      feesAmount: fees.toFixed(2),
      totalAmount: total.toFixed(2),
      playerIds: dto.playerIds,
      status: 'pending',
      expiresAt,
    }).returning();

    return intent;
  }

  async findOne(id: number, userId: number) {
    const [intent] = await db.select().from(paymentIntents).where(eq(paymentIntents.id, id));
    if (!intent || intent.userId !== userId) throw new BadRequestException('Intent not found');
    return intent;
  }

  async updateStatus(id: number, status: string, kadevReference?: string) {
    await db.update(paymentIntents)
      .set({ status, kadevReference, updatedAt: new Date() })
      .where(eq(paymentIntents.id, id));
  }
}