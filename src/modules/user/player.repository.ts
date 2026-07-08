import { Injectable } from '@nestjs/common';
import { db, players, eq, inArray } from '../../database/db';
import { PlayerInsert, PlayerSelect } from '../../database/db';

@Injectable()
export class PlayerRepository {
  // ========== CRUD ==========

  async create(data: PlayerInsert): Promise<PlayerSelect> {
    const [player] = await db.insert(players).values(data).returning();
    return player;
  }

  async findById(id: number): Promise<PlayerSelect | null> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || null;
  }

  async findByUserId(userId: number): Promise<PlayerSelect | null> {
    const [player] = await db.select().from(players).where(eq(players.userId, userId));
    return player || null;
  }

  async findByBirthDay(birth_date: string): Promise<PlayerSelect | null> {
    const [player] = await db.select().from(players).where(eq(players.birthDate, birth_date));
    return player || null;
  }


  async findByUserIds(userIds: number[]): Promise<PlayerSelect[]> {
    if (!userIds || userIds.length === 0) return [];
    return await db.select().from(players).where(inArray(players.userId, userIds));
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

  // ========== LISTES ==========

  async findAll(): Promise<PlayerSelect[]> {
    return await db.select().from(players);
  }

  // ========== UTILITAIRES ==========

  async exists(userId: number): Promise<boolean> {
    const [player] = await db.select({ id: players.id }).from(players).where(eq(players.userId, userId));
    return !!player;
  }
}