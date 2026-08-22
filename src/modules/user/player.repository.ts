// apps/api/src/modules/user/player.repository.ts
import { Injectable } from '@nestjs/common';
import { db } from 'src/database/db';
import { players, PlayerSelect } from '../../database/schema';
import {
  eq,
  and,
  or,
  inArray,
  ilike,
  gte,
  lte,
  SQL,
  sql,
} from 'drizzle-orm';
import { PlayerInsert } from '../../database/db';

// ============================================================
// FILTRES DYNAMIQUES
// ============================================================
export type PlayerFilters = {
  id?: number;
  userId?: number;
  birthDate?: string; // exact match
  birthDateFrom?: Date | string;
  birthDateTo?: Date | string;
  school?: string;
  class?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  search?: string; // recherche dans school, class
};

@Injectable()
export class PlayerRepository {
  // ============================================================
  // CONSTRUCTEUR DE FILTRES
  // ============================================================
  private static buildFilters(filters: PlayerFilters): SQL | undefined {
    const conditions: SQL[] = [];

    // 1. Exact matches
    if (filters.id !== undefined) {
      conditions.push(eq(players.id, filters.id));
    }
    if (filters.userId !== undefined) {
      conditions.push(eq(players.userId, filters.userId));
    }
    if (filters.birthDate) {
      conditions.push(eq(players.birthDate, filters.birthDate));
    }
    if (filters.school) {
      conditions.push(eq(players.school, filters.school));
    }
    if (filters.class) {
      conditions.push(eq(players.class, filters.class));
    }
    if (filters.emergencyContactName) {
      conditions.push(eq(players.emergencyContactName, filters.emergencyContactName));
    }
    if (filters.emergencyContactPhone) {
      conditions.push(eq(players.emergencyContactPhone, filters.emergencyContactPhone));
    }

    if (conditions.length === 0) {
      return undefined;
    }
    return and(...conditions);
  }

  // ============================================================
  // MÉTHODES UNIVERSELLES
  // ============================================================

  async findMany(filters?: PlayerFilters): Promise<PlayerSelect[]> {
    const whereClause = filters ? PlayerRepository.buildFilters(filters) : undefined;
    const query = db.select().from(players);
    if (whereClause) {
      query.where(whereClause);
    }
    return await query;
  }

  async findOne(filters?: PlayerFilters): Promise<PlayerSelect | null> {
    const whereClause = filters ? PlayerRepository.buildFilters(filters) : undefined;
    const query = db.select().from(players);
    if (whereClause) {
      query.where(whereClause);
    }
    const [result] = await query.limit(1);
    return result || null;
  }

  // ============================================================
  // CRUD EXISTANT (refactorisé)
  // ============================================================

  async create(data: PlayerInsert): Promise<PlayerSelect> {
    const [player] = await db.insert(players).values(data).returning();
    return player;
  }

  async findById(id: number): Promise<PlayerSelect | null> {
    return this.findOne({ id });
  }

  async findByUserId(userId: number): Promise<PlayerSelect | null> {
    return this.findOne({ userId });
  }

  async findByBirthDay(birth_date: string): Promise<PlayerSelect | null> {
    return this.findOne({ birthDate: birth_date });
  }

  async findByUserIds(userIds: number[]): Promise<PlayerSelect[]> {
    if (!userIds || userIds.length === 0) return [];
    const query = db.select().from(players).where(inArray(players.userId, userIds));
    return await query;
  }

  async update(id: number, data: Partial<PlayerInsert>): Promise<PlayerSelect | null> {
    const [updated] = await db
      .update(players)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(players.id, id))
      .returning();
    return updated || null;
  }

  async updateByUserId(userId: number, data: Partial<PlayerInsert>): Promise<PlayerSelect | null> {
    const [updated] = await db
      .update(players)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(players.userId, userId))
      .returning();
    return updated || null;
  }

  async delete(id: number): Promise<void> {
    await db.delete(players).where(eq(players.id, id));
  }

  async deleteByUserId(userId: number): Promise<void> {
    await db.delete(players).where(eq(players.userId, userId));
  }

  // ============================================================
  // LISTES (refactorisées)
  // ============================================================

  async findAll(): Promise<PlayerSelect[]> {
    return this.findMany();
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  async exists(userId: number): Promise<boolean> {
    const [player] = await db.select({ id: players.id }).from(players).where(eq(players.userId, userId));
    return !!player;
  }
}