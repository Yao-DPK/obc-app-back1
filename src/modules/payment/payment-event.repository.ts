import { db, eq, desc } from '@/database/db';
import { EventInsert, EventSelect, paymentEvents } from '@/database/schema';
import { Injectable } from '@nestjs/common';


@Injectable()
export class PaymentEventRepository {
  async create(data: EventInsert): Promise<EventSelect> {
    const [event] = await db.insert(paymentEvents).values(data).returning();
    return event;
  }

  async findAll(): Promise<EventSelect[]> {
    return db
      .select()
      .from(paymentEvents)
      .orderBy(desc(paymentEvents.startDate));
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

  async findByName(name: string): Promise<EventSelect | null> {
    const [event] = await db.select().from(paymentEvents).where(eq(paymentEvents.name, name));
    return event || null;
  }


  async update(id: number, data: Partial<EventInsert>): Promise<EventSelect> {
    const [updated] = await db
      .update(paymentEvents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentEvents.id, id))
      .returning();
    return updated;
  }

  async delete(id: number): Promise<void> {
    await db.delete(paymentEvents).where(eq(paymentEvents.id, id));
  }
}