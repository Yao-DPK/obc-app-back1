/* // apps/api/src/modules/inscription/inscription.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { InscriptionService } from './inscription.service';
import { UserRepository } from '../user/user.repository';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('InscriptionService', () => {
  let service: InscriptionService;
  let userRepo: UserRepository;

  const mockUserRepo = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InscriptionService,
        { provide: UserRepository, useValue: mockUserRepo },
      ],
    }).compile();
    service = module.get<InscriptionService>(InscriptionService);
    userRepo = module.get<UserRepository>(UserRepository);
  });

  it('should create a player without guardians', async () => {
    const input = {
      email: 'player@test.com',
      password: '123456',
      firstName: 'John',
      lastName: 'Doe',
      birthDate: '2000-01-01',
      gender: 'M' as 'M' | 'F',
      selfManaged: true,
    };
    mockUserRepo.findByEmail.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    mockUserRepo.create.mockResolvedValue({ id: 1, ...input, passwordHash: 'hashed' });

    const result = await service.preRegister(input);
    expect(result.joueur).toHaveProperty('id', 1);
    expect(userRepo.create).toHaveBeenCalled();
  });

  it('should throw ConflictException if email exists', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ id: 1 });
    await expect(service.preRegister({ email: 'exists@test.com' } as any)).rejects.toThrow(ConflictException);
  });
}); */