import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request, Res, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Response, Request as ExpressRequest } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    console.log("Received register request");
    return this.authService.register(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('Refresh Token manquant');
    return this.authService.refreshAccessToken(refreshToken, res);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const userId = (req.user as any).id;
    return this.authService.logout(userId, res);
  }

  @Get('me')
  getProfile(@Request() req: ExpressRequest) {
    return req.user;
  }
}