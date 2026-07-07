import { db, eq, desc } from '@/database/db';
import { EventInsert, EventSelect, paymentEvents } from '@/database/schema';
import { Injectable } from '@nestjs/common';


@Injectable()
export class PaymentEventRepository {
  async create(data: EventInsert): Promise<EventSelect> {
    const [event] = await db.insert(paymentEvents).values(data).returning();
    return event;
  }

  async findAllActive(): Promise<EventSelect[]> {
    return db
      .select()
      .from(paymentEvents)
      .where(eq(paymentEvents.isActive, true))
      .orderBy(desc(paymentEvents.startDate));
  }

  async findById(id: number): Promise<EventSelect | null> {
    const [event] = await db.select().from(paymentEvents).where(eq(paymentEvents.id, id));
    return event || null;
  }

  async update(id: number, data: Partial<EventInsert>): Promise<EventSelect | null> {
    const [updated] = await db
      .update(paymentEvents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentEvents.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: number): Promise<void> {
    await db.delete(paymentEvents).where(eq(paymentEvents.id, id));
  }
}