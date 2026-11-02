// apps/api/src/modules/payment/services/monthly-payment.service.spec.ts
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { MonthlyPaymentService } from './monthly-payment.service';
import { PaymentEventRepository } from './payment-event.repository';
import { PaymentObligationRepository } from './payment-obligation.repository';
import { PlayerRepository } from '../user/player.repository';
import { UserRepository } from '../user/user.repository';
import { UserService } from '../user/user.service';


describe('MonthlyPaymentService', () => {
  let service: MonthlyPaymentService;
  let eventRepo: jest.Mocked<PaymentEventRepository>;
  let obligationRepo: jest.Mocked<PaymentObligationRepository>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MonthlyPaymentService,
        {
          provide: PaymentEventRepository,
          useValue: {
            findMany: jest.fn(),
          },
        },
        {
          provide: PaymentObligationRepository,
          useValue: {
            createIfNotExists: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findUsers: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(MonthlyPaymentService);
    eventRepo = module.get(PaymentEventRepository);
    obligationRepo = module.get(PaymentObligationRepository);
    userService = module.get(UserService);
  });

  // ============================================================
  // CAS NOMINAL
  // ============================================================
  it('génère les mensualités pour le mois M-1', async () => {
    eventRepo.findMany.mockResolvedValue([
      { id: 1, name: 'Mensualité', amount: 15000, excludedMonths: [], isActive: true } as any,
    ]);
    userService.findUsers.mockResolvedValue([
      { id: 10 } as any,
      { id: 11 } as any,
    ]);
    obligationRepo.createIfNotExists.mockResolvedValue({ created: true, obligation: {} as any });

    // Novembre 2026 → génère octobre 2026
    const result = await service.generateForPreviousMonth(new Date('2026-11-02'));

    expect(result).toEqual({ created: 2, skipped: 0, failed: 0 });
    expect(obligationRepo.createIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 1,
        playerId: 10,
        periodKey: '2026-10',
        totalAmount: 15000,
      }),
    );
    expect(obligationRepo.createIfNotExists).toHaveBeenCalledTimes(2);
  });

  // ============================================================
  // IDEMPOTENCE
  // ============================================================
  it('ne crée pas de doublon si on relance le job', async () => {
    eventRepo.findMany.mockResolvedValue([
      { id: 1, name: 'Mensualité', amount: 15000, excludedMonths: [] } as any,
    ]);
    userService.findUsers.mockResolvedValue([{ id: 10 } as any]);

    // 1ère exécution : créée
    obligationRepo.createIfNotExists.mockResolvedValueOnce({ created: true, obligation: {} as any });
    const first = await service.generateForPreviousMonth(new Date('2026-11-02'));
    expect(first).toEqual({ created: 1, skipped: 0, failed: 0 });

    // 2e exécution : skippée (contrainte unique côté DB)
    obligationRepo.createIfNotExists.mockResolvedValueOnce({ created: false, obligation: null });
    const second = await service.generateForPreviousMonth(new Date('2026-11-02'));
    expect(second).toEqual({ created: 0, skipped: 1, failed: 0 });
  });

  // ============================================================
  // MOIS EXCLU
  // ============================================================
  it('ne génère rien si le mois est exclu (club fermé)', async () => {
    // Juillet (7) et août (8) exclus
    eventRepo.findMany.mockResolvedValue([
      { id: 1, name: 'Mensualité', amount: 15000, excludedMonths: [7, 8] } as any,
    ]);
    userService.findUsers.mockResolvedValue([{ id: 10 } as any]);

    // Septembre 2026 → cible août 2026 (mois 8, exclu)
    const result = await service.generateForPreviousMonth(new Date('2026-09-02'));

    expect(result).toEqual({ created: 0, skipped: 0, failed: 0 });
    expect(obligationRepo.createIfNotExists).not.toHaveBeenCalled();
  });

  // ============================================================
  // FILTRE DATE D'INSCRIPTION
  // ============================================================
  it('exclut les joueurs inscrits pendant le mois cible', async () => {
    eventRepo.findMany.mockResolvedValue([
      { id: 1, name: 'Mensualité', amount: 15000, excludedMonths: [] } as any,
    ]);
    // Le repository doit recevoir le 1er du mois cible (01/10/2026)
    userService.findUsers.mockResolvedValue([{ id: 10 } as any]);
    obligationRepo.createIfNotExists.mockResolvedValue({ created: true, obligation: {} as any });

    await service.generateForPreviousMonth(new Date('2026-11-02'));

    expect(userService.findUsers).toHaveBeenCalledWith({createdTo: new Date('2026-10-01'), registrationStatus:"inscrit", role: "player"});
  });

  // ============================================================
  // AUCUN ÉVÉNEMENT MENSUEL
  // ============================================================
  it('retourne 0 si aucun événement mensuel actif', async () => {
    eventRepo.findMany.mockResolvedValue([]);

    const result = await service.generateForPreviousMonth(new Date('2026-11-02'));

    expect(result).toEqual({ created: 0, skipped: 0, failed: 0 });
    expect(userService.findUsers).not.toHaveBeenCalled();
  });
});