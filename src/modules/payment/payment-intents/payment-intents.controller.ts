import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { PaymentIntentsService } from './payment-intents.service';
import { AuthGuard } from '@nestjs/passport';
import type { CreateIntentDto } from '../dto/payment.dto';
import type { RequestWithUser } from '@/modules/auth/interfaces/request-with-user.interface';

@Controller('payment-intents')
@UseGuards(AuthGuard('jwt'))
export class PaymentIntentsController {
  constructor(private readonly service: PaymentIntentsService) {}

  @Post()
  async create(@Body() dto: CreateIntentDto, @Req() req: RequestWithUser) {
    const intent = await this.service.create(dto, req.user.id);
    // On ne renvoie que ce dont le front a besoin pour appeler Kadev Pay
    return {
      intentId: intent.id,
      amountToPay: intent.amountToPay,
      feesAmount: intent.feesAmount,
      totalAmount: intent.totalAmount,
      publicKey: process.env.KADEV_PUBLIC_KEY,
    };
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string, @Req() req: RequestWithUser) {
    const intent = await this.service.findOne(+id, req.user.id);
    return { status: intent.status };
  }
}