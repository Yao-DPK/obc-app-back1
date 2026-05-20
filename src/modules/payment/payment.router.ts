import { Router, Mutation, Query, Input } from 'nestjs-trpc-v2';
import { z } from 'zod';
import { PaymentService } from './payment.service';
import { CreatePaymentDeclarationSchema, VerifyPaymentSchema } from './dto/payment.dto';

@Router({ alias: 'paymentDeclaration' })
export class PaymentRouter {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation({ input: CreatePaymentDeclarationSchema })
  async create(@Input() input: any) {
    const { userId, ...data } = input;
    return this.paymentService.create(userId, data);
  }

  @Query({ input: z.object({ userId: z.number() }) })
  async listByUser(@Input('userId') userId: number) {
    return this.paymentService.listByUser(userId);
  }

  @Mutation({ input: VerifyPaymentSchema })
  async verify(@Input() input: any) {
    const { declarationId, status, adminId } = input;
    return this.paymentService.verify(adminId || 1, declarationId, status);
  }
}