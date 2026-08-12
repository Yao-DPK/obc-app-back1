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
  NotFoundException,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Response, Request as ExpressRequest } from 'express';
import { OtpService } from '../otp/otp.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/resert-password.dto';
import { UserService } from '../user/user.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private otpService: OtpService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Post('send-verification-email')
  async sendVerificationEmail(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email requis');
    await this.otpService.sendEmailOtp(email);
    return { message: 'Code de vérification envoyé par email' };
  }

  
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
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

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message:
        'Si cet email existe, vous recevrez un lien de réinitialisation.',
    };
  }z

  @Public()
  @Get('verify-reset-token')
  async verifyResetToken(@Query('token') token: string, @Query('purpose') purpose: "email_confirmation" | "password_reset" | "first_login" | "invite") {
    if (!token) {
      throw new BadRequestException('Token manquant');
    }

    const record = await this.authService.peekVerificationToken(
      token,
      purpose,
    );

    return { valid: !!record, email: record?.email };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    console.log(`received data: ${JSON.stringify(resetPasswordDto)}`);
    await this.authService.verifyResetPasswordToken(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
      'password_reset'
    );
    return { message: 'Mot de passe modifié avec succès.' };
  }

  @Public()
  @Get('verify-guardian-token')
  async verifyGuardianToken(@Query('token') token: string) {
    try {
      return await this.authService.verifyGuardianToken(token);
    } catch (error) {
      throw new BadRequestException('Token invalide ou expiré');
    }
  }

  @Public()
  @Post('confirm-guardian')
  async confirmGuardian(
    @Body() body: {
      token: string;
      action: 'confirm' | 'reject';
      password?: string;
    },
  ) {
    try {
      return await this.authService.confirmGuardian(body);
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Erreur lors de la confirmation');
    }
  }

  @Public()
  @Post('resend-guardian-confirmation')
  async resendGuardianConfirmation(
    @Body() body: { email: string; playerId: number },
  ) {
    await this.authService.resendGuardianConfirmation(body.email, body.playerId);
  }
}