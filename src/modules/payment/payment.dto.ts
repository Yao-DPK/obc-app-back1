import { z } from 'zod';

// ========== CRÉATION D'OBLIGATION ==========
export const CreateObligationSchema = z.object({
  eventId: z.number().positive(),
  playerIds: z.array(z.number().positive()).min(1),
  totalAmount: z.number().positive(),
  dueDate: z.string().datetime().optional(),
});

export type CreateObligationDto = z.infer<typeof CreateObligationSchema>;

// ========== CRÉATION D'INTENTION ==========
export const CreateIntentSchema = z.object({
  obligationId: z.number().positive(),
  amount: z.number().positive(),
  method: z.enum(['momo', 'card']),
  transactionReference: z.string().optional(),
  transactionMetadata: z.object({
    phone: z.string().optional(),
    cart_id: z.string(),
    custom_field: z.string()
  }).optional(),
});

export type CreateIntentDto = z.infer<typeof CreateIntentSchema>;

// ========== VÉRIFICATION ==========
export const VerifyPaymentSchema = z.object({
  intentId: z.number().positive(),
  status: z.enum(['verified', 'rejected']),
});

export type VerifyPaymentDto = z.infer<typeof VerifyPaymentSchema>;