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

export const CreatePaymentEventSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(500).optional(),
  amount: z.number().positive('Amount must be positive'),
  allowInstallments: z.boolean().default(false),
  startDate: z.string().datetime().optional(), // ISO string
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

export type CreatePaymentEventDto = z.infer<typeof CreatePaymentEventSchema>;

export const UpdatePaymentEventSchema = CreatePaymentEventSchema.partial();

export type UpdatePaymentEventDto = z.infer<typeof UpdatePaymentEventSchema>;

export const CreateIntentSchema = z.object({
  eventId: z.number().int().positive(),
  paymentMethod: z.enum(['momo', 'card']),
  email: z.string().email(),
  phone: z.string().optional(),
  name: z.string().optional(),
  playerIds: z.array(z.number().int().positive()).optional(),
});

export type CreateIntentDto = z.infer<typeof CreateIntentSchema>;
