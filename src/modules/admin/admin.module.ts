// src/modules/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserModule } from '../user/user.module';
import { PaymentModule } from '../payment/payment.module';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [UserModule, PaymentModule, DocumentModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}