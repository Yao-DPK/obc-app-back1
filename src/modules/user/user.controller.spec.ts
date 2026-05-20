import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockService = {
    getProfile: jest.fn().mockResolvedValue({ id: 1, email: 'test@test.com' }),
    updateProfile: jest.fn().mockResolvedValue({ success: true }),
    changePassword: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockService }],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should get user profile', async () => {
    const result = await controller.getProfile('1');
    expect(service.getProfile).toHaveBeenCalledWith(1);
    expect(result).toEqual({ id: 1, email: 'test@test.com' });
  });

  it('should update profile', async () => {
    const input = { email: 'new@test.com' };
    const result = await controller.updateProfile('1', input);
    expect(service.updateProfile).toHaveBeenCalledWith(1, input);
    expect(result).toEqual({ success: true });
  });

  it('should change password', async () => {
    const input = { oldPassword: 'old', newPassword: 'new' };
    const result = await controller.changePassword('1', input);
    expect(service.changePassword).toHaveBeenCalledWith(1, 'old', 'new');
    expect(result).toEqual({ success: true });
  });
});