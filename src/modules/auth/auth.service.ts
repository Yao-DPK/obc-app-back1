import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { db } from '../../database/db';
import { users, eq } from '../../database/db';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRepository } from '../user/user.repository';
import { jwtConstants } from './constants';
import { refreshTokens } from '../../database/schema/refresh_token';
import { randomBytes } from 'crypto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService
  ) {}

  private generateAccessToken(userId: number, role: string, email: string, phone?: string) {
    const payload = { sub: userId, role, email, phone };
    return this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: '15m',
    });
  }

  private async generateRefreshToken(userId: number, res: Response) {
    const token = randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Supprimer les anciens tokens
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

    await db.insert(refreshTokens).values({
      userId,
      token,
      expiresAt,
    });

    // Express : res.cookie(nom, valeur, options)
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'prod',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = await db.insert(users).values({
      email: dto.email,
      passwordHash: hashedPassword,
      role: dto.role,
    }).returning();
    const token = this.jwtService.sign({ sub: newUser[0].id, role: newUser[0].role });
    return { user: { id: newUser[0].id, email: newUser[0].email, role: newUser[0].role }, token };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.generateAccessToken(user.id, user.role, user.email, user.phone!);
    await this.generateRefreshToken(user.id, res);
    return { user: { id: user.id, email: user.email, role: user.role }, accessToken };
  }

  async refreshAccessToken(refreshToken: string, res: Response) {
    const [stored] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, refreshToken));
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const user = await this.userRepository.findById(stored.userId);
    if (!user) throw new UnauthorizedException('User not found');

    const newAccessToken = this.generateAccessToken(user.id, user.role, user.email, user.phone!);
    return { user: { id: user.id, email: user.email, role: user.role }, accessToken: newAccessToken };
  }

  async logout(userId: number, res: Response) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    return { success: true };
  }

  generateResetToken(email: string): string {
    const payload = { sub: email, purpose: 'reset' };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_RESET_SECRET'),
      expiresIn: '1h', // 1 heure
    });
  }

  verifyResetToken(token: string): { email: string } | null {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_RESET_SECRET'),
      });
      if (payload.purpose !== 'reset') return null;
      return { email: payload.sub };
    } catch {
      return null;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    // Sécurité : on ne révèle pas l'existence de l'email
    if (!user) return;

    // Générer un token JWT valable 1 heure
    const payload = { sub: user.id, email: user.email, purpose: 'reset' };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_RESET_SECRET'),
      expiresIn: '1h',
    });

    const frontendUrl = process.env.NODE_ENV == 'dev' ? this.configService.get('FRONTEND_DEVELOPMENT_URL') : this.configService.get('FRONTEND_PRODUCTION_URL');
    await this.emailService.sendPasswordResetEmail(email, token, frontendUrl);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_RESET_SECRET'),
      });
    } catch {
      throw new BadRequestException('Token invalide ou expiré');
    }

    if (payload.purpose !== 'reset') {
      throw new BadRequestException('Token invalide');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, {passwordHash: hashedPassword});
    // Optionnel : supprimer tous les refresh tokens de l'utilisateur
  }
}