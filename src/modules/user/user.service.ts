import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TRPCError } from '@trpc/server';
import { users } from '../../database/schema';
import { db, eq, and, not } from '../../database/db';

@Injectable()
export class UserService {

  

  async getUser(userId: number) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error('NOT_FOUND');
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async getUserRestricted(userId: number) {
    const [user] = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.id, userId),
      not(eq(users.role, 'admin')),
      not(eq(users.role, 'super_admin'))
    )
  );
    if (!user) throw new Error('NOT_FOUND');
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }


  async updateProfile(userId: number, data: any) {
    await db.update(users).set(data).where(eq(users.id, userId));
    return { success: true };
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error('NOT_FOUND' );
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid)
      throw new Error(
        'Invalid old password',
      );
    const newHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, userId));
    return { success: true };
  }
}
