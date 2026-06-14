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
import { PaymentObligationService } from './payment-obligations/payment-obligations.service';
import { PaymentObligationController } from './payment-obligations/payment-obligations.controller';
import { PaymentObligationRepository } from './payment-obligations/payment-obligation.repository';


@Module({
  providers: [PaymentRouter, PaymentService, PaymentEventsService, PaymentIntentsService, KadevWebhookService, PaymentObligationService, PaymentObligationRepository],
  exports: [PaymentRouter],
  controllers: [PaymentController, PaymentEventsController, PaymentIntentsController, KadevWebhookController, PaymentObligationController],
})
export class PaymentModule {}
