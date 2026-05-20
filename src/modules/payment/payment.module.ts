import { Module } from '@nestjs/common';
import { PaymentRouter } from './payment.router';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

@Module({
  providers: [PaymentRouter, PaymentService],
  exports: [PaymentRouter],
  controllers: [PaymentController],
})
export class PaymentModule {}