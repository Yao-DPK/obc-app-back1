// apps/api/src/modules/inscription/inscription.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';
import { FullRegistrationSchema } from './dto/player-registration.dto';
import { GuardianRelationshipsRepository } from '../guardian/guardian.repository';
import { DocumentService } from '../document/document.service';
import { PaymentObligationService } from '../payment/payment-obligations/payment-obligations.service';



@Injectable()
export class InscriptionService {
  constructor(
    private userRepository: UserRepository,
    private guardianRelationshipsRepo: GuardianRelationshipsRepository,
    private documentService: DocumentService,
    private paymentObligationService: PaymentObligationService
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
    const existingJoueur = await this.userRepository.findByEmail(step1.email);
    if (existingJoueur) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // 2. Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(step1.password, 10);

    // 3. Upload de la signature

    const fileUpload = await this.documentService.fileUpload(signature);
    /* const fileBuffer = await signature.buffer;
    const originalName = signature.filename;
    const mimeType = signature.mimetype;
    const signatureUpload = await this.googleDriveService.uploadFile(fileBuffer, originalName, mimeType);
    const signatureUrl = signatureUpload.publicUrl; // ajustez selon votre service
 */
    // 4. Créer le joueur
    const joueurData: any = {
      email: step1.email,
      passwordHash: hashedPassword,
      role: 'player',
      registrationStatus: 'pre_inscrit',
      registrationStep: 'attestation_signee', // après soumission de l'attestation
      firstName: step1.firstName,
      lastName: step1.lastName,
      birthDate: step1.birthDate,
      gender: step1.gender,
      phone: step1.phone,
      address: step1.address,
      school: step1.school,
      class: step1.class,
      emergencyContactName: step1.emergencyContactName,
      emergencyContactPhone: step1.emergencyContactPhone,
      attestationData: {
        signatoryType: step2.signatoryType,
        selectedGuardianIndex: step2.selectedGuardianIndex,
        signatoryFullName: step2.signatoryFullName,
        acceptedTerms: step2.acceptedTerms,
        fileUpload,
      },
    };
    const joueur = await this.userRepository.create(joueurData);

    // 5. Créer les garants et les relations si le joueur n'est pas autonome
    let guardiansCreated: any[] = [];
    if (!step1.selfManaged && step1.guardians && step1.guardians.length > 0) {
      for (let idx = 0; idx < step1.guardians.length; idx++) {
        const g = step1.guardians[idx];
        let guardian = await this.userRepository.findByEmail(g.email);
        if (!guardian) {
          const tempPassword = Math.random().toString(36).slice(-8);
          const hashedTemp = await bcrypt.hash(tempPassword, 10);
          guardian = await this.userRepository.create({
            email: g.email,
            passwordHash: hashedTemp,
            role: 'parent',
            registrationStatus: 'parent_invité',
            registrationStep: 'formulaire',
            firstName: g.firstName,
            lastName: g.lastName,
            phone: g.phone,
          });
        }
        // Créer la relation
        await this.guardianRelationshipsRepo.create({
          guardianId: guardian.id,
          playerId: joueur.id,
          relationship: g.relationship,
          permissions: { canPay: true, canRegister: false },
        });
        guardiansCreated.push(guardian);
      }
    }

    // 6. Si le joueur est autonome, on peut stocker le contact d'urgence (déjà dans joueur)

    // 7. Envoyer des notifications ? (mail au joueur pour l'informer que l'inscription est soumise)

    // 8. Enregistrement des documents de l'utilisateur
    let filesUploaded: Promise<any[]> = this.documentService.userFilesupload(joueur.id, inscriptionFiles);

    // 9. Définitions des paiements à effectuer

    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endMonthString = endOfMonth.toISOString().split('T')[0];
    const currentMonthName = now.toLocaleString('default', {month: 'long'});

    this.paymentObligationService.create({
      playerId: joueur.id,
      amount: 15000,
      dueDate: endMonthString,
      description: `Mensualité du mois de ${currentMonthName}`,
      status : 'pending'
    })

    this.paymentObligationService.create({
      playerId: joueur.id,
      amount: 50000,
      dueDate: endMonthString,
      description: `Inscription annuelle`,
      status : 'pending'
    })

    // 10. Envoie des mails de confirmations aux différents garants.
    
    


    return { joueur, guardiansCreated, filesUploaded };
  }

  async validateRegistration(userId: number){
    this.userRepository.update(userId, {registrationStatus: 'inscrit'});
  }
}
