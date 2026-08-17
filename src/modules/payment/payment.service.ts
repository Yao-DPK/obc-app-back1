// src/modules/payment/payment.service.ts
import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PaymentEventRepository } from './payment-event.repository';
import { PaymentObligationRepository } from './payment-obligation.repository';
import { PaymentIntentRepository } from './payment-intent.repository';
import {
  CreateObligationDto,
  CreateIntentDto,
  VerifyPaymentDto,
  CreatePaymentEventDto,
  UpdatePaymentEventDto,
  PaymentEventSelectSchema,
  PaymentEvent,
  UpdateObligationDto,
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

  async getEventByName(name: string) {
    const event = await this.eventRepo.findByName(name);
    if (!event) throw new NotFoundException('Événement non trouvé');
    return event;
  }

  async getAllEvents(includeInactive = false): Promise<PaymentEvent[]> {
    const events = includeInactive
      ? await this.eventRepo.findAll()
      : await this.eventRepo.findAllActive();
    // 👇 on parse avec le schéma pour transformer les dates
    return events.map(e => PaymentEventSelectSchema.parse(e));
  }

  async createEvent(dto: CreatePaymentEventDto): Promise<PaymentEvent> {
    const created = await this.eventRepo.create(dto);
    return PaymentEventSelectSchema.parse(created);
  }

  async updateEvent(id: number, dto: UpdatePaymentEventDto): Promise<PaymentEvent> {
    const event = await this.eventRepo.findById(id);
    if (!event) throw new NotFoundException('Événement non trouvé');
    const updated = await this.eventRepo.update(id, dto);
    return PaymentEventSelectSchema.parse(updated);
  }

  async deleteEvent(id: number): Promise<void> {
    const event = await this.eventRepo.findById(id);
    if (!event) throw new NotFoundException('Événement non trouvé');
    await this.eventRepo.delete(id);
  }

  // ========== OBLIGATIONS ==========

  async createObligation(dto: Partial<CreateObligationDto>) {
    const event = await this.eventRepo.findById(dto.eventId!);
    if (!event) throw new NotFoundException('Événement non trouvé');

    // Vérifier que le montant n'excède pas le montant de l'événement
    if (dto.totalAmount! > Number(event.amount)) {
      throw new BadRequestException('Le montant total dépasse le montant de l\'événement');
    }

    const obligation = await this.obligationRepo.create({
      eventId: dto.eventId!,
      playerId: dto.playerId!,
      totalAmount: dto.totalAmount!,
      paidAmount: 0,
      remainingAmount: dto.totalAmount!,
      dueDate: dto.dueDate ?( new Date(dto.dueDate) )  : (event.endDate),
      description: `Paiement pour ${event.name}`,
      status: 'pending',
    });

    return obligation;
  }

  async getAllObligations(query: any) {
    const obligations = await this.obligationRepo.findAll(query);
    //console.log(`🔹 Obligations récupérées : ${obligations!.length}`);

    // 1. Récupérer tous les IDs d'événements en une seule fois
    const eventIds = obligations!.map(ob => ob.eventId).filter(id => id !== undefined);
    
    // 2. Récupérer tous les événements en une seule requête
    let eventsMap = new Map<number, string>();
    if (eventIds.length > 0) {
      const events = await this.eventRepo.findByIds(eventIds); // méthode à ajouter
      eventsMap = new Map(events.map(e => [e.id, e.name]));
    }

    // 3. Mapper les obligations avec le nom de l'événement
    const namedObligations = obligations!.map(ob => ({
      ...ob,
      name: eventsMap.get(ob.eventId) || null,
    }));

    //console.log(`🔹 Named obligations : ${JSON.stringify(namedObligations)}`);
    return namedObligations;
  }


  async getObligationsByUser(playerId: number) {
    return this.obligationRepo.findByPlayerId(playerId);
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

    async getObligationsByPlayerId(playerId: number) {
      return this.obligationRepo.findByPlayerId(playerId);
    }

    async updateObligation(id: number, data: UpdateObligationDto) {
      // Vérifier l'existence
      const obligation = await this.obligationRepo.findById(id);
      if (!obligation) {
        throw new NotFoundException('Obligation non trouvée');
      }

      // Vérifier si l'obligation est déjà totalement payée
      const isFullyPaid = Number(obligation.paidAmount) === Number(obligation.totalAmount);

      // Cas : on tente de passer le statut à "overdue" alors que c'est déjà payé
      if (data.status === 'overdue' && isFullyPaid) {
        throw new ConflictException('Ce paiement a déjà été effectué et ne peut pas être marqué comme en retard.');
      }

      // Préparer les données de mise à jour
      const updateData: any = { ...data };

      // Si le statut devient "paid", on force les montants
      if (data.status === 'paid') {
        updateData.paidAmount = Number(obligation.totalAmount);
        updateData.remainingAmount = 0;
      }

      // Mettre à jour
      const updated = await this.obligationRepo.update(id, updateData);
      return updated;
    }

  // ========== INTENTIONS ==========

  async createIntent(userId: number, dto: CreateIntentDto) {
    // Vérifier que l'obligation existe
    const obligation = await this.obligationRepo.findById(dto.obligationId);
    if (!obligation) throw new NotFoundException('Obligation non trouvée');

    // Vérifier que l'obligation n'est pas déjà totalement payée
    const remaining = Number(obligation.remainingAmount || 0);
    if (remaining <= 0) {
      throw new BadRequestException('Cette obligation est déjà entièrement payée');
    }

    // Vérifier que le montant ne dépasse pas le reste à payer
    if (Number(dto.amount) > remaining) {
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

  async getUserPaymentSummary(playerId: number) {
    const obligations = await this.obligationRepo.findByPlayerId(playerId);

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