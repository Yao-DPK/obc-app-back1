import { Module } from '@nestjs/common';
import { InscriptionService } from './inscription.service';
import { InscriptionController } from './inscription.controller'
import { UserRepository } from '../user/user.repository';
import { GuardianRelationshipsRepository } from '../guardian/guardian.repository';
import { GoogleDriveService } from '../google-drive/google-drive.service';

@Module({
  controllers: [InscriptionController],
  providers: [InscriptionService, UserRepository, GuardianRelationshipsRepository,
    GoogleDriveService,],
  exports: [],
})
export class InscriptionModule {}