import { Test, TestingModule } from '@nestjs/testing';
import { PaymentObligationsController } from './payment-obligations.controller';

describe('PaymentObligationsController', () => {
  let controller: PaymentObligationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentObligationsController],
    }).compile();

    controller = module.get<PaymentObligationsController>(PaymentObligationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
