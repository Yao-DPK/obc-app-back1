// apps/api/src/modules/documents/document.dto.ts
import { z } from 'zod';

export const DocumentSchema = z.object({
  id: z.number(),
  userId: z.number(),
  type: z.string(),
  fileId: z.string(),
  publicUrl: z.string().url(),
  documentStatus: z.enum(['En attente de Validation', 'Validé', 'Rejeté', 'Expiré', 'Invalide']).default('En attente de Validation').optional(),
  isObligatory: z.boolean().optional().default(false),
  validatedAt: z.date().nullable(),
  validatedBy: z.number().nullable(),
  uploadedAt: z.date(),
});

export const CreateDocumentSchema = DocumentSchema.omit({
  id: true,
  validatedAt: true,
  validatedBy: true,
  uploadedAt: true,
});

export const ValidateDocumentSchema = z.object({
  documentId: z.number(),
  adminId: z.number(),
  status: z.enum(['Validé', 'Rejeté', 'Expiré', 'Invalide', 'En attente de Validation']),
});

export const RequestDocumentSchema = z.object({ userId: z.number()});

export type RequestDocumentDto = z.infer<typeof RequestDocumentSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type CreateDocumentDto = z.infer<typeof CreateDocumentSchema>;
export type ValidateDocumentDto = z.infer<typeof ValidateDocumentSchema>;