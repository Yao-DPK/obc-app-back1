// apps/api/src/modules/guardian/guardian-relationships.repository.ts
import { Injectable } from '@nestjs/common';
import { and } from 'drizzle-orm';
import { db, guardianRelationships } from 'src/database/db';

@Injectable()
export class GuardianRelationshipsRepository {
  async create(data: any) {
    const [result] = await db.insert(guardianRelationships).values(data).returning();
    return result;
  }
  // ... autres méthodes
}