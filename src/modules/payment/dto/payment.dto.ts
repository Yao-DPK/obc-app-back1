import { z } from 'zod';

export const CreatePaymentDeclarationSchema = z.object({
  userId: z.number(),
  amount: z.number().positive(),
  method: z.enum(['wave', 'orange_money', 'cash']),
  transactionReference: z.string().optional(),
  reason: z.string(),
  playerIds: z.array(z.number()),
});

export const VerifyPaymentSchema = z.object({
  declarationId: z.number(),
  status: z.enum(['verified', 'rejected']),
  adminId: z.number().optional(), // on peut le passer explicitement
});