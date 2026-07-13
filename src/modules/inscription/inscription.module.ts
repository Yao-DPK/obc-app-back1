import { Module } from '@nestjs/common';
import { InscriptionService } from './inscription.service';
import { InscriptionController } from './inscription.controller';
import { DocumentService } from '../document/document.service';
import { DocumentRepository } from '../document/document.repository';
import { PaymentModule } from '../payment/payment.module';
import { UserModule } from '../user/user.module';
import { GuardianModule } from '../guardian/guardian.module';
import { DocumentModule } from '../document/document.module';
import { GoogleDriveModule } from '../google-drive/google-drive.module';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [InscriptionController],
  imports: [AuthModule, EmailModule, PaymentModule, UserModule, GuardianModule, DocumentModule, GoogleDriveModule, AuthModule],
  providers: [InscriptionService],
  exports: [],
})
export class InscriptionModule {}
