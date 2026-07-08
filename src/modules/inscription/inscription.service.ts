// apps/api/src/modules/inscription/inscription.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';
import { FullRegistrationSchema } from './dto/player-registration.dto';
import { GuardianRelationshipsRepository } from '../guardian/guardian.repository';
import { DocumentService } from '../document/document.service';
import { PlayerRepository } from '../user/player.repository';



@Injectable()
export class InscriptionService {
  constructor(
    private userRepository: UserRepository,
    private guardianRelationshipsRepo: GuardianRelationshipsRepository,
    private documentService: DocumentService,
    private playerRepository: PlayerRepository
  ) {}

  async upload (userId: number,
    inscriptionFiles: {
      buffer: Buffer;
      filetype: string;
      filename: string;
      mimetype: string;
      isObligatory?: boolean;
    }[]
  ){
    let filesUploaded: any[] = [];
    for (let idx = 0; idx < inscriptionFiles.length; idx++) {
      const f = inscriptionFiles[idx];
      const uploaded_file = await this.documentService.fileUpload(f);
      let document_created = await this.documentService.create({
        userId: userId,
        type: f.filetype,
        fileId: uploaded_file.fileId,
        publicUrl: uploaded_file.fileUrl,
        isObligatory: true,
      });
      filesUploaded.push(document_created);
    }
    return filesUploaded;
  }

  

  async preRegister(
    data: z.infer<typeof FullRegistrationSchema>,
    signature: { buffer: Buffer; filename: string; mimetype: string },
    inscriptionFiles: {
      buffer: Buffer;
      filetype: string;
      filename: string;
      mimetype: string;
      isObligatory?: boolean;
    }[],
  ) {
    const { step1, step2 } = data;

    // 1. Vérifier email du joueur
    const existingPlayer = await this.playerRepository.findByBirthDay(step1.birthDate);
    const existingUser = await this.userRepository.findById(existingPlayer?.userId!);
    const samePlayer = existingUser?.firstName == step1.firstName && existingUser?.lastName == step1.lastName && existingUser?.gender == step1.gender
    if (samePlayer) {
      throw new ConflictException('Cet joueur existe déjà');
    }

   /*  // 2. Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(step1.password, 10); */

    // 3. Upload de la signature
    const fileUpload = await this.documentService.fileUpload(signature);
    
    // 4. Créer l'utilisateur (table users) – seulement les champs communs
    const userData: any = {
      email: step1.email,
      //passwordHash: hashedPassword,
      role: 'player',
      registrationStatus: 'pre_inscrit',
      firstName: step1.firstName,
      lastName: step1.lastName,
      gender: step1.gender,
      phone: step1.phone,
      address: step1.address,
      // photoUrl ? (si dispo)
    };
    const joueur = await this.userRepository.create(userData);

    // 5. Créer l'entrée joueur (table players) – champs spécifiques
    const playerData: any = {
      userId: joueur.id,
      birthDate: step1.birthDate,
      school: step1.school,
      class: step1.class,
      emergencyContactName: step1.emergencyContactName,
      emergencyContactPhone: step1.emergencyContactPhone,
      registrationStep: 'attestation_signee', // après soumission de l'attestation
      attestationData: {
        signatoryType: step2.signatoryType,
        selectedGuardianIndex: step2.selectedGuardianIndex,
        signatoryFullName: step2.signatoryFullName,
        acceptedTerms: step2.acceptedTerms,
        signatureUrl: fileUpload.fileUrl,
      },
    };
    await this.playerRepository.create(playerData);


    // 6. Créer les garants et relations (inchangé)
  let guardiansCreated: any[] = [];
  if (!step1.selfManaged && step1.guardians && step1.guardians.length > 0) {
    for (const g of step1.guardians) {
      let guardian = await this.userRepository.findByEmail(g.email);
      if (!guardian) {
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedTemp = await bcrypt.hash(tempPassword, 10);
        guardian = await this.userRepository.create({
          email: g.email,
          passwordHash: hashedTemp,
          role: 'parent',
          registrationStatus: 'parent_invité',
          gender: g.relationship == 'Mère' ? "F" : "M",
          firstName: g.firstName,
          lastName: g.lastName,
          phone: g.phone,
        });
      }
      await this.guardianRelationshipsRepo.create({
        guardianId: guardian.id,
        playerId: joueur.id,
        relationship: g.relationship as 'Mère' | 'Père' | 'Tuteur' | undefined,
        permissions: { canPay: true, canRegister: false },
      });
      guardiansCreated.push(guardian);
    }
  }

    // 7. Upload des documents (inchangé)
    const filesUploaded = await this.documentService.userFilesupload(joueur.id, inscriptionFiles);


    // 9. Définitions des paiements à effectuer

    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endMonthString = endOfMonth.toISOString().split('T')[0];
    const currentMonthName = now.toLocaleString('default', {month: 'long'});


    // 10. Envoie des mails de confirmations aux différents garants.
    
    


    return { joueur, player: playerData, guardiansCreated, filesUploaded };
  }

  async validateRegistration(userId: number){
    this.userRepository.update(userId, {registrationStatus: 'inscrit'});
  }
}
