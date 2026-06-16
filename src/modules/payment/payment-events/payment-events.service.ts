import { Injectable } from '@nestjs/common';
import { db } from '../../../database/db';
import { eq } from 'drizzle-orm';
import { paymentEvents } from '../../../database/schema';
import { CreatePaymentEventDto, UpdatePaymentEventDto } from '../dto/payment.dto';

@Injectable()
export class PaymentEventsService {

  async create(dto: CreatePaymentEventDto) {
    const [result] = await db.insert(paymentEvents).values({
      name: dto.name,
      description: dto.description,
      amount: dto.amount.toString(),   // Drizzle attend une string pour decimal
      allowInstallments: dto.allowInstallments,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      isActive: dto.isActive ?? true,
    }).returning();
    return result;
  }

  async findAll(onlyActive = false) {
  const query = onlyActive
    ? db.select().from(paymentEvents).where(eq(paymentEvents.isActive, true))
    : db.select().from(paymentEvents);
  return await query;
}
  async findOne(id: number) {
    const [result] = await db.select().from(paymentEvents).where(eq(paymentEvents.id, id));
    return result;
  }

  async update(id: number, dto: UpdatePaymentEventDto) {
    // Ne mettre à jour que les champs fournis
    const updateData: Partial<typeof paymentEvents.$inferInsert> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.amount !== undefined) updateData.amount = dto.amount.toString();
    if (dto.allowInstallments !== undefined) updateData.allowInstallments = dto.allowInstallments;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const [result] = await db.update(paymentEvents)
      .set(updateData)
      .where(eq(paymentEvents.id, id))
      .returning();
    return result;
  }

  async remove(id: number) {
    await db.delete(paymentEvents).where(eq(paymentEvents.id, id));
  }
}