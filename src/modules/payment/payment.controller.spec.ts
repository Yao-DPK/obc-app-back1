import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    listByUser: jest.fn().mockResolvedValue([{ id: 1 }]),
    verify: jest.fn().mockResolvedValue({ id: 1, status: 'verified' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [{ provide: PaymentService, useValue: mockService }],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  it('should create a payment declaration', async () => {
    const input = { userId: 1, amount: 50, method: 'wave', reason: 'test', playerIds: [2] };
    const result = await controller.create(input);
    const { userId, ...data } = input;
    expect(service.create).toHaveBeenCalledWith(userId, data);
    expect(result).toEqual({ id: 1 });
  });

  it('should list payments by user', async () => {
    const result = await controller.listByUser('1');
    expect(service.listByUser).toHaveBeenCalledWith(1);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('should verify a payment', async () => {
    const input = { declarationId: 1, status: 'verified', adminId: 2 };
    const result = await controller.verify(input);
    expect(service.verify).toHaveBeenCalledWith(2, 1, 'verified');
    expect(result).toEqual({ id: 1, status: 'verified' });
  });
});