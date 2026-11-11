import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { jwtConstants } from './constants';
import { AuthGuard } from './auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.stategy';
import { OtpModule } from '../otp/otp.module';
import { UserService } from '../user/user.service';
import { EmailModule } from '../email/email.module';
import { GuardianModule } from '../guardian/guardian.module';


@Module({
  imports: [
    UserModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '15m' },
    }),
    PassportModule,
    OtpModule,
    EmailModule,
    GuardianModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    ...(process.env.CURRENT_ENV === 'REMOTE' ? [require('./local/auth_local.service').AuthLocalService] : []),
    
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [
    AuthController,
    ...(process.env.CURRENT_ENV === 'REMOTE' ? [require('./local/auth_local.controller').AuthLocalController] : []),
  ],
  exports: [AuthService]
})
export class AuthModule {}