// apps/api/src/modules/payment/services/monthly-payment.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PaymentEventRepository } from './payment-event.repository';
import { PaymentObligationRepository } from './payment-obligation.repository';
import { buildMonthlyPeriodKey } from '../common/utils/period-key';
import { UserService } from '../user/user.service';


@Injectable()
export class MonthlyPaymentService {
  private readonly logger = new Logger(MonthlyPaymentService.name);

  constructor(
    private readonly eventRepo: PaymentEventRepository,
    private readonly obligationRepo: PaymentObligationRepository,
    private readonly userSerivce: UserService,
  ) {}

  /**
   * Génère les mensualités pour le mois M-1 (le mois qui vient de finir).
   * Appelé le 2 du mois M.
   */
  async generateForPreviousMonth(
    executionDate: Date = new Date(),
  ): Promise<{ created: number; skipped: number; failed: number }> {
    // 1. Calculer le mois cible (M-1)
    const targetMonth = new Date(
      executionDate.getFullYear(),
      executionDate.getMonth() - 1,
      1,
    );
    const periodKey = buildMonthlyPeriodKey(targetMonth);
    const targetMonthNumber = targetMonth.getMonth() + 1; // 1-12
    const dueDate = new Date(executionDate.getFullYear(), executionDate.getMonth(), 5);
    const targetMonthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);



    this.logger.log(`🔄 Génération des mensualités ${periodKey}`);

    // 2. Récupérer les événements mensuels actifs
    const monthlyEvents = await this.eventRepo.findMany({isActive: true, isRecurringMonthly: true});
    if (monthlyEvents.length === 0) {
      this.logger.warn('Aucun événement mensuel actif');
      return { created: 0, skipped: 0, failed: 0 };
    }

    // 3. Filtrer les événements qui excluent ce mois
    const applicableEvents = monthlyEvents.filter(
      (event) => !event.excludedMonths?.includes(targetMonthNumber),
    );

    if (applicableEvents.length === 0) {
      this.logger.log(
        `Aucun événement applicable pour le mois ${targetMonthNumber} (exclusions)`,
      );
      return { created: 0, skipped: 0, failed: 0 };
    }

    // 4. Récupérer les joueurs inscrits
    const players = await this.userSerivce.findUsers({role:'player', registrationStatus:'inscrit', createdTo: targetMonthStart});
    if (players.length === 0) {
      this.logger.warn('Aucun joueur inscrit');
      return { created: 0, skipped: 0, failed: 0 };
    }

    // 5. Générer les obligations
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const player of players) {
      for (const event of applicableEvents) {
        const description = `${event.name} - ${format(targetMonth, 'MMMM yyyy', { locale: fr })}`;

        const result = await this.obligationRepo.createIfNotExists({
          eventId: event.id,
          playerId: player.id,
          totalAmount: event.amount,
          paidAmount: 0,
          remainingAmount: event.amount,
          dueDate,
          description,
          periodKey,
          status: 'pending',
        });

        if (result.created) created++;
        else skipped++;
      }
    }

    this.logger.log(
      `✅ ${created} créées, ${skipped} déjà existantes, ${failed} erreurs (${periodKey})`,
    );

    return { created, skipped, failed };
  }
}