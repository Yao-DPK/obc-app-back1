import { z } from 'zod';

export const PaymentObligationSchema = z.object({
  id: z.number(),
  playerId: z.number().nullable(),
  amount: z.number().positive(),
  dueDate: z.iso.date().optional(),
  description: z.string().min(1),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled', 'ongoing']),
  createdAt: z.date(),
});

export const CreatePaymentObligationSchema = PaymentObligationSchema.omit({
  id: true,
  status: true,
  createdAt: true,
}).extend({
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled', 'ongoing']).default('pending'),
});

export const UpdatePaymentObligationSchema = CreatePaymentObligationSchema.partial();

export type PaymentObligation = z.infer<typeof PaymentObligationSchema>;
export type CreatePaymentObligationDto = z.infer<typeof CreatePaymentObligationSchema>;
export type UpdatePaymentObligationDto = z.infer<typeof UpdatePaymentObligationSchema>;