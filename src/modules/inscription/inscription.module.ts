import { Module } from '@nestjs/common';
import { InscriptionService } from './inscription.service';
import { InscriptionController } from './inscription.controller';
import { UserRepository } from '../user/user.repository';
import { GuardianRelationshipsRepository } from '../guardian/guardian.repository';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { DocumentService } from '../document/document.service';
import { DocumentRepository } from '../document/document.repository';
import { PaymentObligationService } from '../payment/payment-obligations/payment-obligations.service';
import { PaymentObligationRepository } from '../payment/payment-obligations/payment-obligation.repository';

@Module({
  controllers: [InscriptionController],
  providers: [
    InscriptionService,
    UserRepository,
    GuardianRelationshipsRepository,
    GoogleDriveService,
    DocumentService,
    DocumentRepository,
    PaymentObligationService, 
    PaymentObligationRepository
  ],
  exports: [],
})
export class InscriptionModule {}
