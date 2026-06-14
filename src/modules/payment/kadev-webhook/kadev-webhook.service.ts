import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PaymentIntentsService } from '../payment-intents/payment-intents.service';
import { PaymentService } from '../payment.service';

@Injectable()
export class KadevWebhookService {
  constructor(
    private readonly intentsService: PaymentIntentsService,
    private readonly paymentsService: PaymentService,
  ) {}

  verifySignature(rawBody: Buffer, signature: string): boolean {
    const secret = process.env.KADEV_WEBHOOK_SECRET!;
    const hmac = createHmac('sha512', secret);
    const digest = hmac.update(rawBody).digest('hex');
    return digest === signature;
  }

  async processEvent(event: any) {
    if (event.event === 'payment.success') {
      const { reference, metadata, amount, status } = event.data;
      const intentId = metadata?.intent_id;
      if (!intentId) return;

      // Mettre à jour l'intention
      await this.intentsService.updateStatus(intentId, 'paid', reference);

      // Créer l'entrée définitive dans payments
      await this.paymentsService.createFromIntent(intentId, reference);
    } else if (event.event === 'payment.failed' || event.event === 'payment.cancelled') {
      const intentId = event.data.metadata?.intent_id;
      if (intentId) {
        await this.intentsService.updateStatus(intentId, 'failed');
      }
    }
  }
}