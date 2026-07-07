import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PaymentService } from '../payment.service';

@Injectable()
export class KadevWebhookService {
  private readonly logger = new Logger(KadevWebhookService.name);

  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Vérifie la signature du webhook (HMAC-SHA512)
   */
  verifySignature(rawBody: Buffer, signature: string): boolean {
    if (!rawBody || !signature) return false;
    const secret = process.env.KADEV_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error('KADEV_WEBHOOK_SECRET non défini');
      return false;
    }
    const hmac = createHmac('sha512', secret);
    const digest = hmac.update(rawBody).digest('hex');
    return digest === signature;
  }

  /**
   * Traite l'événement reçu
   */
  async processEvent(event: any): Promise<void> {
    this.logger.log(`Webhook reçu : ${event.event}`);

    try {
      switch (event.event) {
        case 'payment.success': {
          const { reference, metadata, amount, status } = event.data;
          const intentId = metadata?.intent_id;
          if (!intentId) {
            this.logger.warn('Intent ID manquant dans les métadonnées');
            return;
          }

          // 1. Mettre à jour l'intention (status = paid, reference)
          await this.paymentService.updateIntentStatus(intentId, 'paid', reference);
          this.logger.log(`Intention ${intentId} marquée comme payée`);

          // 2. (Optionnel) Si tu veux créer un enregistrement définitif dans paymentObligations ou autre
          // La logique de mise à jour de l'obligation est déjà dans PaymentService.verifyPayment().
          // Ici, tu peux appeler une méthode dédiée si nécessaire.
          // Exemple : await this.paymentService.finalizePayment(intentId, reference);

          break;
        }

        case 'payment.failed':
        case 'payment.cancelled': {
          const intentId = event.data?.metadata?.intent_id;
          if (intentId) {
            await this.paymentService.updateIntentStatus(
              intentId,
              event.event === 'payment.failed' ? 'failed' : 'cancelled'
            );
            this.logger.log(`Intention ${intentId} marquée comme ${event.event}`);
          } else {
            this.logger.warn('Intent ID manquant pour l\'événement', event.event);
          }
          break;
        }

        default:
          this.logger.warn(`Événement non géré : ${event.event}`);
      }
    } catch (error) {
      this.logger.error(`Erreur lors du traitement du webhook : ${error}`);
      throw error; // Le controller pourra renvoyer une erreur 500
    }
  }
}