import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { PlayerRepository } from './player.repository';
import { PlayerSelect, UserSelect } from '../../database/db';
import { UpdateProfileDto } from './dto/user.dto';
import { GuardianService } from '../guardian/guardian.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly playerRepository: PlayerRepository,
    private readonly guardianService: GuardianService,
  ) {}

  // ========== LECTURE ==========

  async getUsersByIds(ids: number[]): Promise<Omit<UserSelect, 'passwordHash'>[]> {
    const users = await this.userRepository.findByIds(ids);
    return users.map(({ passwordHash, ...safe }) => safe);
  }

  async findById(id: number): Promise<Omit<UserSelect, 'passwordHash'>>{
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return this.safe(user);
  }

  async findByRoleAndId(id: number, role: 'player' | 'parent' | 'admin'): Promise<Omit<UserSelect, 'passwordHash'>>{
    const user = await this.userRepository.findByIdAndRole(id, role);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return this.safe(user);
  }

  async findByEmail(email: string): Promise<Omit<UserSelect, 'passwordHash'>>{
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return this.safe(user);
  }

  async findByEmailUnrestricted(email: string): Promise<UserSelect>{
    const user = await this.userRepository.findByEmail(email);
    //if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user!;
  }

  async getUserWithDetails(userId: number): Promise<Omit<UserSelect, 'passwordHash'> & { playerDetails: any }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    let playerDetails: any = null;
    if (user.role === 'player') {
      playerDetails = await this.playerRepository.findByUserId(userId);
    }

    const safeUser = await this.safe(user);
    return { ...safeUser, playerDetails };
  }

  async getUsersWithDetails(ids: number[]): Promise<Array<Omit<UserSelect, 'passwordHash'> & { playerDetails: PlayerSelect }>> {
    const users = await this.userRepository.findByIds(ids);
    const userIds = users.filter(u => u.role === 'player').map(u => u.id);
    const playerDetailsMap = new Map<number, any>();
    if (userIds.length > 0) {
        const players = await this.playerRepository.findByUserIds(userIds);
        players.forEach(p => playerDetailsMap.set(p.userId, p));
    }
    return users.map(user => {
        const { passwordHash, ...safeUser } = user;
        const playerDetails = playerDetailsMap.get(user.id) || null;
        return { ...safeUser, playerDetails };
    });
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

  
  async getGuardiansByPlayer(playerId: number){
    const guardianIds = await this.guardianService.getGuardiansByPlayer(playerId);
    if(!guardianIds){
      return new Error("Ce joueur n'a pas de tuteur");
    }
    const guardians = await this.getUsersByIds(guardianIds);
    return guardians; 
  }

  async getPlayersByGuardian(guardianId: number){
    const playerIds = await this.guardianService.getPlayersByGuardian(guardianId);
    if(!playerIds){
      return new Error("Ce tuteur n'a pas de joueur");
    }

    const players = await this.getUsersWithDetails(playerIds);
    return players;
    
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

  async setFirstPassword(
    userId: number,
    newPassword: string,
  ): Promise<{ success: true }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { passwordHash: newHash });
    return { success: true };
  }

  async updateToken(id: number, confirmationToken: string | null, tokenExpiry: Date | null){
    const updated = await this.userRepository.update(id, {confirmationToken: confirmationToken, tokenExpiry: tokenExpiry});
    return updated;
  }


  // ========== STATUTS ==========

  async updateRegistrationStatus(
    userId: number,
    status: string,
  ): Promise<{ success: true }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    await this.userRepository.update(userId, { registrationStatus: status });
    return { success: true };
  }

  async updateVerificationStatus(
    userId: number,
    status: boolean,
  ): Promise<{ success: true }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    await this.userRepository.update(userId, { isVerified: status });
    return { success: true };
  }

  // ========== UTILITAIRES ==========

  async exists(userId: number): Promise<boolean> {
    return this.userRepository.exists(userId);
  }

  async safe(user: UserSelect){
    const {passwordHash, ...safeUser} = user;
    return safeUser;
  }
  
}