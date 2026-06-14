import { Test, TestingModule } from '@nestjs/testing';
import { PaymentObligationController } from './payment-obligations.controller';

describe('PaymentObligationsController', () => {
  let controller: PaymentObligationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentObligationController],
    }).compile();

    controller = module.get<PaymentObligationController>(PaymentObligationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
