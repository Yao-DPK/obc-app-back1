import { Module } from '@nestjs/common';
import { GuardianService } from './guardian.service';
import { GuardianController } from './guardian.controller';
import { GuardianRelationshipsRepository } from './guardian.repository';
import { UserRepository } from '../user/user.repository';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [GuardianService, GuardianRelationshipsRepository],
  exports: [GuardianRelationshipsRepository],
  controllers: [GuardianController],
})
export class GuardianModule {}
