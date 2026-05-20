// apps/api/src/modules/user/user.router.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserRouter } from './user.router';
import { UserService } from './user.service';

// Mock du service
const mockUserService = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
};

describe('UserRouter', () => {
  let router: UserRouter;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRouter,
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    router = module.get<UserRouter>(UserRouter);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should call userService.getProfile with correct userId and return result', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'parent' };
      mockUserService.getProfile.mockResolvedValue(mockUser);

      const result = await router.getProfile(1);

      expect(userService.getProfile).toHaveBeenCalledTimes(1);
      expect(userService.getProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should call userService.updateProfile with correct parameters', async () => {
      const input = { userId: 1, email: 'new@example.com' };
      mockUserService.updateProfile.mockResolvedValue({ success: true });

      const result = await router.updateProfile(input);

      expect(userService.updateProfile).toHaveBeenCalledTimes(1);
      expect(userService.updateProfile).toHaveBeenCalledWith(1, { email: 'new@example.com' });
      expect(result).toEqual({ success: true });
    });

    it('should work with notificationPreferences only', async () => {
      const input = { userId: 2, notificationPreferences: { email: false, sms: true } };
      mockUserService.updateProfile.mockResolvedValue({ success: true });

      const result = await router.updateProfile(input);

      expect(userService.updateProfile).toHaveBeenCalledWith(2, { notificationPreferences: { email: false, sms: true } });
      expect(result).toEqual({ success: true });
    });
  });

  describe('changePassword', () => {
    it('should call userService.changePassword with correct parameters', async () => {
      const input = { userId: 1, oldPassword: 'old123', newPassword: 'new456' };
      mockUserService.changePassword.mockResolvedValue({ success: true });

      const result = await router.changePassword(input);

      expect(userService.changePassword).toHaveBeenCalledTimes(1);
      expect(userService.changePassword).toHaveBeenCalledWith(1, 'old123', 'new456');
      expect(result).toEqual({ success: true });
    });
  });
});