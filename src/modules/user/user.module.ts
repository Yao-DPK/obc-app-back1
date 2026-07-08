import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { PlayerRepository } from './player.repository';

@Module({
  providers: [UserService, UserRepository, PlayerRepository],
  exports: [UserService, UserRepository, PlayerRepository ],
  controllers: [UserController],
})
export class UserModule {}
