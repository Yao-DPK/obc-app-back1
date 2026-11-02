import { Inject, Injectable } from '@nestjs/common';
import { db, paymentObligations, eq, and, desc, sql, or,gte, lte, asc} from '@/database/db';
import type { PayObligationInsert, PayObligationSelect } from '@/database/db';
import {  inArray, SQL } from 'drizzle-orm';
import * as schema from '../../database/schema'; // 👈 adapte le chemin
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE } from '@/database/providers/database.providers';

export type ObligationsFilters = {
  id?: number;
  eventId?: number;
  playerIds?: number[];
  totalAmount?: number;
  paidAmount?: number;
  dueDate?: Date | string;
  status?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
  updatedFrom?: Date | string;
  updatedTo?: Date | string;
  periodKey?: string;
}


@Injectable()
export class PaymentObligationRepository {
    constructor(@Inject(DATABASE) private readonly db: NodePgDatabase<typeof schema>) {}


  // ========== CONSTRUCTEUR DE FILTRES ==========
  private static buildObligationFilters(filters: ObligationsFilters): SQL | undefined {
    const conditions: SQL[] = [];

    // 1. ID exact
    if (filters.id !== undefined) {
      conditions.push(eq(paymentObligations.id, filters.id));
    }

    // 2. Event ID
    if (filters.eventId) {
      conditions.push(eq(paymentObligations.eventId, filters.eventId));
    }

    // 3. Player IDs (liste)
    if (filters.playerIds) {
      const ids = Array.isArray(filters.playerIds) ? filters.playerIds : [filters.playerIds];
      if (ids.length > 0) {
        conditions.push(inArray(paymentObligations.playerId, ids));
      }
    }

    // 4. Statut
    if (filters.status) {
      conditions.push(eq(paymentObligations.status, filters.status));
    }

    if (filters.periodKey) {
      conditions.push(eq(paymentObligations.periodKey, filters.periodKey));
    }

    // 5. Plages de dates
    if (filters.createdFrom) {
      conditions.push(gte(paymentObligations.createdAt, new Date(filters.createdFrom)));
    }
    if (filters.createdTo) {
      conditions.push(lte(paymentObligations.createdAt, new Date(filters.createdTo)));
    }
    if (filters.updatedFrom) {
      conditions.push(gte(paymentObligations.updatedAt, new Date(filters.updatedFrom)));
    }
    if (filters.updatedTo) {
      conditions.push(lte(paymentObligations.updatedAt, new Date(filters.updatedTo)));
    }

    if (conditions.length === 0) return undefined;
    return and(...conditions);
  }
    
  async findMany(
      filters?: ObligationsFilters,
      options?: {
        orderBy?: 'createdAt' | 'updatedAt';
        order?: 'ASC' | 'DESC';
        limit?: number;
        offset?: number;
      }
    ){
      const query = this.db.select().from(paymentObligations);

      const whereClause = filters ? PaymentObligationRepository.buildObligationFilters(filters) : undefined;
      if (whereClause) {
        query.where(whereClause);
      }

      // Tri par défaut : createdAt ASC
          const orderField = options?.orderBy || 'createdAt';
          const orderDir = options?.order || 'ASC';
          query.orderBy(
            orderDir === 'DESC'
              ? desc(paymentObligations[orderField])
              : asc(paymentObligations[orderField]),
          );
      
          
          if (options?.limit) query.limit(options.limit);
          if (options?.offset) query.offset(options.offset);
      
          //console.log(`query result: ${JSON.stringify(await query)}`)
          return await query;
      
    }

  async create(data: PayObligationInsert): Promise<PayObligationSelect> {
    const [obligation] = await this.db.insert(paymentObligations).values(data).returning();
    return obligation;
  }

  async createIfNotExists(
    data: PayObligationInsert,
  ): Promise<{ created: boolean; obligation: PayObligationSelect | null }> {
    console.log('DB instance:', (this.db as any)?.session?.client?.connectionParameters?.database);
    try {
      const obligation = await this.create(data);
      return { created: true, obligation };
    } catch (err: any) {
      // Violation de contrainte unique (code PostgreSQL 23505)
      console.log('ERR code:', err?.code, '| cause code:', err?.cause?.code);
      const code = err?.code ?? err?.cause?.code;
      if (code === '23505') return { created: false, obligation: null };
      throw err;
    }
  }


  async findAll(query: any): Promise<PayObligationSelect[] | null > {
    // On utilise findMany avec un filtre isActive seulement si on ne veut pas les inactifs
    const filters = query.includeInactive ? query : { ...query, isActive: true };
    //console.log(`findAll filters: ${JSON.stringify(filters)}`);

    return this.findMany(filters, {
      orderBy: 'createdAt',
      order: 'ASC',
    });
  }

  async findById(id: number): Promise<PayObligationSelect | null> {
    const [obligation] = await this.db.select().from(paymentObligations).where(eq(paymentObligations.id, id));
    return obligation || null;
  }

   async findByPlayerId(playerId: number): Promise<PayObligationSelect[]> {
    return this.db
        .select()
        .from(paymentObligations)
        .where(eq(paymentObligations.playerId, playerId));
    }

  async findByEvent(eventId: number): Promise<PayObligationSelect[]> {
    return this.db
      .select()
      .from(paymentObligations)
      .where(eq(paymentObligations.eventId, eventId));
  }

  async findByStatus(status: string): Promise<PayObligationSelect[]> {
    return this.db
      .select()
      .from(paymentObligations)
      .where(eq(paymentObligations.status, status));
  }

  async update(id: number, data: Partial<PayObligationInsert>): Promise<PayObligationSelect | null> {

    const [updated] = await this.db
      .update(paymentObligations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentObligations.id, id))
      .returning();
    return updated || null;
  }

  async updateStatus(id: number, status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled') {
    return this.update(id, { status });
  }

  async updatePaidAmount(id: number, amount: number) {
    const obligation = await this.findById(id);
    if (!obligation) return null;
    const newPaid = Number(obligation.paidAmount || 0) + amount;
    const remaining = Number(obligation.totalAmount || 0) - newPaid;
    const status = newPaid >= Number(obligation.totalAmount) ? 'paid' : 'partial';
    return this.update(id, {
      paidAmount: newPaid,
      remainingAmount: remaining,
      status,
    });
  }

  async getDashboardStats(): Promise<{
    totalObligations: number;
    totalPaid: number;
    totalRemaining: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  }> {
    const [result] = await this.db
      .select({
        totalObligations: sql<number>`count(*)`,
        totalPaid: sql<number>`sum(${paymentObligations.paidAmount})`,
        totalRemaining: sql<number>`sum(${paymentObligations.remainingAmount})`,
        paidCount: sql<number>`count(*) filter (where ${paymentObligations.status} = 'paid')`,
        pendingCount: sql<number>`count(*) filter (where ${paymentObligations.status} = 'pending')`,
        overdueCount: sql<number>`count(*) filter (where ${paymentObligations.status} = 'overdue')`,
      })
      .from(paymentObligations);

    return {
      totalObligations: Number(result?.totalObligations || 0),
      totalPaid: Number(result?.totalPaid || 0),
      totalRemaining: Number(result?.totalRemaining || 0),
      paidCount: Number(result?.paidCount || 0),
      pendingCount: Number(result?.pendingCount || 0),
      overdueCount: Number(result?.overdueCount || 0),
    };
  }
}