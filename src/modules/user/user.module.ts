import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRouter } from './user.router';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';

@Module({
  providers: [UserService, UserRouter, UserRepository],
  exports: [UserRouter, UserRepository],
  controllers: [UserController]
})
export class UserModule {}
