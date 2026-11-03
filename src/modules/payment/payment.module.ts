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
import { MonthlyPaymentService } from './monthly-payment.service';
import { RegistrationObligationService } from './registration-obligation.service';
import { UserModule } from '../user/user.module';
import { databaseProvider } from '@/database/providers/database.providers';
import { MonthlyJobRepository } from './monthly-job.repository';
import { MonthlyJobController } from './monthly-job.controller';


@Module({
  imports: [S3Module, UserModule],
  providers: [KadevWebhookService, PaymentObligationRepository, PaymentIntentRepository, PaymentEventRepository, PaymentService, PaymentIntentService, MonthlyPaymentService, RegistrationObligationService, MonthlyJobRepository, databaseProvider],
  exports: [PaymentObligationRepository, PaymentIntentRepository, PaymentEventRepository, PaymentService, PaymentIntentService, MonthlyPaymentService, RegistrationObligationService, MonthlyJobRepository, databaseProvider],
  controllers: [KadevWebhookController, PaymentController, PaymentIntentController, MonthlyJobController],
})
export class PaymentModule {}
