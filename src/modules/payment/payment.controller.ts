import { Controller, Post, Body, Get, Param, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDeclarationSchema, VerifyPaymentSchema } from './dto/payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() input: any) {
    const { userId, ...data } = input;
    return this.paymentService.create(userId, data);
  }

  @Get('user/:userId')
  async listByUser(@Param('userId') userId: string) {
    return this.paymentService.listByUser(parseInt(userId, 10));
  }

  @Patch('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() input: any) {
    const { declarationId, status, adminId } = input;
    return this.paymentService.verify(adminId || 1, declarationId, status);
  }
}