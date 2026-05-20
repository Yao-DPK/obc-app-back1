import { TRPCModule } from 'nestjs-trpc-v2';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { GoogleDriveModule } from './modules/google-drive/google-drive.module';
import { ConfigModule } from '@nestjs/config';
import { GoogleAuthModule } from './modules/google-auth/google-auth.module';
import { DocumentModule } from './modules/document/document.module';
import { UserModule } from './modules/user/user.module';
import { InscriptionModule } from './modules/inscription/inscription.module';
import { PaymentModule } from './modules/payment/payment.module';
import { GuardianModule } from './modules/guardian/guardian.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuditMiddleware } from './modules/common/middleware/audit.middleware';
import { GuardianController } from './modules/guardian/guardian.controller';
import { CorsMiddleware } from './modules/common/middleware/cors.middleware';



@Module({
  imports: [
    TRPCModule.forRoot({
      autoSchemaFile: 'src/trpc',
    }), AuthModule, GoogleDriveModule, ConfigModule.forRoot({ isGlobal: true }), GoogleAuthModule, DocumentModule, UserModule, GuardianModule, PaymentModule, InscriptionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditMiddleware).forRoutes('*'); // ou pour des routes spécifiques
  }
}