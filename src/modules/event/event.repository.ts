// src/modules/event/event.repository.ts
import { Injectable } from '@nestjs/common';
import { db, events, eq, inArray, and, gte, lte, or, ilike, desc, asc } from '../../database/db';
import type { EventInsert, EventSelect } from '../../database/db';
import { sql, SQL } from 'drizzle-orm';

// ========== INTERFACE DES FILTRES ==========
export type EventFilters = {
  id?: number;
  name?: string;
  isActive?: boolean;
  search?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
  updatedFrom?: Date | string;
  updatedTo?: Date | string;
};

@Injectable()
export class EventRepository {
  // ========== CONSTRUCTEUR DE FILTRES ==========
  private static buildFilters(filters: EventFilters): SQL | undefined {
    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(events.id, filters.id));
    }
    if (filters.name) {
      conditions.push(eq(events.name, filters.name));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(events.isActive, filters.isActive));
    }
    if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push(
            sql`(${events.name} ILIKE ${searchTerm} OR ${events.description} ILIKE ${searchTerm})`
        );
    }

    if (filters.createdFrom) {
      conditions.push(gte(events.createdAt, new Date(filters.createdFrom)));
    }
    if (filters.createdTo) {
      conditions.push(lte(events.createdAt, new Date(filters.createdTo)));
    }
    if (filters.updatedFrom) {
      conditions.push(gte(events.updatedAt, new Date(filters.updatedFrom)));
    }
    if (filters.updatedTo) {
      conditions.push(lte(events.updatedAt, new Date(filters.updatedTo)));
    }

    if (conditions.length === 0) return undefined;
    return and(...conditions);
  }

  // ========== CRUD ==========

  async create(data: EventInsert): Promise<EventSelect> {
    const [event] = await db.insert(events).values(data).returning();
    return event;
  }

  async findById(id: number): Promise<EventSelect | null> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || null;
  }

  async findByIds(ids: number[]): Promise<EventSelect[]> {
    if (!ids.length) return [];
    return await db.select().from(events).where(inArray(events.id, ids));
  }

  async findByName(name: string): Promise<EventSelect | null> {
    const [event] = await db.select().from(events).where(eq(events.name, name));
    return event || null;
  }

  async findAll(filters?: EventFilters): Promise<EventSelect[]> {
    const whereClause = filters ? EventRepository.buildFilters(filters) : undefined;
    const query = db.select().from(events);
    if (whereClause) {
      query.where(whereClause);
    }
    query.orderBy(desc(events.startDate), asc(events.name));
    return await query;
  }

  async findAllActive(): Promise<EventSelect[]> {
    return this.findAll({ isActive: true });
  }

  async update(id: number, data: Partial<EventInsert>): Promise<EventSelect | null> {
    const [updated] = await db
      .update(events)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // ========== UTILITAIRES ==========

  async exists(id: number): Promise<boolean> {
    const [event] = await db.select({ id: events.id }).from(events).where(eq(events.id, id));
    return !!event;
  }
}