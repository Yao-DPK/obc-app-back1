import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { PlayerRepository } from './player.repository';
import { PlayerSelect, UserSelect } from '../../database/db';
import { UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly playerRepository: PlayerRepository,
  ) {}

  // ========== LECTURE ==========

  async getUser(userId: number): Promise<Omit<UserSelect, 'passwordHash'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async getUserWithDetails(userId: number): Promise<Omit<UserSelect, 'passwordHash'> & { playerDetails: any }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    let playerDetails: any = null;
    if (user.role === 'player') {
      playerDetails = await this.playerRepository.findByUserId(userId);
    }

    const { passwordHash, ...safeUser } = user;
    return { ...safeUser, playerDetails };
  }

  async getUserRestricted(userId: number): Promise<Omit<UserSelect, 'passwordHash'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    if (user.role === 'admin' || user.role === 'super_admin') {
      throw new UnauthorizedException('Accès non autorisé');
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async getUsersByIds(ids: number[]): Promise<Omit<UserSelect, 'passwordHash'>[]> {
    const users = await this.userRepository.findByIds(ids);
    return users.map(({ passwordHash, ...safe }) => safe);
  }

  // ========== MISE À JOUR ==========

  async updateProfile(userId: number, data: UpdateProfileDto): Promise<{ success: true }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    // --- 1. Mettre à jour les champs de `users` ---
    const userFields: Partial<UserSelect> = {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      phone: data.phone,
      address: data.address,
      photoUrl: data.photoUrl,
      notificationPreferences: data.notificationPreferences,
      registrationStatus: data.registrationStatus,
    };
    const cleanUserFields = Object.fromEntries(
      Object.entries(userFields).filter(([_, v]) => v !== undefined)
    );
    if (Object.keys(cleanUserFields).length > 0) {
      await this.userRepository.update(userId, cleanUserFields);
    }

    // --- 2. Si c'est un joueur, mettre à jour `players` ---
    if (user.role === 'player') {
      const playerFields: Partial<PlayerSelect> = {
        birthDate: data.birthDate,
        school: data.school,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        attestationData: data.attestationData,
      };
      const cleanPlayerFields = Object.fromEntries(
        Object.entries(playerFields).filter(([_, v]) => v !== undefined)
      );
      if (Object.keys(cleanPlayerFields).length > 0) {
        const existingPlayer = await this.playerRepository.findByUserId(userId);
        if (existingPlayer) {
          await this.playerRepository.update(existingPlayer.id, cleanPlayerFields);
        } else {
          // Créer l'entrée player si elle n'existe pas
          await this.playerRepository.create({ userId, ...cleanPlayerFields });
        }
      }
    }

    return { success: true };
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Mot de passe actuel incorrect');

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { passwordHash: newHash });

    return { success: true };
  }

  // ========== STATUTS ==========

  async updateRegistrationStatus(
    userId: number,
    status: 'inscrit' | 'rejeté',
  ): Promise<{ success: true }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    await this.userRepository.update(userId, { registrationStatus: status });
    return { success: true };
  }

  // ========== UTILITAIRES ==========

  async exists(userId: number): Promise<boolean> {
    return this.userRepository.exists(userId);
  }

  
}