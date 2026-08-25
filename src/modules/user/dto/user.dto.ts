// dto/user.dto.ts
import { players, users } from '@/database/db';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Schémas de base
export const UserSelectSchema = createSelectSchema(users).omit({ passwordHash: true });
export const UserInsertSchema = createInsertSchema(users);
export const PlayerSelectSchema = createSelectSchema(players);
export const PlayerInsertSchema = createInsertSchema(players);
/* 
export type UserTDto = z.infer<typeof UserSelectSchema>;
export type UserT2Dto = z.infer<typeof UserInsertSchema>;
 */

// DTO pour la réponse avec détails joueur (combinaison)
export const UserWithPlayerSchema = UserSelectSchema.extend({
  playerDetails: PlayerSelectSchema.nullable(),
});

export type UserWithPlayer = z.infer<typeof UserWithPlayerSchema>;

// DTO pour la mise à jour du profil (on autorise la mise à jour des champs de users et players)
export const UpdateProfileSchema = UserInsertSchema.partial().extend({
  // On peut ajouter des champs provenant de players
  birthDate: z.string().optional(),
  school: z.string().optional(),
  class: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  attestationData: z.object({
    signatoryType: z.enum(['self', 'guardian']),
    selectedGuardianIndex: z.number().optional(),
    signatoryFullName: z.string(),
    acceptedTerms: z.boolean(),
    signatureUrl: z.string(),
  }).optional(),
}).omit({ 
  passwordHash: true, 
  createdAt: true, 
  updatedAt: true 
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;