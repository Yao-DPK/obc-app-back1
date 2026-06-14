import { Test, TestingModule } from '@nestjs/testing';
import { PaymentObligationService } from './payment-obligations.service';

describe('PaymentObligationsService', () => {
  let service: PaymentObligationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentObligationService],
    }).compile();

    service = module.get<PaymentObligationService>(PaymentObligationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
