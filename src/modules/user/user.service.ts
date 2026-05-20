import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TRPCError } from '@trpc/server';
import { users } from 'src/database/schema';
import { db, eq } from 'src/database/db';

@Injectable()
export class UserService {
  async getProfile(userId: number) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(userId: number, data: any) {
    await db.update(users).set(data).where(eq(users.id, userId));
    return { success: true };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid old password' });
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));
    return { success: true };
  }
  
}