import { Module } from '@nestjs/common';

import { KadevWebhookService } from './kadev-webhook/kadev-webhook.service';
import { KadevWebhookController } from './kadev-webhook/kadev-webhook.controller';

import { PaymentObligationRepository } from './payment-obligation.repository';
import { PaymentService } from './payment.service';
import { PaymentIntentRepository } from './payment-intent.repository';
import { PaymentEventRepository } from './payment-event.repository';
import { PaymentController } from './payment.controller';


@Module({
  providers: [KadevWebhookService, PaymentObligationRepository, PaymentIntentRepository, PaymentEventRepository, PaymentService],
  exports: [PaymentObligationRepository, PaymentIntentRepository, PaymentEventRepository, PaymentService],
  controllers: [KadevWebhookController, PaymentController],
})
export class PaymentModule {}
