import { Module } from '@nestjs/common';
import { GuardianService } from './guardian.service';
import { GuardianController } from './guardian.controller';
import { GuardianRelationshipsRepository } from './guardian.repository';
import { UserRepository } from '../user/user.repository';

@Module({
  providers: [GuardianService, GuardianRelationshipsRepository, UserRepository],
  exports: [],
  controllers: [GuardianController],
})
export class GuardianModule {}
