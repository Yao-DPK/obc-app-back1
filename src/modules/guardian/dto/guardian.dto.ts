import { z } from 'zod';

export const LinkPlayerSchema = z.object({
  guardianId: z.number(),
  playerId: z.number(),
  permissions: z.object({
    canPay: z.boolean().optional(),
    canRegister: z.boolean().optional(),
  }).optional(),
});