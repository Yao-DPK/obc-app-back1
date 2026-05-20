import { z } from 'zod';

// Schéma pour un garant
export const GuardianSchema = z.object({
  email: z.email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  relationship: z.string(),
  phone: z.string().optional(),
});

export const AttestationSchema = z.object({
  signatoryType: z.enum(['self', 'guardian']),
  selectedGuardianIndex: z.number().optional(),
  signatoryFullName: z.string().min(2),
  acceptedTerms: z.boolean(),
});


// Schéma principal de pré-inscription
export const PreRegistrationSchema = z.object({
  // Infos du compte
  email: z.email(),
  password: z.string().min(6),
  
  // Infos personnelles du joueur
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string(),
  gender: z.enum(['M', 'F']),
  phone: z.string().optional(),
  address: z.string().optional(),
  school: z.string().optional(),
  class: z.string().optional(),
  
  // Mode autonome ou avec garant
  selfManaged: z.boolean().default(false),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  
  // Liste des garants (si non autonome)
  guardians: z.array(GuardianSchema).default([]).optional(),
});

export const FullRegistrationSchema = z.object({
  step1: PreRegistrationSchema,
  step2: AttestationSchema,
});


export type PreRegistrationDto = z.infer<typeof PreRegistrationSchema>;