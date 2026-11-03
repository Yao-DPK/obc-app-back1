// src/modules/payment/payment-event.repository.ts
import { Injectable } from '@nestjs/common';
import { db, paymentEvents, eq, inArray, and, gte, lte, or, ilike, desc, asc, sql } from '../../database/db';
import type { PayEventInsert, PayEventSelect } from '../../database/db';
import { SQL } from 'drizzle-orm';

// ========== INTERFACE DES FILTRES ==========
export type PaymentEventFilters = {
  id?: number;
  name?: string;
  isActive?: boolean;
  allowInstallments?: boolean;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
  updatedFrom?: Date | string;
  updatedTo?: Date | string;
  startDateFrom?: Date | string;
  startDateTo?: Date | string;
  endDateFrom?: Date | string;
  endDateTo?: Date | string;
  isRecurringMonthly?: boolean;
  isApplicableAtRegistration?: boolean;
};

@Injectable()
export class PaymentEventRepository {
  // ========== CONSTRUCTEUR DE FILTRES ==========
  private static buildFilters(filters: PaymentEventFilters): SQL | undefined {
    const conditions: SQL[] = [];

    // 1. Exact matches
    if (filters.id !== undefined) {
      conditions.push(eq(paymentEvents.id, filters.id));
    }
    if (filters.name) {
      conditions.push(eq(paymentEvents.name, filters.name));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(paymentEvents.isActive, filters.isActive));
    }

    if (filters.isRecurringMonthly !== undefined) {
      conditions.push(eq(paymentEvents.isRecurringMonthly, filters.isRecurringMonthly));
    }

    if (filters.isApplicableAtRegistration !== undefined) {
      conditions.push(eq(paymentEvents.isApplicableAtRegistration, filters.isApplicableAtRegistration));
    }

    if (filters.allowInstallments !== undefined) {
      conditions.push(eq(paymentEvents.allowInstallments, filters.allowInstallments));
    }
    // 3. Plages de montants
    if (filters.amountMin !== undefined) {
      conditions.push(gte(paymentEvents.amount, filters.amountMin));
    }
    if (filters.amountMax !== undefined) {
      conditions.push(lte(paymentEvents.amount, filters.amountMax));
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        sql`(${paymentEvents.name} ILIKE ${searchTerm} OR ${paymentEvents.description} ILIKE ${searchTerm})`
      );
    }
    // 5. Plages de dates
    if (filters.createdFrom) {
      conditions.push(gte(paymentEvents.createdAt, new Date(filters.createdFrom)));
    }
    if (filters.createdTo) {
      conditions.push(lte(paymentEvents.createdAt, new Date(filters.createdTo)));
    }
    if (filters.updatedFrom) {
      conditions.push(gte(paymentEvents.updatedAt, new Date(filters.updatedFrom)));
    }
    if (filters.updatedTo) {
      conditions.push(lte(paymentEvents.updatedAt, new Date(filters.updatedTo)));
    }
    if (filters.startDateFrom) {
      conditions.push(gte(paymentEvents.startDate, new Date(filters.startDateFrom)));
    }
    if (filters.startDateTo) {
      conditions.push(lte(paymentEvents.startDate, new Date(filters.startDateTo)));
    }
    if (filters.endDateFrom) {
      conditions.push(gte(paymentEvents.endDate, new Date(filters.endDateFrom)));
    }
    if (filters.endDateTo) {
      conditions.push(lte(paymentEvents.endDate, new Date(filters.endDateTo)));
    }

    if (conditions.length === 0) return undefined;
    return and(...conditions);
  }

  // ========== MÉTHODE UNIVERSELLE ==========
  async findMany(
    filters?: PaymentEventFilters,
    options?: {
      orderBy?: 'name' | 'amount' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt';
      order?: 'ASC' | 'DESC';
      limit?: number;
      offset?: number;
    }
  ): Promise<PayEventSelect[]> {
    const query = db.select().from(paymentEvents);

    const whereClause = filters ? PaymentEventRepository.buildFilters(filters) : undefined;
    if (whereClause) {
      query.where(whereClause);
    }

    // Tri par défaut : startDate DESC
    const orderField = options?.orderBy || 'startDate';
    const orderDir = options?.order || 'DESC';
    const orderFn = orderDir === 'DESC' ? desc : asc;
    query.orderBy(orderFn(paymentEvents[orderField]));

    if (options?.limit) query.limit(options.limit);
    if (options?.offset) query.offset(options.offset);

    return await query;
  }

  // ========== CRUD ==========

  async create(data: PayEventInsert): Promise<PayEventSelect> {
    const [event] = await db.insert(paymentEvents).values(data).returning();
    return event;
  }

  async findById(id: number): Promise<PayEventSelect | null> {
    const [event] = await db.select().from(paymentEvents).where(eq(paymentEvents.id, id));
    return event || null;
  }

  async findByIds(ids: number[]): Promise<PayEventSelect[]> {
    if (!ids.length) return [];
    return await db.select().from(paymentEvents).where(inArray(paymentEvents.id, ids));
  }

  async findByName(name: string): Promise<PayEventSelect | null> {
    const [event] = await db.select().from(paymentEvents).where(eq(paymentEvents.name, name));
    return event || null;
  }

  async findAll(filters?: PaymentEventFilters): Promise<PayEventSelect[]> {
    return this.findMany(filters, { orderBy: 'startDate', order: 'DESC' });
  }

  async findAllActive(filters?: PaymentEventFilters): Promise<PayEventSelect[]> {
    const activeFilters = { ...filters, isActive: true };
    return this.findMany(activeFilters, { orderBy: 'startDate', order: 'DESC' });
  }

  // ========== MÉTHODES UTILITAIRES ==========

  async update(id: number, data: Partial<PayEventInsert>): Promise<PayEventSelect | null> {
    
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

  // ========== UTILITAIRES ==========

  async exists(id: number): Promise<boolean> {
    const [event] = await db
      .select({ id: paymentEvents.id })
      .from(paymentEvents)
      .where(eq(paymentEvents.id, id));
    return !!event;
  }
}