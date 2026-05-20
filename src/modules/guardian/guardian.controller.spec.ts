import { Test, TestingModule } from '@nestjs/testing';
import { GuardianController } from './guardian.controller';
import { GuardianService } from './guardian.service';

describe('GuardianController', () => {
  let controller: GuardianController;
  let service: GuardianService;

  const mockService = {
    linkPlayer: jest.fn().mockResolvedValue({ id: 1 }),
    getGuardians: jest.fn().mockResolvedValue([{ id: 1 }]),
    getPlayers: jest.fn().mockResolvedValue([{ id: 2 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuardianController],
      providers: [{ provide: GuardianService, useValue: mockService }],
    }).compile();

    controller = module.get<GuardianController>(GuardianController);
    service = module.get<GuardianService>(GuardianService);
  });

  it('should link player', async () => {
    const input = { guardianId: 1, playerId: 2, permissions: { canPay: true } };
    const result = await controller.linkPlayer(input);
    expect(service.linkPlayer).toHaveBeenCalledWith(1, 2, { canPay: true });
    expect(result).toEqual({ id: 1 });
  });

  it('should get guardians by playerId', async () => {
    const result = await controller.getGuardians('2');
    expect(service.getGuardians).toHaveBeenCalledWith(2);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('should get players by guardianId', async () => {
    const result = await controller.getPlayers('1');
    expect(service.getPlayers).toHaveBeenCalledWith(1);
    expect(result).toEqual([{ id: 2 }]);
  });
});