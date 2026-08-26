// src/types/payment.dto.ts
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { paymentObligations, paymentIntents, paymentEvents } from '@/database/schema';

// ============================================================
// OBLIGATIONS
// ============================================================

export const ObligationSelectSchema = createSelectSchema(paymentObligations);
export const ObligationInsertSchema = createInsertSchema(paymentObligations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateObligationDto = z.infer<typeof ObligationInsertSchema>;
export type UpdateObligationDto = Partial<CreateObligationDto>;
export type PaymentObligation = z.infer<typeof ObligationSelectSchema>;

// ============================================================
// INTENTIONS
// ============================================================

export const IntentSelectSchema = createSelectSchema(paymentIntents);
export const IntentInsertSchema = createInsertSchema(paymentIntents).omit({
  id: true,
  createdAt: true,
});


export type CreateIntentDto = z.infer<typeof IntentInsertSchema>;
export type PaymentIntent = z.infer<typeof IntentSelectSchema>;

// ============================================================
// VÉRIFICATION
// ============================================================

export const VerifyPaymentSchema = z.object({
  intentId: z.number().positive(),
  status: z.enum(['verified', 'rejected']),
});

export const VerifyIntentSchema = z.object({
  status: z.enum(['paid', 'failed']),
  rejectionReason: z.string().optional(),
});

export type VerifyPaymentDto = z.infer<typeof VerifyPaymentSchema>;
export type VerifyIntentDto = z.infer<typeof VerifyIntentSchema>;

// ========== SCHÉMA DE RÉPONSE (avec détails) ==========

export const IntentResponseSchema = IntentSelectSchema.extend({
  obligationDescription: z.string().optional(),
  playerName: z.string().optional(),
  signedJustificationUrl: z.string().optional(),
});

export type IntentResponseDto = z.infer<typeof IntentResponseSchema>;


// ============================================================
// ÉVÉNEMENTS DE PAIEMENT
// ============================================================

export const PaymentEventSelectSchema = createSelectSchema(paymentEvents);
export const PaymentEventInsertSchema = createInsertSchema(paymentEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreatePaymentEventDto = z.infer<typeof PaymentEventInsertSchema>;
export type UpdatePaymentEventDto = Partial<CreatePaymentEventDto>;
export type PaymentEvent = z.infer<typeof PaymentEventSelectSchema>;

// ============================================================
// RÉSUMÉ
// ============================================================

export interface PaymentSummary {
  totalObligations: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  statusCounts: {
    pending: number;
    partial: number;
    paid: number;
    overdue: number;
  };
}