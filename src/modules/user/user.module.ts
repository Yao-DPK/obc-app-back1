import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { PlayerRepository } from './player.repository';
import { GuardianModule } from '../guardian/guardian.module';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [GuardianModule, DocumentModule],
  providers: [UserService, UserRepository, PlayerRepository],
  exports: [UserService, UserRepository, PlayerRepository ],
  controllers: [UserController],
})
export class UserModule {}
