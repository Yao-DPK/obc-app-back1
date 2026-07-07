// src/modules/payment/payment.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentEventRepository } from './payment-event.repository';
import { PaymentObligationRepository } from './payment-obligation.repository';
import { PaymentIntentRepository } from './payment-intent.repository';
import {
  CreateObligationDto,
  CreateIntentDto,
  VerifyPaymentDto,
} from './payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly eventRepo: PaymentEventRepository,
    private readonly obligationRepo: PaymentObligationRepository,
    private readonly intentRepo: PaymentIntentRepository,
  ) {}

  // ========== ÉVÉNEMENTS ==========

  async getActiveEvents() {
    return this.eventRepo.findAllActive();
  }

  async getEventById(id: number) {
    const event = await this.eventRepo.findById(id);
    if (!event) throw new NotFoundException('Événement non trouvé');
    return event;
  }

  // ========== OBLIGATIONS ==========

  async createObligation(userId: number, dto: CreateObligationDto) {
    const event = await this.eventRepo.findById(dto.eventId);
    if (!event) throw new NotFoundException('Événement non trouvé');

    // Vérifier que le montant n'excède pas le montant de l'événement
    if (dto.totalAmount > Number(event.amount)) {
      throw new BadRequestException('Le montant total dépasse le montant de l\'événement');
    }

    const obligation = await this.obligationRepo.create({
      userId,
      eventId: dto.eventId,
      playerIds: dto.playerIds,
      totalAmount: dto.totalAmount.toString(),
      paidAmount: 0,
      remainingAmount: dto.totalAmount.toString(),
      dueDate: dto.dueDate ?( new Date(dto.dueDate) as unknown as string)  : (event.endDate as unknown as string),
      description: `Paiement pour ${event.name}`,
      status: 'pending',
    });

    return obligation;
  }

  async getAllObligations() {
  return this.obligationRepo.findAll(); // méthode à ajouter dans le repository
  }



  async getObligationsByUser(userId: number) {
    return this.obligationRepo.findByUser(userId);
  }

  async getObligationWithIntents(obligationId: number) {
    const obligation = await this.obligationRepo.findById(obligationId);
    if (!obligation) throw new NotFoundException('Obligation non trouvée');

    const intents = await this.intentRepo.findByObligation(obligationId);

    return {
      ...obligation,
      intents,
    };
  }

  // ========== INTENTIONS ==========

  async createIntent(userId: number, dto: CreateIntentDto) {
    // Vérifier que l'obligation existe
    const obligation = await this.obligationRepo.findById(dto.obligationId);
    if (!obligation) throw new NotFoundException('Obligation non trouvée');

    // Vérifier que l'utilisateur est bien le propriétaire
    if (obligation.userId !== userId) {
      throw new BadRequestException('Vous n\'êtes pas autorisé à payer cette obligation');
    }

    // Vérifier que l'obligation n'est pas déjà totalement payée
    const remaining = Number(obligation.remainingAmount || 0);
    if (remaining <= 0) {
      throw new BadRequestException('Cette obligation est déjà entièrement payée');
    }

    // Vérifier que le montant ne dépasse pas le reste à payer
    if (dto.amount > remaining) {
      throw new BadRequestException(
        `Le montant (${dto.amount}) dépasse le reste à payer (${remaining})`
      );
    }

    const intent = await this.intentRepo.create({
      obligationId: dto.obligationId,
      userId,
      amount: dto.amount.toString(),
      method: dto.method,
      transactionReference: dto.transactionReference,
      transactionMetadata: dto.transactionMetadata,
      status: 'pending',
      declaredAt: new Date(),
    });

    return intent;
  }

  async getAllIntents() {
  return this.intentRepo.findAll(); // méthode à ajouter dans le repository
  }

  async getIntentsByUser(userId: number) {
    return this.intentRepo.findByUser(userId);
  }

  async getIntentById(id: number) {
    const intent = await this.intentRepo.findById(id);
    if (!intent) throw new NotFoundException('Intention de paiement non trouvée');
    return intent;
  }

  async updateIntentStatus(
    intentId: number,
    status: 'paid' | 'failed' | 'cancelled' | 'pending', 
    transactionReference?: string,
  ) {
    const intent = await this.intentRepo.findById(intentId);
    if (!intent) throw new NotFoundException('Intention non trouvée');

    const updates: any = { status };
    if (transactionReference) {
      updates.transactionReference = transactionReference;
    }
    if (status === 'paid') {
      updates.verifiedAt = new Date();
    }

    const updated = await this.intentRepo.update(intentId, updates);

    // Si le paiement est validé, mettre à jour l'obligation associée
    if (status === 'paid' && intent.obligationId) {
      const amount = Number(intent.amount);
      await this.obligationRepo.updatePaidAmount(intent.obligationId, amount);
    }

    return updated;
  }

  // ========== VÉRIFICATION DES PAIEMENTS ==========

  async verifyPayment(adminId: number, dto: VerifyPaymentDto) {
    const { intentId, status } = dto;

    const intent = await this.intentRepo.findById(intentId);
    if (!intent) throw new NotFoundException('Intention de paiement non trouvée');

    if (intent.status === 'paid') {
      throw new BadRequestException('Ce paiement a déjà été vérifié');
    }

    // Si rejeté
    if (status === 'rejected') {
      await this.intentRepo.updateStatus(intentId, 'failed');
      return { message: 'Paiement rejeté', intentId };
    }

    // Si validé
    const verified = await this.intentRepo.verify(intentId, adminId);

    // Mettre à jour l'obligation associée
    const obligation = await this.obligationRepo.findById(intent.obligationId);
    if (obligation) {
      const amount = Number(intent.amount);
      await this.obligationRepo.updatePaidAmount(obligation.id, amount);
    }

    return {
      message: 'Paiement validé',
      intent: verified,
      obligation,
    };
  }

  // ========== STATISTIQUES / RÉCAPITULATIFS ==========

  async getUserPaymentSummary(userId: number) {
    const obligations = await this.obligationRepo.findByUser(userId);

    const totalObligations = obligations.length;
    const totalAmount = obligations.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalPaid = obligations.reduce((sum, o) => sum + Number(o.paidAmount || 0), 0);
    const totalRemaining = totalAmount - totalPaid;

    const statusCounts = {
      pending: obligations.filter((o) => o.status === 'pending').length,
      partial: obligations.filter((o) => o.status === 'partial').length,
      paid: obligations.filter((o) => o.status === 'paid').length,
      overdue: obligations.filter((o) => o.status === 'overdue').length,
    };

    // Vérifier les obligations en retard
    const now = new Date();
    for (const o of obligations) {
      if (o.dueDate && new Date(o.dueDate) < now && o.status !== 'paid' && o.status !== 'cancelled') {
        await this.obligationRepo.updateStatus(o.id, 'overdue');
      }
    }

    return {
      totalObligations,
      totalAmount,
      totalPaid,
      totalRemaining,
      statusCounts,
    };
  }

  // ========== UTILITAIRES ==========

  async getTransactionByReference(ref: string) {
    const intent = await this.intentRepo.findByTransactionReference(ref);
    if (!intent) throw new NotFoundException('Transaction non trouvée');
    return intent;
  }

  async cancelObligation(obligationId: number, userId: number) {
    const obligation = await this.obligationRepo.findById(obligationId);
    if (!obligation) throw new NotFoundException('Obligation non trouvée');

    if (obligation.userId !== userId) {
      throw new BadRequestException('Vous n\'êtes pas autorisé à annuler cette obligation');
    }

    if (obligation.status === 'paid') {
      throw new BadRequestException('Une obligation déjà payée ne peut pas être annulée');
    }

    // Vérifier qu'aucun intent n'est en cours
    const intents = await this.intentRepo.findByObligation(obligationId);
    const hasPending = intents.some((i) => i.status === 'pending');
    if (hasPending) {
      throw new BadRequestException('Un paiement est en cours pour cette obligation');
    }

    await this.obligationRepo.updateStatus(obligationId, 'cancelled');
    return { message: 'Obligation annulée' };
  }
}