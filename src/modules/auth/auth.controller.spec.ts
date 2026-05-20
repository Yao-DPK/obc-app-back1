/* // apps/api/src/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register with dto and return result', async () => {
      const dto: RegisterDto = { email: 'test@test.com', password: '123456', role: 'parent' };
      const expectedResult = { user: { id: 1, email: dto.email, role: dto.role }, token: 'jwt-token' };
      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(dto);
      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login with dto and return result', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: '123456' };
      const expectedResult = { user: { id: 1, email: dto.email, role: 'parent' }, token: 'jwt-token' };
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });
}); */