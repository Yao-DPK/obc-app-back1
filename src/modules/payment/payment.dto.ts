// src/types/payment.dto.ts
import { z } from 'zod';

// ============================================================
// OBLIGATIONS
// ============================================================

export const CreateObligationSchema = z.object({
  eventId: z.number().positive(),
  playerIds: z.array(z.number().positive()).min(1),
  totalAmount: z.number().positive(),
  dueDate: z.string().datetime().optional(),
});

export type CreateObligationDto = z.infer<typeof CreateObligationSchema>;

// ============================================================
// INTENTIONS DE PAIEMENT
// ============================================================

export const CreateIntentSchema = z.object({
  obligationId: z.number().positive(),
  amount: z.number().positive(),
  method: z.enum(['momo', 'card']),
  transactionReference: z.string().optional(),
  transactionMetadata: z
    .object({
      phone: z.string().optional(),
      cart_id: z.string(),
      custom_field: z.string(),
    })
    .optional(),
});

export type CreateIntentDto = z.infer<typeof CreateIntentSchema>;

// ============================================================
// VÉRIFICATION
// ============================================================

export const VerifyPaymentSchema = z.object({
  intentId: z.number().positive(),
  status: z.enum(['verified', 'rejected']),
});

export type VerifyPaymentDto = z.infer<typeof VerifyPaymentSchema>;

// ============================================================
// ÉVÉNEMENTS (PAYMENT EVENTS)
// ============================================================

export interface PaymentEvent {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  allowInstallments: boolean | null;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreatePaymentEventDto {
  name: string;
  description?: string;
  amount: number;
  allowInstallments?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface UpdatePaymentEventDto extends Partial<CreatePaymentEventDto> {
  isActive?: boolean;
}

// ============================================================
// TYPES DÉRIVÉS (pour le store)
// ============================================================

export type PaymentObligation = {
  id: number;
  userId: number;
  eventId: number;
  playerIds: number[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string | null;
  description: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
  updatedAt: string;
};

export type PaymentIntent = {
  id: number;
  obligationId: number;
  userId: number;
  amount: number;
  method: 'momo' | 'card';
  transactionReference: string | null;
  transactionMetadata: {
    phone?: string;
    cart_id: string;
    custom_field: string;
  } | null;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';
  declaredAt: string;
  verifiedBy: number | null;
  verifiedAt: string | null;
  createdAt: string;
};

export type PaymentSummary = {
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
};