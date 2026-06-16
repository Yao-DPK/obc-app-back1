import { UserInsert, UserSelect } from 'tabase/schema';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: Omit<UserSelect, "passwordHash">; // ou { id: number; role: string; email: string; ... }
}