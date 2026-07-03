// apps/api/src/modules/guardian/guardian-relationships.repository.ts
import { Injectable } from '@nestjs/common';
import { and } from 'drizzle-orm';
import { db, guardianRelationships, eq } from '../../database/db';

@Injectable()
export class GuardianRelationshipsRepository {
  async create(data: any) {
    const [result] = await db
      .insert(guardianRelationships)
      .values(data)
      .returning();
    return result;
  }
  
  async update(
    id: number,
    data:any){
    const [updated] = await db
    .update(guardianRelationships)
    .set({...data})
    .where(eq(guardianRelationships.id, id))
    .returning()
    ;
  }
}

