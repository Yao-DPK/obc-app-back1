import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();
const publicProcedure = t.procedure;

const appRouter = t.router({
  user: t.router({
    getProfile: publicProcedure.input(z.object({ userId: z.number() })).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    updateProfile: publicProcedure.input(z.object({
      email: z.string().email().optional(),
      notificationPreferences: z.object({
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
        push: z.boolean().optional(),
      }).optional(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    changePassword: publicProcedure.input(z.object({
      oldPassword: z.string().min(6),
      newPassword: z.string().min(6),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)
  }),
  document: t.router({
    create: publicProcedure.input(z.object({
      id: z.string(),
      userId: z.number(),
      type: z.string(),
      fileId: z.string(),
      publicUrl: z.string().url(),
      isObligatory: z.boolean().optional(),
      createdAt: z.string(),
    }).omit({
      id: true,
      createdAt: true,
    })).output(z.object({
      id: z.string(),
      userId: z.number(),
      type: z.string(),
      fileId: z.string(),
      publicUrl: z.string().url(),
      isObligatory: z.boolean().optional(),
      createdAt: z.string(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    findByUser: publicProcedure.input(z.object({ userId: z.number() })).output(z.array(z.object({
      id: z.string(),
      userId: z.number(),
      type: z.string(),
      fileId: z.string(),
      publicUrl: z.string().url(),
      isObligatory: z.boolean().optional(),
      createdAt: z.string(),
    }))).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)
  }),
  guardian: t.router({
    linkPlayer: publicProcedure.input(z.object({
      guardianId: z.number(),
      playerId: z.number(),
      permissions: z.object({
        canPay: z.boolean().optional(),
        canRegister: z.boolean().optional(),
      }).optional(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    getGuardians: publicProcedure.input(z.object({ playerId: z.number() })).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    getPlayers: publicProcedure.input(z.object({ guardianId: z.number() })).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)
  }),
  paymentDeclaration: t.router({
    create: publicProcedure.input(z.object({
      userId: z.number(),
      amount: z.number().positive(),
      method: z.enum(['wave', 'orange_money', 'cash']),
      transactionReference: z.string().optional(),
      reason: z.string(),
      playerIds: z.array(z.number()),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    listByUser: publicProcedure.input(z.object({ userId: z.number() })).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    verify: publicProcedure.input(z.object({
      declarationId: z.number(),
      status: z.enum(['verified', 'rejected']),
      adminId: z.number().optional(), // on peut le passer explicitement
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)
  })
});
export type AppRouter = typeof appRouter;

