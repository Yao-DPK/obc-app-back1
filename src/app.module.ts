import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DocumentModule } from './modules/document/document.module';
import { UserModule } from './modules/user/user.module';
import { InscriptionModule } from './modules/inscription/inscription.module';
import { PaymentModule } from './modules/payment/payment.module';
import { GuardianModule } from './modules/guardian/guardian.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuditMiddleware } from './modules/common/middleware/audit.middleware';
import { EmailModule } from './modules/email/email.module';
import { OtpModule } from './modules/otp/otp.module';
import { S3Service } from './modules/s3/s3.service';
import { S3Module } from './modules/s3/s3.module';
import { EventModule } from './modules/event/event.module';

@Module({
  imports: [
    /* TRPCModule.forRoot({
      autoSchemaFile: './trpc',
    }), */ AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DocumentModule,
    UserModule,
    GuardianModule,
    PaymentModule,
    InscriptionModule,
    EmailModule,
    OtpModule,
    S3Module,
    EventModule,
  ],
  controllers: [AppController],
  providers: [AppService, S3Service],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditMiddleware).forRoutes('*'); // ou pour des routes spécifiques
  }
}
