import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { UserSelect } from '../../database/db';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  // ========== LECTURE ==========

  async getUser(userId: number): Promise<Omit<UserSelect, 'passwordHash'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async getUserRestricted(userId: number): Promise<Omit<UserSelect, 'passwordHash'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    // Restriction : ne pas exposer les admins/superadmins aux non-admin
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

  async updateProfile(userId: number, data: Partial<UserSelect>): Promise<{ success: true }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    await this.userRepository.update(userId, data);
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