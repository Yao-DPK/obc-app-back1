import { Module } from '@nestjs/common';
import { GuardianRouter } from './guardian.router';
import { GuardianService } from './guardian.service';
import { GuardianController } from './guardian.controller';

@Module({
  providers: [GuardianRouter, GuardianService],
  exports: [GuardianRouter],
  controllers: [GuardianController],
})
export class GuardianModule {}