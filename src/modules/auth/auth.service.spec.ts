/* // auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { db, eq, users } from 'src/database/db';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Mock du module database AVANT les imports
jest.mock('../../database/config/db.config', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  eq: jest.fn(),
  users: {}, // dummy pour éviter l'undefined
}));

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const dto: RegisterDto = { email: 'test@test.com', password: '123456', role: 'parent' };
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      // Mock db.select().from().where()
      const whereMock = jest.fn().mockResolvedValue([]);
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      (db.select as jest.Mock).mockReturnValue({ from: fromMock });

      // Mock db.insert().values().returning()
      const returningMock = jest.fn().mockResolvedValue([{ id: 1, email: dto.email, role: dto.role }]);
      const valuesMock = jest.fn().mockReturnValue({ returning: returningMock });
      (db.insert as jest.Mock).mockReturnValue({ values: valuesMock });

      const result = await service.register(dto);

      expect(result).toHaveProperty('token', 'jwt-token');
      expect(result.user).toHaveProperty('email', dto.email);
      expect(db.select).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const dto: RegisterDto = { email: 'exists@test.com', password: '123456', role: 'parent' };
      const whereMock = jest.fn().mockResolvedValue([{ id: 1 }]);
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      (db.select as jest.Mock).mockReturnValue({ from: fromMock });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: '123456' };
      const user = { id: 1, email: dto.email, passwordHash: 'hashed', role: 'parent' };
      const whereMock = jest.fn().mockResolvedValue([user]);
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      (db.select as jest.Mock).mockReturnValue({ from: fromMock });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      expect(result).toHaveProperty('token', 'jwt-token');
      expect(result.user).toHaveProperty('email', dto.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const dto: LoginDto = { email: 'notfound@test.com', password: '123456' };
      const whereMock = jest.fn().mockResolvedValue([]);
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      (db.select as jest.Mock).mockReturnValue({ from: fromMock });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: 'wrong' };
      const user = { id: 1, email: dto.email, passwordHash: 'hashed', role: 'parent' };
      const whereMock = jest.fn().mockResolvedValue([user]);
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      (db.select as jest.Mock).mockReturnValue({ from: fromMock });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
}); */