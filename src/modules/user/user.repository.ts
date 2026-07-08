import { Injectable } from '@nestjs/common';
import { db, users, eq, and, inArray, players, PlayerSelect } from '../../database/db';
import { UserInsert, UserSelect } from '../../database/db';

@Injectable()
export class UserRepository {
  // ========== CRUD ==========

  async create(data: UserInsert): Promise<UserSelect> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async findById(id: number): Promise<UserSelect | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async findByIds(ids: number[]): Promise<UserSelect[]> {
    if (!ids || ids.length === 0) return [];
    return await db.select().from(users).where(inArray(users.id, ids));
  }

  async findByEmail(email: string): Promise<UserSelect | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async update(id: number, data: Partial<UserInsert>): Promise<UserSelect | null> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // ========== LISTES ==========

  async findAll(): Promise<UserSelect[]> {
    return await db.select().from(users);
  }

  async findByRole(role: 'player' | 'parent' | 'admin' | 'super_admin'): Promise<UserSelect[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async findByStatus(
    status: 'pre_inscrit' | 'inscrit' | 'rejeté' | 'suspendu' | 'parent_invité' | 'parent_inscrit',
  ): Promise<UserSelect[]> {
    return await db.select().from(users).where(eq(users.registrationStatus, status));
  }

  /* async findPlayersWithDetails(): Promise<{user: UserSelect, player: PlayerSelect}[]> {
    const players_with_detail = await db
      .select()
      .from(users)
      .innerJoin(players, eq(users.id, players.userId))
      .where(eq(users.role, 'player'));

    return players_with_detail;
  } */

  // ========== UTILITAIRES ==========

  async exists(id: number): Promise<boolean> {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
    return !!user;
  }
}