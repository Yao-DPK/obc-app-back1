import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { db } from 'src/database/db';
import { users, eq } from 'src/database/db';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRepository } from '../user/user.repository';
import { jwtConstants } from './constants';
import { refreshTokens } from 'src/database/schema/refresh_token';
import { randomBytes } from 'crypto';
import { FastifyReply } from 'fastify';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService) {}

  private generateAccessToken(userId: number, role: string, email: string, phone?: string) {
    const payload = { sub: userId, role, email, phone };
    return this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: '15m',
    });
  }

  private async generateRefreshToken(userId: number, res: FastifyReply) {
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

    // Fastify : setCookie (nom, valeur, options)
    res.setCookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'prod',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh', // chemin où le cookie sera envoyé
    });
  }


  async register(dto: RegisterDto) {
    const existingUser = await db.select().from(users).where(eq(users.email, dto.email));
    if (existingUser.length) {
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

  async login(dto: LoginDto, res: FastifyReply) {
    const [user] = await db.select().from(users).where(eq(users.email, dto.email));
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.generateAccessToken(user.id, user.role, user.email, user.phone!);
    await this.generateRefreshToken(user.id, res);
    return { user: { id: user.id, email: user.email, role: user.role }, accessToken };
  }

  async refreshAccessToken(refreshToken: string, res: FastifyReply) {
    const [stored] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, refreshToken));
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const [user] = await db.select().from(users).where(eq(users.id, stored.userId));
    if (!user) throw new UnauthorizedException('User not found');

    const newAccessToken = this.generateAccessToken(user.id, user.role, user.email, user.phone!);
    return { accessToken: newAccessToken };
  }

  async logout(userId: number, res: FastifyReply) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    return { success: true };
  }

}