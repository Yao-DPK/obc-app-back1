import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { GuardianRelationshipsRepository } from './guardian.repository';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class GuardianService {
  constructor(
    private readonly relationshipRepo: GuardianRelationshipsRepository,
    private readonly userRepo: UserRepository,
  ) {}

  // ========== CRÉATION ==========

  async linkPlayer(
    guardianId: number,
    playerId: number,
    permissions: { canPay?: boolean; canRegister?: boolean } = { canPay: true, canRegister: false },
  ) {
    // Vérifier que le joueur existe
    const player = await this.userRepo.findById(playerId);
    if (!player) throw new NotFoundException('Joueur non trouvé');

    // Vérifier que le lien n'existe pas déjà
    const existing = await this.relationshipRepo.findLink(guardianId, playerId);
    if (existing) throw new ConflictException('Ce lien existe déjà');

    // Créer le lien
    const link = await this.relationshipRepo.create({
      guardianId,
      playerId,
      permissions,
    });

    return link;
  }

  // ========== LECTURE ==========

  async getGuardiansByPlayer(playerId: number) {
    const relationships = await this.relationshipRepo.findByPlayerId(playerId);
    const guardianIds = relationships.map((r) => r.guardianId);

    // Option 1 : retourner seulement les IDs
    //return { guardianIds };

    // Option 2 : retourner les utilisateurs complets (décommente si nécessaire)
    const guardians = await this.userRepo.findByIds(guardianIds);
    return guardians;
  }

  async getPlayersByGuardian(guardianId: number) {
    const relationships = await this.relationshipRepo.findByGuardianId(guardianId);
    const playerIds = relationships.map((r) => r.playerId);
    // Option 1 : retourner seulement les IDs
    //return { playerIds };

    // Option 2 : retourner les utilisateurs complets (décommente si nécessaire)
    const players = await this.userRepo.findByIds(playerIds);
    return players;
  }

  async getRelationship(guardianId: number, playerId: number) {
    const link = await this.relationshipRepo.findLink(guardianId, playerId);
    if (!link) throw new NotFoundException('Relation non trouvée');
    return link;
  }

  // ========== SUPPRESSION ==========

  async unlinkPlayer(guardianId: number, playerId: number): Promise<void> {
    const link = await this.relationshipRepo.findLink(guardianId, playerId);
    if (!link) throw new NotFoundException('Relation non trouvée');

    await this.relationshipRepo.delete(link.id);
  }

  // ========== MISE À JOUR ==========

  async updatePermissions(
    guardianId: number,
    playerId: number,
    permissions: { canPay?: boolean; canRegister?: boolean },
  ) {
    const link = await this.relationshipRepo.findLink(guardianId, playerId);
    if (!link) throw new NotFoundException('Relation non trouvée');

    const updated = await this.relationshipRepo.update(link.id, {
      permissions: { ...link.permissions, ...permissions },
    });

    return updated;
  }
}