import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { db } from '../../database/db';
import { users, eq, and, isNull, gt } from '../../database/db';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRepository } from '../user/user.repository';
import { jwtConstants } from './constants';
import { refreshTokens, verificationTokens } from '../../database/schema/token';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { GuardianService } from '../guardian/guardian.service';
import { generateRawToken, hashToken } from './token.utils';

type VerificationTokenType =
  | 'email_confirmation'
  | 'password_reset'
  | 'first_login'
  | 'invite';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private guardianService: GuardianService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  generateAccessToken(
    userId: number,
    role: string,
    email: string,
    phone?: string,
  ) {
    const payload = { id: userId, role, email, phone };
    return this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: '15m',
    });
  }

  // =========================================================
  // Verification tokens (password_reset / email_confirmation / first_login)
  // Remplace l'ancien système de JWT pour ces cas d'usage.
  // =========================================================

  /**
   * Crée un token opaque, invalide les précédents du même type/user
   * encore valides (un seul token actif par type à la fois), et retourne
   * le token brut à envoyer par email (jamais stocké en clair).
   */
  private async createVerificationToken(
    userId: number,
    type: VerificationTokenType,
    ttlMs: number,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);

    await db
      .update(verificationTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(verificationTokens.userId, userId),
          eq(verificationTokens.type, type),
          isNull(verificationTokens.usedAt),
          isNull(verificationTokens.revokedAt),
        ),
      );

    await db.insert(verificationTokens).values({
      userId,
      type,
      tokenHash,
      expiresAt: new Date(Date.now() + ttlMs),
      metadata,
    });

    return rawToken;
  }

  /**
   * Vérifie un token brut reçu du client, le marque comme utilisé (usage unique)
   * s'il est valide, et retourne l'enregistrement (contient userId, metadata...).
   */
  private async consumeVerificationToken(
    rawToken: string,
    type: VerificationTokenType,
  ) {
    const tokenHash = hashToken(rawToken);

    const [record] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.tokenHash, tokenHash),
          eq(verificationTokens.type, type),
          isNull(verificationTokens.usedAt),
          isNull(verificationTokens.revokedAt),
          gt(verificationTokens.expiresAt, new Date()),
        ),
      );

    if (!record) return null;

    await db
      .update(verificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(verificationTokens.id, record.id));

    return record;
  }

  // --- Password reset ---

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) return; // ne pas révéler si l'email existe

    const rawToken = await this.createVerificationToken(
      user.id,
      'password_reset',
      1000 * 60 * 60, // 1h
    );

    const frontendUrl =
      process.env.NODE_ENV === 'dev'
        ? this.configService.get('FRONTEND_DEVELOPMENT_URL')
        : this.configService.get('FRONTEND_PRODUCTION_URL');

    await this.emailService.sendPasswordResetEmail(email, rawToken, frontendUrl);
  }

  async verifyResetPasswordToken(rawToken: string, newPassword: string, tokenType: VerificationTokenType): Promise<void> {
    const record = await this.consumeVerificationToken(rawToken, tokenType);
    if (!record) {
      throw new BadRequestException('Token invalide ou expiré');
    }

    await this.resetPassword(record.userId, newPassword);
  }

  async resetPassword(userId: number, newPassword: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    await this.userService.setPassword(user.id, newPassword);

    // Un changement de mot de passe invalide toutes les sessions existantes
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
  }

  // --- Email confirmation ---

  async generateEmailConfirmationToken(userId: number, email: string) {
    return this.createVerificationToken(
      userId,
      'email_confirmation',
      1000 * 60 * 60,
      { email },
    );
  }

  async verifyEmailConfirmationToken(rawToken: string) {
    const record = await this.consumeVerificationToken(rawToken, 'email_confirmation');
    if (!record) throw new BadRequestException('Token invalide ou expiré');
    return record;
  }

  // --- First login ---

  async firstLogin(userId: number) {
    //TODO: Dans le cas où l'utilisateur n'a pas d'email, prevoir un identifiant login à envoyer à l'un des garants qui sera utilisé pour la connexion, le garant sert ici de compte de vérification
    const user = await this.userService.findById(userId);
    if(!user){
      return ;
    }

    const rawToken = await this.createVerificationToken(userId, 'first_login', 1000 * 60 * 60 * 24);

    const frontendUrl =
      process.env.NODE_ENV === 'dev'
        ? this.configService.get('FRONTEND_DEVELOPMENT_URL')
        : this.configService.get('FRONTEND_PRODUCTION_URL');

    await this.emailService.sendFirstLoginEmail(user.email!, rawToken, frontendUrl);
  }

  async verifyFirstLoginToken(rawToken: string, newPassword: string) {
    const record = await this.consumeVerificationToken(rawToken, 'first_login');
    if (!record) throw new BadRequestException('Token invalide ou expiré');
    await this.resetPassword(record.userId, newPassword);
  }

  // =========================================================
  // Guardian confirmation
  // NOTE : reste en JWT pour l'instant car le token est stocké en clair
  // sur `relationship.confirmationToken`, pas dans `verificationTokens`
  // (le token est lié à une relation guardian/player, pas directement
  // à un userId). Même souci de sécurité que l'ancien reset password :
  // à migrer vers hash + table dédiée si tu veux le même niveau de garantie.
  // =========================================================

  generateGuardianToken(guardianId: number, playerId: number): string {
    return this.jwtService.sign(
      {
        guardianId,
        playerId,
        purpose: 'guardian_confirmation',
        type: 'full_confirmation',
      },
      {
        expiresIn: '24h',
        secret: this.configService.get('JWT_SECRET'),
      },
    );
  }

  async resendGuardianConfirmation(email: string, playerId: number) {
    const guardian = await this.userService.findByEmail(email);
    if (!guardian) {
      return {
        message: 'Si votre email est enregistré, vous recevrez un nouveau lien.',
      };
    }

    const relationships = await this.guardianService.findRelationshipsByStatus(
      guardian.id,
      'pending',
      { playerId },
    );
    const relationship = relationships[0];
    const newToken = this.generateGuardianToken(relationship.guardianId, relationship.playerId);

    await this.guardianService.update(guardian.id, {
      confirmationToken: newToken,
      tokenExpiresAt: new Date(Date.now() + 60 * 1000),
    });

    const playerUser = await this.userService.findById(playerId);

    const frontendUrl =
      process.env.NODE_ENV === 'dev'
        ? this.configService.get('FRONTEND_DEVELOPMENT_URL')
        : this.configService.get('FRONTEND_PRODUCTION_URL');

    await this.emailService.sendGuardianConfirmationEmail(
      guardian.email!,
      { firstname: playerUser.firstName!, lastname: playerUser.lastName! },
      { gender: guardian.gender!, lastname: guardian.lastName!, firstname: guardian.firstName! },
      frontendUrl,
      newToken,
    );

    return {
      message: 'Un nouveau lien de confirmation a été envoyé à votre adresse email.',
    };
  }

  async verifyGuardianToken(token: string) {
    const payload = await this.jwtService.verify(token, {
      secret: this.configService.get('JWT_SECRET'),
    });

    if (payload.purpose !== 'guardian_confirmation') {
      throw new BadRequestException('Token invalide');
    }

    const relationship = await this.guardianService.findRelationship(
      payload.guardianId,
      payload.playerId,
    );
    if (!relationship) {
      throw new NotFoundException('Relation non trouvée');
    }

    if (relationship.confirmationToken !== token) {
      throw new BadRequestException('Token invalide');
    }

    const player = await this.userService.getUserWithDetails(payload.playerId);
    const guardian = await this.userService.findById(payload.guardianId);
    const hasExpired =
      !!relationship.tokenExpiresAt && relationship.tokenExpiresAt < new Date();

    if (hasExpired) {
      return {
        guardianEmail: guardian.email,
        guardianName: `${guardian.firstName} ${guardian.lastName}`,
        playerId: player.id,
        hasExpired,
      };
    }

    return {
      valid: true,
      guardianEmail: guardian.email,
      guardianName: `${guardian.firstName} ${guardian.lastName}`,
      playerName: `${player.firstName} ${player.lastName}`,
      hasExpired,
      hasAccount: guardian.registrationStatus !== 'parent_invité',
    };
  }

  async confirmGuardian(body: {
    token: string;
    action: 'confirm' | 'reject';
    password?: string;
  }) {
    const { token, action, password } = body;

    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      throw new BadRequestException('Token invalide ou expiré');
    }

    if (payload.purpose !== 'guardian_confirmation') {
      throw new BadRequestException('Token invalide');
    }

    const guardian = await this.userService.findById(payload.guardianId);
    if (!guardian) {
      throw new NotFoundException('Garant non trouvé');
    }

    const relationship = await this.guardianService.findRelationship(
      guardian.id,
      payload.playerId,
    );

    if (relationship.confirmationToken !== token) {
      throw new BadRequestException('Token invalide');
    }

    if (relationship.tokenExpiresAt && relationship.tokenExpiresAt < new Date()) {
      throw new BadRequestException('Token expiré');
    }

    if (action === 'reject') {
      await this.guardianService.updateStatus(relationship.id, 'rejected', new Date());
      return {
        success: true,
        message: 'Vous avez refusé la responsabilité de garant',
      };
    }

    const hasAccount = guardian.registrationStatus !== 'parent_invité';

    if (!hasAccount) {
      if (!password) {
        throw new BadRequestException('Le mot de passe est requis pour créer votre compte');
      }
      if (password.length < 8) {
        throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
      }

      await this.userService.setPassword(guardian.id, password);
      await this.userService.updateRegistrationStatus(guardian.id, 'parent_actif');
      await this.userService.updateVerificationStatus(guardian.id, true);
    } else if (guardian.registrationStatus !== 'parent_actif') {
      throw new BadRequestException("Votre compte n'est pas actif");
    }

    await this.guardianService.updateStatus(relationship.id, 'confirmed', new Date());

    return {
      success: true,
      message: '✅ Vous êtes maintenant garant officiel !',
      redirectTo: '/home',
    };
  }

  // =========================================================
  // Refresh tokens (avec rotation + détection de réutilisation)
  // =========================================================

  private setRefreshCookie(res: Response, rawToken: string) {
    res.cookie('refresh_token', rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'prod',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });
  }

   async generateRefreshToken(
    userId: number,
    familyId: string,
    res?: Response,
    context?: { userAgent?: string; ipAddress?: string },
  ) {
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.insert(refreshTokens).values({
      userId,
      tokenHash,
      familyId,
      expiresAt,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
    });

    if(res){
      this.setRefreshCookie(res, rawToken);
    }
    
  }

  async login(
    dto: LoginDto,
    res: Response,
    context?: { userAgent?: string; ipAddress?: string },
  ) {
    const user = await this.userService.findByEmailUnrestricted(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash, ...safeUser } = user;

    const accessToken = this.generateAccessToken(
      user.id,
      user.role,
      user.email!,
      user.phone!,
    );

    // Un login = nouvelle session -> nouvelle famille de refresh tokens.
    // Comportement actuel : mono-session (on ferme les anciennes).
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
    await this.generateRefreshToken(user.id, randomUUID(), res, context);

    return {
      user: safeUser,
      accessToken,
    };
  }

  async refreshAccessToken(rawRefreshToken: string, res: Response) {
    const tokenHash = hashToken(rawRefreshToken);

    const [stored] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash));

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Token déjà révoqué ou déjà remplacé -> quelqu'un réutilise un ancien token.
    // On invalide toute la famille par précaution (vol probable).
    if (stored.revokedAt || stored.replacedBy) {
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(
          and(eq(refreshTokens.familyId, stored.familyId), isNull(refreshTokens.revokedAt)),
        );
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.userService.findById(stored.userId);
    if (!user) throw new UnauthorizedException('User not found');

    // Rotation : nouveau token dans la même famille, ancien marqué remplacé.
    const newRawToken = generateRawToken();
    const newTokenHash = hashToken(newRawToken);
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    const [newToken] = await db
      .insert(refreshTokens)
      .values({
        userId: user.id,
        tokenHash: newTokenHash,
        familyId: stored.familyId,
        expiresAt: newExpiresAt,
        userAgent: stored.userAgent,
        ipAddress: stored.ipAddress,
      })
      .returning();

    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date(), replacedBy: newToken.id })
      .where(eq(refreshTokens.id, stored.id));

    this.setRefreshCookie(res, newRawToken);

    const newAccessToken = this.generateAccessToken(
      user.id,
      user.role,
      user.email!,
      user.phone!,
    );

    return {
      user,
      accessToken: newAccessToken,
    };
  }

  async logout(userId: number, res: Response) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    return { success: true };
  }

  // Vérification sans consommation : utile pour un GET de pré-check
  // (ex: afficher le formulaire de reset seulement si le token est valide),
  // sans marquer le token comme utilisé.
  async peekVerificationToken(rawToken: string, type: VerificationTokenType) {
    const tokenHash = hashToken(rawToken);

    const [record] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.tokenHash, tokenHash),
          eq(verificationTokens.type, type),
          isNull(verificationTokens.usedAt),
          isNull(verificationTokens.revokedAt),
          gt(verificationTokens.expiresAt, new Date()),
        ),
      );

      if(!record){
        return null;
      }

      const user = await this.userService.findById(record.userId);


    return {...record, email: user.email};
  }
}