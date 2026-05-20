import { Router, Mutation, Query, Input } from 'nestjs-trpc-v2';
import { z } from 'zod';
import { UserService } from './user.service';
import { UpdateProfileSchema, ChangePasswordSchema } from './dto/user.dto';

@Router({ alias: 'user' })
export class UserRouter {
  constructor(private readonly userService: UserService) {}

  @Query({ input: z.object({ userId: z.number() }) })
  async getProfile(@Input('userId') userId: number) {
    return this.userService.getProfile(userId);
  }

  @Mutation({ input: UpdateProfileSchema })
  async updateProfile(@Input() input: any) {
    const { userId, ...data } = input;
    return this.userService.updateProfile(userId, data);
  }

  @Mutation({ input: ChangePasswordSchema })
  async changePassword(@Input() input: any) {
    const { userId, oldPassword, newPassword } = input;
    return this.userService.changePassword(userId, oldPassword, newPassword);
  }
}