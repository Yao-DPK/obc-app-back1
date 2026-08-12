import { users } from '@/database/db';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';

/* export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  secretCode: string;

  @IsIn(['parent', 'player', 'admin', 'super_admin'])
  role: 'parent' | 'player' | 'admin' | 'super_admin';
} */

export const UserSchema = createInsertSchema(users, {
  // On peut surcharger les validations de champs existants
  role: z.enum(['admin', 'player', 'parent', 'super_admin']),
}).omit({ id: true, passwordHash: true}).extend({
  password: z.string(),
  secretCode: z.string(),
});

export type RegisterDto = z.infer<typeof UserSchema>;
