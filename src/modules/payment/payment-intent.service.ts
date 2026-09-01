// src/modules/payment/services/payment-intent.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IntentFilters, PaymentIntentRepository } from './payment-intent.repository';
import { PaymentObligationRepository } from './payment-obligation.repository';
import { randomUUID } from 'crypto';
import { S3Service } from '../s3/s3.service';
import { db, PayIntentSelect } from '@/database/db';
import { CreateIntentDto, VerifyIntentDto } from './payment.dto';

@Injectable()
export class PaymentIntentService {
  constructor(
    private readonly intentRepo: PaymentIntentRepository,
    private readonly obligationRepo: PaymentObligationRepository,
    private readonly s3Service: S3Service,
  ) {}

  // ========== CRÉATION ==========

  async create(
    userId: number,
    dto: CreateIntentDto,
    justificationFile: Express.Multer.File,
  ): Promise<{ intentId: number; status: string }> {
    // 1. Vérifier l'obligation
    const obligation = await this.obligationRepo.findById(dto.obligationId);
    if (!obligation) {
      throw new NotFoundException('Obligation non trouvée');
    }

    // 2. Vérifier que l'utilisateur est autorisé (parent du joueur ou admin)
    // TODO: Vérifier avec le GuardianService

    // 3. Vérifier que l'obligation est payable
    if (obligation.status === 'paid' || obligation.status === 'cancelled') {
      throw new BadRequestException('Cette obligation n\'est plus payable');
    }

    // 4. Vérifier le montant
    const remaining = Number(obligation.remainingAmount ?? obligation.totalAmount);
    if (Number(dto.amount) > remaining) {
      throw new BadRequestException(`Le montant (${dto.amount}) dépasse le reste à payer (${remaining})`);
    }

    // 5. Upload du justificatif sur S3
    const fileName = `payment-proofs/${randomUUID()}-${justificationFile.originalname}`;
    const { key, url } = await this.s3Service.uploadFile(
      justificationFile.buffer,
      fileName,
      justificationFile.mimetype,
    );

    // 6. Créer l'intention
    const intent = await this.intentRepo.create({
      obligationId: dto.obligationId,
      userId,
      amount: dto.amount,
      method: dto.method,
      status: 'pending',
      transactionMetadata: {
        justificationId: key,
        justificationUrl: url,
      },
    });

    return { intentId: intent.id, status: intent.status };
  }

  // ========== LECTURE ==========

  async findIntents(filters?: IntentFilters): Promise<PayIntentSelect[]> {
      const intents = await this.intentRepo.findMany(filters);
      return await Promise.all(
      intents.map(async (intent) => {
        const metadata = intent.transactionMetadata as any;
        let signedUrl = '';
        if (metadata?.justificationId) {
          signedUrl = await this.s3Service.getSignedUrl(metadata.justificationId, 300);
          
        }
        return {
          ...intent,
          transactionMetadata: {
            ...metadata,
            signedJustificationUrl: signedUrl,
          },
        };
      }),
    );
    }

  async findIntent(filters?: IntentFilters): Promise<PayIntentSelect | null> {
      const intent = await this.intentRepo.findOne(filters);
      if (!intent){
        throw new NotFoundException('Intention Introuvable');
      }
      const metadata = intent.transactionMetadata as any;
        let signedUrl = '';
        if (metadata?.justificationId) {
          signedUrl = await this.s3Service.getSignedUrl(metadata.justificationId, 300);
          
        }
        return {
          ...intent,
          transactionMetadata: {
            ...metadata,
            signedJustificationUrl: signedUrl,
          },
        };
    }
  

  async getByObligation(obligationId: number, userId?: number): Promise<any[]> {
    const intents = await this.intentRepo.findMany({ obligationId: obligationId });
    // Enrichir avec les URLs signées pour les justificatifs
    return await Promise.all(
      intents.map(async (intent) => {
        const metadata = intent.transactionMetadata as any;
        let signedUrl = '';
        if (metadata?.justificationId) {
          signedUrl = await this.s3Service.getSignedUrl(metadata.justificationId, 300);
          
        }
        return {
          ...intent,
          transactionMetadata: {
            ...metadata,
            signedJustificationUrl: signedUrl,
          },
        };
      }),
    );
  }

  async getByUserId(userId: number): Promise<any[]> {
    const intents = await this.intentRepo.findMany({ userId: userId });
    // Enrichir avec les URLs signées pour les justificatifs
    console.log(`intents: ${intents}`);
    return await Promise.all(
      intents.map(async (intent) => {
        const metadata = intent.transactionMetadata as any;
        let signedUrl = '';
        if (metadata?.justificationId) {
          signedUrl = await this.s3Service.getSignedUrl(metadata.justificationId, 300);
          
        }
        return {
          ...intent,
          transactionMetadata: {
            ...metadata,
            signedJustificationUrl: signedUrl,
          },
        };
      }),
    );
  }

  async getPendingForAdmin(): Promise<any[]> {
    const intents = await this.intentRepo.findMany(
      { status: 'pending' },
      { orderBy: 'createdAt', order: 'DESC' },
    );
    console.log(`intents: ${JSON.stringify(intents)}`);
    const en_intents = await this.enrichWithDetails(intents);
    return en_intents;
  }

  async getById(intentId: number): Promise<any> {
    const intent = await this.intentRepo.findById(intentId);
    if (!intent) throw new NotFoundException('Intention non trouvée');
    return this.enrichWithDetails([intent]).then((arr) => arr[0]);
  }

  // ========== VÉRIFICATION PAR L'ADMIN ==========

  async verify(
    intentId: number,
    adminId: number,
    dto: VerifyIntentDto,
  ): Promise<{ success: boolean; message: string }> {
    // Utiliser une transaction pour garantir l'atomicité
    return await db.transaction(async (trx) => {
      // 1. Récupérer l'intention
      const intent = await this.intentRepo.findById(intentId);
      if (!intent) throw new NotFoundException('Intention non trouvée');
      if (intent.status !== 'pending') {
        throw new BadRequestException(`Cette intention est déjà ${intent.status}`);
      }

      // 2. Mettre à jour l'intention
      const updatedIntent = await this.intentRepo.update(intentId, {
        status: dto.status === 'paid' ? 'paid' : 'failed',
        verifiedBy: adminId,
        verifiedAt: new Date(),
      });

      // 3. Si validée, mettre à jour l'obligation
      if (dto.status === 'paid') {
        const obligation = await this.obligationRepo.findById(intent.obligationId);
        if (!obligation) throw new NotFoundException('Obligation associée non trouvée');

        const paidAmount = Number(obligation.paidAmount) + Number(intent.amount);
        const totalAmount = Number(obligation.totalAmount);
        const remaining = totalAmount - paidAmount;
        const newStatus = remaining <= 0 ? 'paid' : 'partial';

        await this.obligationRepo.update(intent.obligationId, {
          paidAmount,
          remainingAmount: remaining,
          status: newStatus,
          updatedAt: new Date(),
        });
      }

      // 4. (Optionnel) Envoyer une notification
      // await this.notificationService.sendPaymentStatus(intent.userId, dto.status);

      return {
        success: true,
        message: dto.status === 'paid' ? 'Paiement validé' : 'Paiement rejeté',
      };
    });
  }

  // ========== UTILITAIRES PRIVÉS ==========

  private async enrichWithDetails(intents: any[]): Promise<any[]> {
    // Récupérer les obligations associées pour enrichir les données
    const obligationIds = intents.map((i) => i.obligationId);
    const obligations = await this.obligationRepo.findAll({obligationIds});
    const obligationMap = new Map(obligations!.map((o) => [o.id, o]));

    return await Promise.all(
      intents.map(async (intent) => {
        const metadata = intent.transactionMetadata as any;
        let signedUrl = '';
        if (metadata?.justificationId) {
          signedUrl = await this.s3Service.getSignedUrl(metadata.justificationId, 300);
        }

        const obligation = obligationMap.get(intent.obligationId);

        return {
          ...intent,
          transactionMetadata: {
            ...metadata,
            signedJustificationUrl: signedUrl,
          },
          obligation: obligation ? {
            id: obligation.id,
            description: obligation.description,
            totalAmount: obligation.totalAmount,
            paidAmount: obligation.paidAmount,
            status: obligation.status,
          } : null,
        };
      }),
    );
  }
}