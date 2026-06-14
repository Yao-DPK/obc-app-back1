import { Test, TestingModule } from '@nestjs/testing';
import { PaymentEventsController } from './payment-events.controller';

describe('PaymentEventsController', () => {
  let controller: PaymentEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentEventsController],
    }).compile();

    controller = module.get<PaymentEventsController>(PaymentEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
