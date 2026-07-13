import { Injectable } from '@nestjs/common';
import { db, guardianRelationships, eq, and } from '../../database/db';
import type { GuardianRelationshipInsert, GuardianRelationshipSelect } from '../../database/db';

@Injectable()
export class GuardianRelationshipsRepository {
  // ========== CRUD ==========

  async create(data: GuardianRelationshipInsert): Promise<GuardianRelationshipSelect> {
    const [result] = await db.insert(guardianRelationships).values(data).returning();
    return result;
  }

  async findById(id: number): Promise<GuardianRelationshipSelect | null> {
    const [result] = await db
      .select()
      .from(guardianRelationships)
      .where(eq(guardianRelationships.id, id));
    return result || null;
  }

  async update(id: number, data: Partial<GuardianRelationshipInsert>): Promise<GuardianRelationshipSelect | null> {
    const [updated] = await db
      .update(guardianRelationships)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(guardianRelationships.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: number): Promise<void> {
    await db.delete(guardianRelationships).where(eq(guardianRelationships.id, id));
  }

  // ========== RECHERCHE ==========

  async findByGuardianId(guardianId: number): Promise<GuardianRelationshipSelect[]> {
    return await db
      .select()
      .from(guardianRelationships)
      .where(eq(guardianRelationships.guardianId, guardianId));
  }

  async findByGuardianIdAndStatus(guardianId: number, status: 'pending' | 'confirmed' | 'rejected'): Promise<GuardianRelationshipSelect[]> {
    return await db
      .select()
      .from(guardianRelationships)
      .where(
        and(
          eq(guardianRelationships.guardianId, guardianId),
          eq(guardianRelationships.status, status),
        )
      );
  }

  async findByPlayerId(playerId: number): Promise<GuardianRelationshipSelect[]> {
    return await db
      .select()
      .from(guardianRelationships)
      .where(eq(guardianRelationships.playerId, playerId));
  }

  async findLink(guardianId: number, playerId: number): Promise<GuardianRelationshipSelect | null> {
    const [result] = await db
      .select()
      .from(guardianRelationships)
      .where(
        and(
          eq(guardianRelationships.guardianId, guardianId),
          eq(guardianRelationships.playerId, playerId),
        ),
      );
    return result || null;
  }

  async exists(guardianId: number, playerId: number): Promise<boolean> {
    const link = await this.findLink(guardianId, playerId);
    return !!link;
  }
}