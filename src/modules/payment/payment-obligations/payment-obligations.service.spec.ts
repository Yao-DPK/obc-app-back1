import { Test, TestingModule } from '@nestjs/testing';
import { PaymentObligationsService } from './payment-obligations.service';

describe('PaymentObligationsService', () => {
  let service: PaymentObligationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentObligationsService],
    }).compile();

    service = module.get<PaymentObligationsService>(PaymentObligationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
