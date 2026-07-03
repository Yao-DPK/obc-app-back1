import { Injectable } from '@nestjs/common';
import { db, guardianRelationships, users, eq, and } from '../../database/db';
import { TRPCError } from '@trpc/server';

@Injectable()
export class GuardianService {
  async linkPlayer(guardianId: number, playerId: number, permissions?: any) {
    const [player] = await db
      .select()
      .from(users)
      .where(eq(users.id, playerId));
    if (!player)
      throw new Error('Player not found' );
    const [existing] = await db
      .select()
      .from(guardianRelationships)
      .where(
        and(
          eq(guardianRelationships.guardianId, guardianId),
          eq(guardianRelationships.playerId, playerId),
        ),
      );
    if (existing)
      throw new Error('Link already exists');
    const [link] = await db
      .insert(guardianRelationships)
      .values({
        guardianId,
        playerId,
        permissions: permissions || { canPay: true, canRegister: false },
      })
      .returning();
    return link;
  }

  async getGuardians(playerId: number) {
    const relationships = await db
      .select()
      .from(guardianRelationships)
      .where(eq(guardianRelationships.playerId, playerId));

    const guardianIds = relationships.map((r) => r.guardianId);
    return guardianIds;
  }

  async getPlayers(guardianId: number) {
    const relationships = await db
      .select()
      .from(guardianRelationships)
      .where(eq(guardianRelationships.guardianId, guardianId));

    const playerIds = relationships.map((r) => r.playerId);
    return playerIds;
  }

}
