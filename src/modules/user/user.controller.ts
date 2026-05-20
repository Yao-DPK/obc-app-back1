import { Controller, Get, Param, Patch, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileSchema, ChangePasswordSchema } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':userId')
  async getProfile(@Param('userId') userId: string) {
    return this.userService.getProfile(parseInt(userId, 10));
  }

  @Patch(':userId')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Param('userId') userId: string, @Body() input: any) {
    return this.userService.updateProfile(parseInt(userId, 10), input);
  }

  @Patch(':userId/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Param('userId') userId: string, @Body() input: any) {
    const { oldPassword, newPassword } = input;
    return this.userService.changePassword(parseInt(userId, 10), oldPassword, newPassword);
  }
}