import * as common from '@nestjs/common';
import express from 'express';
import { KadevWebhookService } from './kadev-webhook.service';

@common.Controller('webhooks/kadev-pay')
export class KadevWebhookController {
  constructor(private readonly webhookService: KadevWebhookService) {}

  @common.Post()
  async handleWebhook(
    @common.Headers('x-kadevpay-signature') signature: string,
    @common.Req() req: common.RawBodyRequest<express.Request>,
    @common.Res() res: express.Response,
  ) {
    const rawBody = req.rawBody; // besoin de configurer NestJS pour rawBody
    const isValid = this.webhookService.verifySignature(rawBody!, signature);
    if (!isValid) {
      return res.status(401).send('Invalid signature');
    }

    const event = req.body;
    await this.webhookService.processEvent(event);
    res.status(200).send('OK');
  }
}