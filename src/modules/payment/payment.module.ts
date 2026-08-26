import { Module } from '@nestjs/common';

import { KadevWebhookService } from './kadev-webhook/kadev-webhook.service';
import { KadevWebhookController } from './kadev-webhook/kadev-webhook.controller';

import { PaymentObligationRepository } from './payment-obligation.repository';
import { PaymentService } from './payment.service';
import { PaymentIntentRepository } from './payment-intent.repository';
import { PaymentEventRepository } from './payment-event.repository';
import { PaymentController } from './payment.controller';
import { PaymentIntentService } from './payment-intent.service';
import { S3Module } from '../s3/s3.module';
import { PaymentIntentController } from './payment-intents.controller';


@Module({
  imports: [S3Module],
  providers: [KadevWebhookService, PaymentObligationRepository, PaymentIntentRepository, PaymentEventRepository, PaymentService, PaymentIntentService],
  exports: [PaymentObligationRepository, PaymentIntentRepository, PaymentEventRepository, PaymentService, PaymentIntentService],
  controllers: [KadevWebhookController, PaymentController, PaymentIntentController],
})
export class PaymentModule {}
