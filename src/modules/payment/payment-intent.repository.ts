// src/modules/payment/repositories/payment-intent.repository.ts
import { paymentIntents } from '@/database/schema';
import { Injectable } from '@nestjs/common';
import { db, type PayIntentInsert, type PayIntentSelect } from '@/database/db';

import { and, desc, eq, gte, inArray, lte, sql, SQL } from 'drizzle-orm';

// ========== FILTRES ==========
export type IntentFilters = {
  id?: number;
  obligationId?: number;
  userId?: number;
  status?: string | string[];
  method?: string | string[];
  createdFrom?: Date | string;
  createdTo?: Date | string;
  verifiedBy?: number;
  search?: string;
};

@Injectable()
export class PaymentIntentRepository {
  // ========== CONSTRUCTEUR DE FILTRES ==========
  private static buildFilters(filters: IntentFilters): SQL | undefined {
    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(paymentIntents.id, filters.id));
    }
    if (filters.obligationId !== undefined) {
      conditions.push(eq(paymentIntents.obligationId, filters.obligationId));
    }
    if (filters.userId !== undefined) {
      conditions.push(eq(paymentIntents.userId, filters.userId));
    }
    if (filters.verifiedBy !== undefined) {
      conditions.push(eq(paymentIntents.verifiedBy, filters.verifiedBy));
    }

    // Status (single or multiple)
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        if (filters.status.length > 0) {
          conditions.push(inArray(paymentIntents.status, filters.status));
        }
      } else {
        conditions.push(eq(paymentIntents.status, filters.status));
      }
    }

    // Method (single or multiple)
    if (filters.method) {
      if (Array.isArray(filters.method)) {
        if (filters.method.length > 0) {
          conditions.push(inArray(paymentIntents.method, filters.method));
        }
      } else {
        conditions.push(eq(paymentIntents.method, filters.method));
      }
    }

    // Date ranges
    if (filters.createdFrom) {
      conditions.push(gte(paymentIntents.createdAt, new Date(filters.createdFrom)));
    }
    if (filters.createdTo) {
      conditions.push(lte(paymentIntents.createdAt, new Date(filters.createdTo)));
    }

    if (conditions.length === 0) {
      return undefined;
    }
    return and(...conditions);
  }

  // ========== MÉTHODES UNIVERSELLES ==========

  async findMany(
    filters?: IntentFilters,
    options?: { orderBy?: 'createdAt' | 'declaredAt' | 'amount'; order?: 'ASC' | 'DESC'; limit?: number; offset?: number }
  ): Promise<PayIntentSelect[]> {
    const whereClause = filters ? PaymentIntentRepository.buildFilters(filters) : undefined;
    const query = db.select().from(paymentIntents);
    if (whereClause) {
      query.where(whereClause);
    }

    const orderField = options?.orderBy || 'createdAt';
    const orderDir = options?.order || 'DESC';
    query.orderBy(orderDir === 'DESC' ? desc(paymentIntents[orderField]) : sql`${paymentIntents[orderField]} ASC`);

    if (options?.limit) query.limit(options.limit);
    if (options?.offset) query.offset(options.offset);

    return await query;
  }

  async findOne(filters?: IntentFilters): Promise<PayIntentSelect | null> {
    const [result] = await this.findMany(filters, { limit: 1 });
    return result || null;
  }

  // ========== CRUD ==========

  async create(data: PayIntentInsert): Promise<PayIntentSelect> {
    const [intent] = await db.insert(paymentIntents).values(data).returning();
    return intent;
  }

  async findById(id: number): Promise<PayIntentSelect | null> {
    return this.findOne({ id });
  }

  async findPendingByObligation(obligationId: number): Promise<PayIntentSelect[]> {
    return this.findMany({ obligationId, status: 'pending' }, { orderBy: 'createdAt', order: 'DESC' });
  }

  async update(id: number, data: Partial<PayIntentInsert>): Promise<PayIntentSelect | null> {
    const [updated] = await db
      .update(paymentIntents)
      .set(data)
      .where(eq(paymentIntents.id, id))
      .returning();
    return updated || null;
  }


  async updateStatus(id: number, status: 'pending' | 'paid' | 'failed' | 'expired') {
    return this.update(id, { status });
  }

  async verify(id: number, adminId: number) {
    return this.update(id, {
      status: 'paid',
      verifiedBy: adminId,
      verifiedAt: new Date(),
    });
  }

  async delete(id: number): Promise<void> {
    await db.delete(paymentIntents).where(eq(paymentIntents.id, id));
  }

  // ========== STATISTIQUES ==========

  async countPending(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentIntents)
      .where(eq(paymentIntents.status, 'pending'));
    return Number(result[0]?.count || 0);
  }
}