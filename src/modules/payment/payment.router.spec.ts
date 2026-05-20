// apps/api/src/modules/payment/payment.router.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentRouter } from './payment.router';
import { PaymentService } from './payment.service';

const mockPaymentService = {
  create: jest.fn(),
  listByUser: jest.fn(),
  verify: jest.fn(),
};

describe('PaymentRouter', () => {
  let router: PaymentRouter;
  let paymentService: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRouter,
        { provide: PaymentService, useValue: mockPaymentService },
      ],
    }).compile();

    router = module.get<PaymentRouter>(PaymentRouter);
    paymentService = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call paymentService.create with userId and data', async () => {
      const input = { userId: 1, amount: 50, method: 'wave', reason: 'test', playerIds: [2] };
      const expectedData = { amount: 50, method: 'wave', reason: 'test', playerIds: [2] };
      mockPaymentService.create.mockResolvedValue({ id: 1, ...input });

      const result = await router.create(input);

      expect(paymentService.create).toHaveBeenCalledWith(1, expectedData);
      expect(result).toEqual({ id: 1, ...input });
    });
  });

  describe('listByUser', () => {
    it('should call paymentService.listByUser with userId', async () => {
      const userId = 1;
      const mockList = [{ id: 1, userId, amount: 50 }];
      mockPaymentService.listByUser.mockResolvedValue(mockList);

      const result = await router.listByUser(userId);

      expect(paymentService.listByUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockList);
    });
  });

  describe('verify', () => {
    it('should call paymentService.verify with adminId (provided), declarationId, status', async () => {
      const input = { declarationId: 10, status: 'verified', adminId: 5 };
      mockPaymentService.verify.mockResolvedValue({ id: 10, status: 'verified' });

      const result = await router.verify(input);

      expect(paymentService.verify).toHaveBeenCalledWith(5, 10, 'verified');
      expect(result).toEqual({ id: 10, status: 'verified' });
    });

    it('should use default adminId=1 when adminId not provided', async () => {
      const input = { declarationId: 10, status: 'rejected' }; // no adminId
      mockPaymentService.verify.mockResolvedValue({ id: 10, status: 'rejected' });

      const result = await router.verify(input);

      expect(paymentService.verify).toHaveBeenCalledWith(1, 10, 'rejected');
      expect(result).toEqual({ id: 10, status: 'rejected' });
    });
  });
});