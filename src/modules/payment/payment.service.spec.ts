// apps/api/src/modules/payment/payment.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { db } from 'src/database/db';
import { TRPCError } from '@trpc/server';

jest.mock('../../database/config/db.config', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
  },
  payments: {},
  eq: jest.fn(),
}));

describe('PaymentService', () => {
  let service: PaymentService;
  let mockInsert: jest.Mock;
  let mockSelect: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockWhere: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockWhere = jest.fn();
    mockSelect = jest.fn().mockReturnValue({ from: jest.fn().mockReturnValue({ where: mockWhere }) });
    (db.select as jest.Mock) = mockSelect;

    mockUpdate = jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: jest.fn() }) }) });
    (db.update as jest.Mock) = mockUpdate;

    mockInsert = jest.fn().mockReturnValue({ values: jest.fn().mockReturnValue({ returning: jest.fn() }) });
    (db.insert as jest.Mock) = mockInsert;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentService],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('create', () => {
    it('should create a payment declaration', async () => {
      const mockReturning = jest.fn().mockResolvedValue([{ id: 1, userId: 1, amount: 25.5, status: 'pending' }]);
      const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as jest.Mock).mockReturnValue({ values: mockValues });

      const data = { amount: 25.5, method: 'wave', reason: 'Mensuality', playerIds: [2] };
      const result = await service.create(1, data);
      expect(result).toHaveProperty('id', 1);
      expect(result.userId).toBe(1);
    });
  });

  describe('listByUser', () => {
    it('should return payments for a user', async () => {
      const mockPayments = [{ id: 1, userId: 1, amount: 25.5 }];
      mockWhere.mockResolvedValueOnce(mockPayments);

      const result = await service.listByUser(1);
      expect(result).toEqual(mockPayments);
    });
  });

  describe('verify', () => {
    it('should verify a payment declaration', async () => {
      const mockReturning = jest.fn().mockResolvedValue([{ id: 1, status: 'verified' }]);
      const mockSet = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: mockReturning }) });
      (db.update as jest.Mock).mockReturnValue({ set: mockSet });

      const result = await service.verify(2, 1, 'verified');
      expect(result).toHaveProperty('status', 'verified');
    });

    it('should throw NOT_FOUND if payment does not exist', async () => {
      const mockReturning = jest.fn().mockResolvedValue([]);
      const mockSet = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: mockReturning }) });
      (db.update as jest.Mock).mockReturnValue({ set: mockSet });

      await expect(service.verify(2, 999, 'verified')).rejects.toThrow(TRPCError);
      await expect(service.verify(2, 999, 'verified')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});