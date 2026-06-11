import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
  Res,
  Req,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Response, Request as ExpressRequest } from 'express';
import { ApiController } from '../common/decorators/custom-prefix.decorator';
import { OtpService } from '../otp/otp.service';
import { EmailService } from '../email/email.service';
import { UserRepository } from '../user/user.repository';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/resert-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private otpService: OtpService,
    private emailService: EmailService,
    private userRepository: UserRepository,
  ) {}

  @Public()
  @Post('send-verification-email')
  async sendVerificationEmail(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email requis');
    await this.otpService.sendEmailOtp(email);
    return { message: 'Code de vérification envoyé par email' };
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body('email') email: string, @Body('code') code: string) {
    if (!email || !code) throw new BadRequestException('Email et code requis');
    this.otpService.verifyEmailOtp(email, code);
    // Ici, vous pouvez marquer l'email comme vérifié en base de données
    return { message: 'Email vérifié avec succès' };
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    console.log('Received register request');
    return this.authService.register(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    console.log('Received login request');
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken)
      throw new UnauthorizedException('Refresh Token manquant');
    return this.authService.refreshAccessToken(refreshToken, res);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = (req.user as any).id;
    return this.authService.logout(userId, res);
  }

  @Get('me')
  getProfile(@Request() req: ExpressRequest) {
    return req.user;
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message:
        'Si cet email existe, vous recevrez un lien de réinitialisation.',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    return { message: 'Mot de passe modifié avec succès.' };
  }
}
