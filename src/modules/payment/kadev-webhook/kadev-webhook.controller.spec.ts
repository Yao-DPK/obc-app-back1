import { Test, TestingModule } from '@nestjs/testing';
import { KadevWebhookController } from './kadev-webhook.controller';

describe('KadevWebhookController', () => {
  let controller: KadevWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KadevWebhookController],
    }).compile();

    controller = module.get<KadevWebhookController>(KadevWebhookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
