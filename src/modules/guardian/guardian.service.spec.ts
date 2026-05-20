// guardian.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GuardianService } from './guardian.service';
import { db } from 'src/database/db';
import { TRPCError } from '@trpc/server';

jest.mock('../../database/config/db.config', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
  users: {},
  guardianRelationships: {},
  eq: jest.fn(),
  and: jest.fn(),
}));

describe('GuardianService', () => {
  let service: GuardianService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardianService],
    }).compile();
    service = module.get<GuardianService>(GuardianService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('linkPlayer', () => {
    it('should throw NOT_FOUND if player does not exist', async () => {
      // Simule l'absence du joueur
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // aucun joueur trouvé
        }),
      });

      await expect(service.linkPlayer(1, 99)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Player not found',
      });
    });

    it('should throw CONFLICT if link already exists', async () => {
      // Simule le joueur existant
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 2 }]), // joueur existe
        }),
      });
      // Simule un lien déjà existant
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]), // lien existe
        }),
      });

      await expect(service.linkPlayer(1, 2)).rejects.toMatchObject({
        code: 'CONFLICT',
        message: 'Link already exists',
      });
    });

    it('should create link successfully', async () => {
      // Simule le joueur existant
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 2 }]),
        }),
      });
      // Simule aucun lien existant
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });
      // Simule l'insertion
      (db.insert as jest.Mock).mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 10, guardianId: 1, playerId: 2 }]),
        }),
      });

      const result = await service.linkPlayer(1, 2, { canPay: true });
      expect(result).toHaveProperty('id', 10);
      expect(result.guardianId).toBe(1);
    });
  });

  describe('getGuardians', () => {
    it('should return list of guardians', async () => {
      const mockRelations = [{ id: 1, guardianId: 1, playerId: 2 }];
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockRelations),
        }),
      });

      const result = await service.getGuardians(2);
      expect(result).toEqual(mockRelations);
    });
  });

  describe('getPlayers', () => {
    it('should return list of players', async () => {
      const mockRelations = [{ id: 1, guardianId: 1, playerId: 2 }];
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockRelations),
        }),
      });

      const result = await service.getPlayers(1);
      expect(result).toEqual(mockRelations);
    });
  });
});