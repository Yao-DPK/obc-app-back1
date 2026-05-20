// apps/api/src/modules/guardian/guardian.router.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GuardianRouter } from './guardian.router';
import { GuardianService } from './guardian.service';

const mockGuardianService = {
  linkPlayer: jest.fn(),
  getGuardians: jest.fn(),
  getPlayers: jest.fn(),
};

describe('GuardianRouter', () => {
  let router: GuardianRouter;
  let guardianService: GuardianService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardianRouter,
        { provide: GuardianService, useValue: mockGuardianService },
      ],
    }).compile();

    router = module.get<GuardianRouter>(GuardianRouter);
    guardianService = module.get<GuardianService>(GuardianService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('linkPlayer', () => {
    it('should call guardianService.linkPlayer with guardianId, playerId, permissions', async () => {
      const input = { guardianId: 1, playerId: 2, permissions: { canPay: true } };
      const mockLink = { id: 1, guardianId: 1, playerId: 2, permissions: { canPay: true } };
      mockGuardianService.linkPlayer.mockResolvedValue(mockLink);

      const result = await router.linkPlayer(input);

      expect(guardianService.linkPlayer).toHaveBeenCalledWith(1, 2, { canPay: true });
      expect(result).toEqual(mockLink);
    });

    it('should call with undefined permissions when not provided', async () => {
      const input = { guardianId: 3, playerId: 4 };
      mockGuardianService.linkPlayer.mockResolvedValue({ id: 2, ...input });

      const result = await router.linkPlayer(input);

      expect(guardianService.linkPlayer).toHaveBeenCalledWith(3, 4, undefined);
      expect(result).toEqual({ id: 2, ...input });
    });
  });

  describe('getGuardians', () => {
    it('should call guardianService.getGuardians with playerId', async () => {
      const playerId = 5;
      const mockGuardians = [{ id: 1, guardianId: 2, playerId: 5 }];
      mockGuardianService.getGuardians.mockResolvedValue(mockGuardians);

      const result = await router.getGuardians(playerId);

      expect(guardianService.getGuardians).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockGuardians);
    });
  });

  describe('getPlayers', () => {
    it('should call guardianService.getPlayers with guardianId', async () => {
      const guardianId = 3;
      const mockPlayers = [{ id: 2, guardianId: 3, playerId: 4 }];
      mockGuardianService.getPlayers.mockResolvedValue(mockPlayers);

      const result = await router.getPlayers(guardianId);

      expect(guardianService.getPlayers).toHaveBeenCalledWith(3);
      expect(result).toEqual(mockPlayers);
    });
  });
});