import * as common from '@nestjs/common';
import type { Request, Response } from 'express';
import { KadevWebhookService } from './kadev-webhook.service';

@common.Controller('webhooks/kadev-pay')
export class KadevWebhookController {
  private readonly logger = new common.Logger(KadevWebhookController.name);

  constructor(private readonly webhookService: KadevWebhookService) {}

  @common.Post()
  async handleWebhook(
    @common.Headers('x-kadevpay-signature') signature: string,
    @common.Req() req: common.RawBodyRequest<Request>,
    @common.Res() res: Response,
  ) {
    // 1. Vérifier que le rawBody est présent
    if (!req.rawBody) {
      this.logger.warn('Requête sans rawBody');
      return res.status(common.HttpStatus.BAD_REQUEST).json({ error: 'Raw body required' });
    }

    // 2. Vérifier la signature
    const isValid = this.webhookService.verifySignature(req.rawBody, signature);
    if (!isValid) {
      this.logger.warn('Signature invalide');
      return res.status(common.HttpStatus.UNAUTHORIZED).json({ error: 'Invalid signature' });
    }

    // 3. Récupérer l'événement
    const event = req.body;
    if (!event || !event.event) {
      this.logger.warn('Événement mal formé');
      return res.status(common.HttpStatus.BAD_REQUEST).json({ error: 'Invalid event payload' });
    }

    try {
      // 4. Traiter l'événement
      await this.webhookService.processEvent(event);
      return res.status(common.HttpStatus.OK).send('OK');
    } catch (error) {
      this.logger.error(`Erreur interne : ${error}`);
      return res.status(common.HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  }
}