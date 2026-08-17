// apps/api/src/modules/inscription/inscription.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';
import { FullRegistrationSchema } from './dto/player-registration.dto';
import { GuardianRelationshipsRepository } from '../guardian/guardian.repository';
import { DocumentService } from '../document/document.service';
import { PlayerRepository } from '../user/player.repository';
import { EmailService } from '../email/email.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from '../payment/payment.service';



@Injectable()
export class InscriptionService {
  constructor(
    private userRepository: UserRepository,
    private guardianRelationshipsRepo: GuardianRelationshipsRepository,
    private documentService: DocumentService,
    private playerRepository: PlayerRepository,
    private paymentService: PaymentService,
    private emailService: EmailService,
    private authService: AuthService, 
    private configService: ConfigService,
  ) {}

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

  console.log(`1`);
  // 1. Vérifier email du joueur
  const existingPlayer = await this.playerRepository.findByBirthDay(step1.birthDate);
  const existingUser = await this.userRepository.findById(existingPlayer?.userId!);
  const samePlayer = existingUser?.firstName == step1.firstName && 
                     existingUser?.lastName == step1.lastName && 
                     existingUser?.gender == step1.gender;
  
  if (samePlayer) {
    throw new ConflictException('Cet joueur existe déjà');
  }
  
    console.log(`2`);

  // 2. Hasher le mot de passe temporaire
  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

    console.log(`3`);
  // 3. Créer l'utilisateur (table users) – seulement les champs communs
  const userData: any = {
    email: step1.email,
    passwordHash: hashedPassword,
    role: 'player',
    registrationStatus: 'pre_inscrit',
    firstName: step1.firstName,
    lastName: step1.lastName,
    gender: step1.gender,
    phone: step1.phone,
    address: step1.address,
  };
  const joueur = await this.userRepository.create(userData);

    console.log(`4`);

  // 4. Upload de la signature
  const signUpload = await this.documentService.userFileupload(joueur.id, {...signature, filetype: "Signature Attestation"});
  

    console.log(`6`);

  // 5. Créer l'entrée joueur (table players) – champs spécifiques
  const playerData: any = {
    userId: joueur.id,
    birthDate: step1.birthDate,
    school: step1.school,
    class: step1.class,
    emergencyContactName: step1.emergencyContactName,
    emergencyContactPhone: step1.emergencyContactPhone,
    registrationStep: 'attestation_signee',
    attestationData: {
      signatoryType: step2.signatoryType,
      selectedGuardianIndex: step2.selectedGuardianIndex,
      signatoryFullName: step2.signatoryFullName,
      acceptedTerms: step2.acceptedTerms,
      signatureUrl: signUpload.publicUrl,
    },
  };
  await this.playerRepository.create(playerData);

    console.log(`6`);

  // 6. Créer les garants
  let guardiansCreated: any[] = [];
  if (!step1.selfManaged && step1.guardians && step1.guardians.length > 0) {
    for (const g of step1.guardians) {
      let guardian = await this.userRepository.findByEmail(g.email);
      
      if (!guardian) {
        // 👉 Le garant n'existe pas : on crée un compte en attente de validation
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedTemp = await bcrypt.hash(tempPassword, 10);
        
        guardian = await this.userRepository.create({
          email: g.email,
          passwordHash: hashedTemp,
          role: 'parent',
          registrationStatus: 'parent_invité', // 🆕 Statut "invité" pour différencier
          gender: g.relationship == 'Mère' ? "F" : "M",
          firstName: g.firstName,
          lastName: g.lastName,
          phone: g.phone,
          // 🔑 On ajoute un champ pour stocker le token de confirmation
          confirmationToken: null, // Sera rempli plus tard
          tokenExpiry: null,
        });
      }
      
      // Créer la relation garant-joueur
      const relation = await this.guardianRelationshipsRepo.create({
        guardianId: guardian.id,
        playerId: joueur.id,
        relationship: g.relationship as 'Mère' | 'Père' | 'Tuteur' | undefined,
        permissions: { canPay: true, canRegister: false },
        // 🆕 Ajouter le statut de confirmation du garant
      });
      
      guardiansCreated.push({...guardian, relationId: relation.id});
    }
  }

    console.log(`7`);
    console.log(`inscriptionFiles: ${JSON.stringify(inscriptionFiles.map((i) => {
      return {...i, buffer:""};
    }))}`);
  // 7. Upload des documents
  const filesUploaded = await this.documentService.userFilesupload(joueur.id, inscriptionFiles);
  

    console.log(`8`);

  // 8. Envoi des emails aux garants - UN SEUL EMAIL AVEC UN SEUL TOKEN
  const player_info = {
    firstname: joueur.firstName!,
    lastname: joueur.lastName!
  };
  
  for (const g of guardiansCreated) {
    const guardian_info = {
      gender: g.gender,
      lastname: g.lastName,
      firstname: g.firstName || 'Garant'
    };
    

    
    // 🆕 Générer un seul token pour tout
    const token = this.authService.generateGuardianToken(g.id, joueur.id);
    
    await this.guardianRelationshipsRepo.update(g.relationId, {
      confirmationToken: token,
      tokenExpiresAt: (new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24h
    });
    
    const frontendUrl = process.env.NODE_ENV == 'dev'
      ? this.configService.get('FRONTEND_DEVELOPMENT_URL')
      : this.configService.get('FRONTEND_PRODUCTION_URL');
    
    // 📧 Envoyer un seul email
    await this.emailService.sendGuardianConfirmationEmail(
      g.email,
      player_info,
      guardian_info,
      frontendUrl,
      token // Un seul token !
    );
  }

  console.log(`9`);
  // 9. Ajout des paiements obligatoires à effectuer pour le joueur inscrit
  let payment_obligations: any[] = [];
  // 9.1 Récupération des évenements de paiement à ajouter.
  // TODO : Faire une association entre évènement et type de paiement à effectuer; par exemple pour l'inscription, les paiements seront la mensualité et l'inscription annuelle
  const monthly_payment = await this.paymentService.getEventByName('Mensualite');
  const annual_payment = await this.paymentService.getEventByName('Inscription Annuelle');

  // 9.2 Création des payments du joueurs
  const monthly_obligation = await this.paymentService.createObligation({
    eventId: monthly_payment.id, 
    playerId: joueur.id, 
    totalAmount: monthly_payment.amount, 
  });
  payment_obligations.push(monthly_obligation);
  const annual_obligation = await this.paymentService.createObligation({
    eventId: annual_payment.id, 
    playerId: joueur.id, 
    totalAmount: annual_payment.amount, 
  });
  payment_obligations.push(annual_obligation);

  console.log(`10`);
  // 10. Envoi du mail au joueur(si mail fourni) afin de pouvoir créer son mot de passe et faire sa première connexion.
  await this.authService.firstLogin(joueur.id);
  
  return { 
    joueur, 
    player: playerData, 
    guardiansCreated, 
    filesUploaded,
    payment_obligations,
    message: 'Inscription enregistrée. Les garants vont recevoir un email de confirmation.'
  };
}

  async get_register_info(){
    console.log("Récupération des données pour l'inscription");
    const required_docs = await this.documentService.getDocumentTypes({event: "Inscription"});
    if (required_docs.length == 0){
      throw new NotFoundException("Aucun document trouvé pour cet evenement");
    };
    return { required_docs };
  }
  async validateRegistration(userId: number){
    this.userRepository.update(userId, {registrationStatus: 'inscrit'});
  }
}
