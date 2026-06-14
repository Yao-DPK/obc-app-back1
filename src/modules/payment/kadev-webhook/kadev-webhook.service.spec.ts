import { Test, TestingModule } from '@nestjs/testing';
import { KadevWebhookService } from './kadev-webhook.service';

describe('KadevWebhookService', () => {
  let service: KadevWebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KadevWebhookService],
    }).compile();

    service = module.get<KadevWebhookService>(KadevWebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
