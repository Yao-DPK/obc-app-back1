// apps/api/src/modules/payment/services/registration-obligation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { format } from 'date-fns';
import { PaymentEventRepository } from './payment-event.repository';
import { PaymentObligationRepository } from './payment-obligation.repository';
import { buildEventPeriodKey, buildSeasonPeriodKey } from '../common/utils/period-key';


@Injectable()
export class RegistrationObligationService {
  private readonly logger = new Logger(RegistrationObligationService.name);

  constructor(
    private readonly eventRepo: PaymentEventRepository,
    private readonly obligationRepo: PaymentObligationRepository,
  ) {}

  /**
   * Crée les obligations one-shot à l'inscription d'un joueur.
   * Ne crée jamais de mensualité (gérée par le job mensuel).
   */
  async generateForRegistration(
    playerId: number,
    registrationDate: Date = new Date(),
  ): Promise<{ created: number; skipped: number }> {
    // 1. Récupérer les événements applicables à l'inscription
    const events = await this.eventRepo.findMany({isApplicableAtRegistration: true, isActive: true, isRecurringMonthly: false});

    if (events.length === 0) {
      this.logger.log('Aucun événement applicable à l\'inscription');
      return { created: 0, skipped: 0 };
    }

    let created = 0;
    let skipped = 0;

    for (const event of events) {
      // 2. Calculer le periodKey selon le type d'événement
      const periodKey = this.computePeriodKey(event, registrationDate);

      // 3. Créer l'obligation (idempotence via contrainte unique)
      const result = await this.obligationRepo.createIfNotExists({
        eventId: event.id,
        playerId,
        totalAmount: event.amount,
        paidAmount: 0,
        remainingAmount: event.amount,
        dueDate: this.computeDueDate(event, registrationDate),
        description: event.name,
        periodKey,
        status: 'pending',
      });

      if (result.created) created++;
      else skipped++;
    }

    this.logger.log(
      `📝 Inscription joueur ${playerId} : ${created} créées, ${skipped} déjà existantes`,
    );

    return { created, skipped };
  }

  private computePeriodKey(event: any, registrationDate: Date): string {
    // Si l'événement a une date de début (saison), on utilise la saison
    if (event.startDate) {
      const start = new Date(event.startDate);
      // Pour l'inscription annuelle : "saison-2026-2027"
      if (event.name.toLowerCase().includes('inscription')) {
        return buildSeasonPeriodKey(start);
      }
    }
    // Sinon, on utilise une clé basée sur l'eventId + année
    return buildEventPeriodKey(event.id, registrationDate);
  }

  private computeDueDate(event: any, registrationDate: Date): Date {
    // Si l'événement a une date de fin, on l'utilise comme échéance
    if (event.endDate) return new Date(event.endDate);
    // Sinon, 30 jours après l'inscription
    const due = new Date(registrationDate);
    due.setDate(due.getDate() + 30);
    return due;
  }
}