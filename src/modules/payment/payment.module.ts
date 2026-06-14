import { Module } from '@nestjs/common';
import { PaymentRouter } from './payment.router';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentEventsService } from './payment-events/payment-events.service';
import { PaymentEventsController } from './payment-events/payment-events.controller';
import { PaymentIntentsService } from './payment-intents/payment-intents.service';
import { PaymentIntentsController } from './payment-intents/payment-intents.controller';
import { KadevWebhookService } from './kadev-webhook/kadev-webhook.service';
import { KadevWebhookController } from './kadev-webhook/kadev-webhook.controller';

@Module({
  providers: [PaymentRouter, PaymentService, PaymentEventsService, PaymentIntentsService, KadevWebhookService],
  exports: [PaymentRouter],
  controllers: [PaymentController, PaymentEventsController, PaymentIntentsController, KadevWebhookController],
})
export class PaymentModule {}
