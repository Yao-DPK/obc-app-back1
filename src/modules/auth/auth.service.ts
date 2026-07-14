import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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
import { UserService } from '../user/user.service';
import { GuardianService } from '../guardian/guardian.service';

@Injectable()
export class AuthService {
  constructor(
    
    private userService: UserService,
    private guardianService: GuardianService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  // TODO: General Generate TOekn method

  private generateAccessToken(
    userId: number,
    role: string,
    email: string,
    phone?: string,
  ) {
    const payload = { sub: userId, role, email, phone };
    return this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: '15m',
    });
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

  generateConfirmationToken(guardianId: number,playerId: number,email: string,) {
    const payload = { sub: email, purpose: 'email_confirmation',guardianId, playerId, email};
    return this.jwtService.sign(payload, { secret: jwtConstants.secret,expiresIn: '1h',});
  }

  verifyConfirmationToken(token: string): { 
    guardianId: number,
    playerId: string,
    email: string, } | null {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_RESET_SECRET'),
      });
      if (payload.purpose !== 'email_confirmation') return null;
      return { email: payload.sub, guardianId: payload.guardianId, playerId: payload.playerId};
    } catch {
      return null;
    }
  }

  generateGuardianToken(guardianId: number, playerId: number): string {
    return this.jwtService.sign(
        {
          guardianId,
          playerId,
          purpose: 'guardian_confirmation',
          type: 'full_confirmation', // Nouveau type qui englobe tout
        },
        {
          expiresIn: '24h',
          secret: this.configService.get('JWT_SECRET'),
        }
      );
    }

  async resendGuardianConfirmation(email:string){
    const guardian = await this.userService.findByEmail(email);
    if (!guardian) {
      // Ne pas révéler si l'email existe (sécurité)
      return {
        message: 'Si votre email est enregistré, vous recevrez un nouveau lien.',
      };
    }

    // Vérifier s'il a des relations en attente
    const relationships = await this.guardianService.findRelationshipsByStatus(guardian.id, 'pending');

    if (relationships.length === 0) {
      throw new BadRequestException('Aucune demande de confirmation en attente');
    }

    // Générer un nouveau token
    const playerId = relationships[0].playerId;
    const newToken = this.generateGuardianToken(guardian.id, playerId);

    // Mettre à jour le token
    guardian.confirmationToken = newToken;
    guardian.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.userService.updateToken(guardian.id, newToken, new Date(Date.now() + 24 * 60 * 60 * 1000));

    // Récupérer les infos du joueur
    const playerUser = await this.userService.findById(playerId);

    // Renvoyer l'email
    const frontendUrl = process.env.NODE_ENV == 'dev'
      ? this.configService.get('FRONTEND_DEVELOPMENT_URL')
      : this.configService.get('FRONTEND_PRODUCTION_URL');

    await this.emailService.sendGuardianConfirmationEmail(
      guardian.email!,
      { firstname: playerUser.firstName!, lastname: playerUser.lastName! },
      { gender: guardian.gender!, lastname: guardian.lastName!, firstname: guardian.firstName! },
      frontendUrl,
      newToken
    );

    return {
      message: 'Un nouveau lien de confirmation a été envoyé à votre adresse email.',
    };
  }

  async verifyGuardianToken(token: string){
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      if (payload.purpose !== 'guardian_confirmation') {
        throw new BadRequestException('Token invalide');
      }

      // Récupérer le garant depuis la base
      const guardian = await this.userService.findById(payload.guardianId);

      if (!guardian) {
        throw new NotFoundException('Garant non trouvé');
      }

      // Vérifier si le token est celui stocké
      if (guardian.confirmationToken !== token) {
        throw new BadRequestException('Token invalide');
      }

      // Vérifier l'expiration
      if (guardian.tokenExpiry && guardian.tokenExpiry < new Date()) {
        throw new BadRequestException('Token expiré');
      }

      // Récupérer les infos du joueur
      const player = await this.userService.getUserWithDetails(payload.playerId);

      return {
        valid: true,
        guardianEmail: guardian.email,
        guardianName: `${guardian.firstName} ${guardian.lastName}`,
        playerName: `${player.firstName} ${player.lastName}`,
        hasAccount: guardian.registrationStatus !== 'parent_invité',
      };
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


  async confirmGuardian(
      body: { 
        token: string; 
        action: 'confirm' | 'reject';
        password?: string;
      }
    ) {
      const { token, action, password } = body;
  
      try {
        // Vérifier le token
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET'),
        });
  
        if (payload.purpose !== 'guardian_confirmation') {
          throw new BadRequestException('Token invalide');
        }
  
        // Récupérer le garant
        const guardian = await this.userService.findById(payload.guardianId);
  
        if (!guardian) {
          throw new NotFoundException('Garant non trouvé');
        }
  
        // Vérifier le token stocké
        if (guardian.confirmationToken !== token) {
          throw new BadRequestException('Token invalide');
        }
  
        if (guardian.tokenExpiry && guardian.tokenExpiry < new Date()) {
          throw new BadRequestException('Token expiré');
        }
  
        // Récupérer la relation
        const relationship = await this.guardianService.findRelationship(
            guardian.id, 
            payload.playerId 
          );
  
        if (!relationship) {
          throw new NotFoundException('Relation non trouvée');
        }
  
        // Si l'action est "reject"
        if (action === 'reject') {

          await this.guardianService.updateStatus(relationship.id, 'rejected', new Date());          
          await this.userService.updateToken(guardian.id, null, null);
  
          /* // Notifier l'organisation (email)
          await this.emailService.notifyGuardianRejection(
            guardian,
            payload.playerId
          );
   */
          return {
            success: true,
            message: 'Vous avez refusé la responsabilité de garant',
          };
        }
  
        // Action "confirm" - Vérifier si le garant a un compte
        const hasAccount = guardian.registrationStatus !== 'parent_invité';
  
        if (!hasAccount) {
          // 🆕 Le garant n'a pas de compte - il doit créer son mot de passe
          if (!password) {
            throw new BadRequestException('Le mot de passe est requis pour créer votre compte');
          }
  
          // Vérifier la force du mot de passe (minimum 8 caractères)
          if (password.length < 8) {
            throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
          }
  
          // Hasher le mot de passe
          const hashedPassword = await bcrypt.hash(password, 10);
          
          // Mettre à jour le compte du garant
          await this.userService.setFirstPassword(guardian.id, hashedPassword);
          await this.userService.updateRegistrationStatus(guardian.id, 'parent_actif');
          await this.userService.updateVerificationStatus(guardian.id, true);
        } else {
          // Le garant a déjà un compte, vérifier qu'il est actif
          if (guardian.registrationStatus !== 'parent_actif') {
            throw new BadRequestException('Votre compte n\'est pas actif');
          }
        }
  
        // ✅ Confirmer le rôle de garant        
          await this.guardianService.updateStatus(relationship.id, 'rejected', new Date());          
          await this.userService.updateToken(guardian.id, null, null);
  
        return {
          success: true,
          message: '✅ Vous êtes maintenant garant officiel !',
          redirectTo: '/dashboard',
        };
      } catch (error: any) {
        throw new BadRequestException(error.message || 'Erreur lors de la confirmation');
      }
    }
    
  

  async register(dto: RegisterDto) {
    if (!dto.secretCode){
      throw new UnauthorizedException("Code Secret Manquant");
    }

    if (dto.secretCode != process.env.REGISTER_SECRET){
      throw new UnauthorizedException("Vous n'avez pas accès à cette opération");
    }

    const existingUser = await this.userService.findByEmailUnrestricted(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = await db
      .insert(users)
      .values({
        email: dto.email,
        passwordHash: hashedPassword,
        role: dto.role,
      })
      .returning();
    const token = this.jwtService.sign({
      sub: newUser[0].id,
      role: newUser[0].role,
    });

    return {
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        role: newUser[0].role,
      },
      token,
    };
  }

  async login(dto: LoginDto, res: Response) {
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
    await this.generateRefreshToken(user.id, res);

    return {
      user: safeUser,
      accessToken,
    };
  }

  async refreshAccessToken(refreshToken: string, res: Response) {
    const [stored] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, refreshToken));
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const user = await this.userService.findById(stored.userId);
    if (!user) throw new UnauthorizedException('User not found');

    const newAccessToken = this.generateAccessToken(
      user.id,
      user.role,
      user.email!,
      user.phone!,
    );
    return {
      user: user,
      accessToken: newAccessToken,
    };
  }

  async logout(userId: number, res: Response) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    return { success: true };
  }

  
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    // Sécurité : on ne révèle pas l'existence de l'email
    if (!user) return;

    // Générer un token JWT valable 1 heure
    const payload = { sub: user.id, email: user.email, purpose: 'reset' };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_RESET_SECRET'),
      expiresIn: '1h',
    });

    const frontendUrl =
      process.env.NODE_ENV == 'dev'
        ? this.configService.get('FRONTEND_DEVELOPMENT_URL')
        : this.configService.get('FRONTEND_PRODUCTION_URL');
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

    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    await this.userService.setFirstPassword(user.id,  newPassword);
    // Optionnel : supprimer tous les refresh tokens de l'utilisateur
  }
}
