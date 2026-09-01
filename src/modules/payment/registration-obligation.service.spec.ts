// apps/api/src/modules/payment/services/registration-obligation.service.spec.ts
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { RegistrationObligationService } from './registration-obligation.service';
import { PaymentObligationRepository } from './payment-obligation.repository';
import { PaymentEventRepository } from './payment-event.repository';


describe('RegistrationObligationService', () => {
  let service: RegistrationObligationService;
  let eventRepo: jest.Mocked<PaymentEventRepository>;
  let obligationRepo: jest.Mocked<PaymentObligationRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RegistrationObligationService,
        {
          provide: PaymentEventRepository,
          useValue: { findMany: jest.fn() },
        },
        {
          provide: PaymentObligationRepository,
          useValue: { createIfNotExists: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(RegistrationObligationService);
    eventRepo = module.get(PaymentEventRepository);
    obligationRepo = module.get(PaymentObligationRepository);
  });

  it('crée les obligations one-shot avec periodKey de saison', async () => {
    eventRepo.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'Inscription annuelle',
        amount: 50000,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-06-30'),
      } as any,
    ]);
    obligationRepo.createIfNotExists.mockResolvedValue({ created: true, obligation: {} as any });

    const result = await service.generateForRegistration(10, new Date('2026-10-15'));

    expect(result).toEqual({ created: 1, skipped: 0 });
    expect(obligationRepo.createIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        playerId: 10,
        eventId: 1,
        periodKey: 'saison-2026-2027',
        totalAmount: 50000,
      }),
    );
  });

  it('ne génère rien si aucun événement applicable', async () => {
    eventRepo.findMany.mockResolvedValue([]);

    const result = await service.generateForRegistration(10, new Date('2026-10-15'));

    expect(result).toEqual({ created: 0, skipped: 0 });
    expect(obligationRepo.createIfNotExists).not.toHaveBeenCalled();
  });

  it('est idempotent : 2e inscription skippée', async () => {
    eventRepo.findMany.mockResolvedValue([
      { id: 1, name: 'Inscription annuelle', amount: 50000, startDate: new Date('2026-09-01') } as any,
    ]);

    obligationRepo.createIfNotExists.mockResolvedValueOnce({ created: true, obligation: {} as any });
    await service.generateForRegistration(10, new Date('2026-10-15'));

    obligationRepo.createIfNotExists.mockResolvedValueOnce({ created: false, obligation: null });
    const result = await service.generateForRegistration(10, new Date('2026-10-15'));

    expect(result).toEqual({ created: 0, skipped: 1 });
  });
});