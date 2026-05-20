// apps/api/src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { db, users, eq, and } from 'src/database/db';
import { UserInsert, UserSelect } from 'src/database/db';

@Injectable()
export class UserRepository {
  async create(data: UserInsert): Promise<UserSelect> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async findByEmail(email: string): Promise<UserSelect | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    console.log("Found User: ", user);
    return user || null;
  }

  async findById(id: number): Promise<UserSelect | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async update(id: number, data: Partial<UserInsert>): Promise<UserSelect | null> {
    const [updated] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return updated || null;
  }

  async findByStatus(status: 'pre_inscrit' | 'inscrit' | 'actif' | 'suspendu' | 'parent_invité' | 'validé'): Promise<UserSelect[]> {
    return db.select().from(users).where(eq(users.registrationStatus, status));
  }
}