import { Module } from '@nestjs/common';
import { GuardianService } from './guardian.service';
import { GuardianController } from './guardian.controller';
import { GuardianRelationshipsRepository } from './guardian.repository';

@Module({
  providers: [GuardianService, GuardianRelationshipsRepository],
  exports: [GuardianRelationshipsRepository, GuardianService],
  controllers: [GuardianController],
})
export class GuardianModule {}
