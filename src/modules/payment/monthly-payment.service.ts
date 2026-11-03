// apps/api/src/modules/payment/services/monthly-payment.service.ts
import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PaymentEventRepository } from './payment-event.repository';
import { PaymentObligationRepository } from './payment-obligation.repository';
import { MonthlyJobRepository } from './monthly-job.repository';
import { buildMonthlyPeriodKey } from '../common/utils/period-key';
import { UserService } from '../user/user.service';


@Injectable()
export class MonthlyPaymentService {
  private readonly logger = new Logger(MonthlyPaymentService.name);

  constructor(
    private readonly eventRepo: PaymentEventRepository,
    private readonly obligationRepo: PaymentObligationRepository,
    private readonly userService: UserService,
    private readonly jobRepo: MonthlyJobRepository,
  ) {}

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Retourne le mois cible (M-1) sous forme "YYYY-MM".
   */
  getTargetMonthKey(executionDate: Date = new Date()): string {
    const target = new Date(
      executionDate.getFullYear(),
      executionDate.getMonth() - 1,
      1,
    );
    return buildMonthlyPeriodKey(target);
  }

  /**
   * Retourne la date d'échéance (le 5 du mois courant).
   */
  private computeDueDate(executionDate: Date): Date {
    return new Date(
      executionDate.getFullYear(),
      executionDate.getMonth(),
      5,
    );
  }

  /**
   * Détermine le statut global de l'exécution.
   * - success : au moins une obligation créée
   * - failed  : aucune créée mais au moins une échouée
   * - success : rien à faire (0 events ou 0 players)
   */
  private computeGlobalStatus(created: number, failed: number): 'success' | 'failed' {
    if (created > 0) return 'success';
    if (failed > 0) return 'failed';
    return 'success';
  }

  // ============================================================
  // GÉNÉRATION MENSUELLE (job complet)
  // ============================================================

  async generateForPreviousMonth(
    executionDate: Date = new Date(),
    executedBy?: number,
  ): Promise<{ created: number; skipped: number; failed: number }> {
    const periodKey = this.getTargetMonthKey(executionDate);
    const targetMonth = new Date(periodKey + '-01');
    const targetMonthNumber = targetMonth.getMonth() + 1;
    const dueDate = this.computeDueDate(executionDate);

    // 1. Garde-fou : refuser si déjà success
    const existing = await this.jobRepo.findByTargetMonth(periodKey);
    if (existing?.status === 'success') {
      throw new ConflictException(
        `Les mensualités ${periodKey} ont déjà été générées`,
      );
    }

    // 2. Enregistrer le début (running)
    const execution = await this.jobRepo.createRunning(periodKey, executedBy);

    try {
      // 3. Événements mensuels applicables
      const monthlyEvents = await this.eventRepo.findMany({
        isRecurringMonthly: true,
        isActive: true,
      });
      const applicableEvents = monthlyEvents.filter(
        (e) => !e.excludedMonths?.includes(targetMonthNumber),
      );

      // 4. Joueurs ciblés (inscrits avant le début du mois cible)
      const players =
        applicableEvents.length > 0
          ? await this.userService.findUsers({
              role: 'player',
              registrationStatus: 'inscrit',
              createdTo: targetMonth,
            })
          : [];

      // 5. Boucle de génération
      let created = 0;
      let skipped = 0;
      let failed = 0;
      const issues: Array<{
        executionId: number;
        playerId: number;
        eventId: number;
        type: 'skipped' | 'failed';
        reason?: string;
      }> = [];

      for (const player of players) {
        for (const event of applicableEvents) {
          const description = `${event.name} - ${format(targetMonth, 'MMMM yyyy', { locale: fr })}`;

          try {
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

            if (result.created) {
              created++;
            } else {
              skipped++;
              issues.push({
                executionId: execution.id,
                playerId: player.id,
                eventId: event.id,
                type: 'skipped',
                reason: 'already_exists',
              });
            }
          } catch (err: any) {
            failed++;
            issues.push({
              executionId: execution.id,
              playerId: player.id,
              eventId: event.id,
              type: 'failed',
              reason: err?.cause?.message ?? err?.message ?? 'unknown_error',
            });
          }
        }
      }

      // 6. Persister les issues + compteurs
      await this.jobRepo.createIssues(issues);
      await this.jobRepo.updateCounters(execution.id, {
        eventsCount: applicableEvents.length,
        playersCount: players.length,
        createdCount: created,
        skippedCount: skipped,
        failedCount: failed,
      });

      // 7. Statut global
      const status = this.computeGlobalStatus(created, failed);
      await this.jobRepo.complete(execution.id, status);

      this.logger.log(
        `✅ ${periodKey} — ${created} créées, ${skipped} sautées, ${failed} échouées`,
      );
      return { created, skipped, failed };
    } catch (error: any) {
      await this.jobRepo.complete(execution.id, 'failed', error.message);
      this.logger.error(`❌ Échec génération ${periodKey}`, error);
      throw error;
    }
  }

  // ============================================================
  // RÉGÉNÉRATION CIBLÉE (issues failed uniquement)
  // ============================================================

  async retryFailedIssues(
    issueIds: number[],
    adminId: number,
  ): Promise<{ resolved: number; stillFailed: number; errors: string[] }> {
    if (!Array.isArray(issueIds) || issueIds.length === 0) {
      throw new NotFoundException('Aucune issue fournie');
    }

    // 1. Charger les issues failed non résolues
    const issues = await this.jobRepo.findUnresolvedFailedByIds(issueIds);
    if (issues.length === 0) {
      throw new NotFoundException(
        'Aucune issue échouée non résolue trouvée pour ces IDs',
      );
    }

    const resolvedIds: number[] = [];
    const errors: string[] = [];
    const touchedExecutionIds = new Set<number>();

    // 2. Grouper par exécution pour traiter efficacement
    const executionCache = new Map<number, { targetMonth: string; dueDate: Date }>();

    for (const issue of issues) {
      // 2a. Charger l'exécution (avec cache)
      if (!executionCache.has(issue.executionId)) {
        const execution = await this.jobRepo.findById(issue.executionId);
        if (!execution) {
          errors.push(`Exécution ${issue.executionId} introuvable`);
          continue;
        }
        const targetMonth = new Date(execution.targetMonth + '-01');
        const dueDate = new Date(
          targetMonth.getFullYear(),
          targetMonth.getMonth() + 1,
          5,
        );
        executionCache.set(issue.executionId, {
          targetMonth: execution.targetMonth,
          dueDate,
        });
      }

      const { targetMonth: periodKey, dueDate } = executionCache.get(issue.executionId)!;

      // 2b. Charger l'événement (pour amount + name)
      const event = await this.eventRepo.findById(issue.eventId);
      if (!event) {
        errors.push(`Événement ${issue.eventId} introuvable`);
        continue;
      }

      // 2c. Retenter la création
      const description = `${event.name} - ${format(new Date(periodKey + '-01'), 'MMMM yyyy', { locale: fr })}`;

      try {
        const result = await this.obligationRepo.createIfNotExists({
          eventId: issue.eventId,
          playerId: issue.playerId,
          totalAmount: event.amount,
          paidAmount: 0,
          remainingAmount: event.amount,
          dueDate,
          description,
          periodKey,
          status: 'pending',
        });

        if (result.created) {
          resolvedIds.push(issue.id);
          touchedExecutionIds.add(issue.executionId);
        } else {
          // L'obligation existe déjà → on considère l'issue résolue aussi
          resolvedIds.push(issue.id);
          touchedExecutionIds.add(issue.executionId);
        }
      } catch (err: any) {
        errors.push(
          `Joueur ${issue.playerId} / Événement ${issue.eventId} : ${err?.cause?.message ?? err?.message ?? 'unknown'}`,
        );
      }
    }

    // 3. Marquer les issues résolues
    if (resolvedIds.length > 0) {
      await this.jobRepo.resolveIssues(resolvedIds, adminId);
    }

    // 4. Recalculer les compteurs + statut pour chaque exécution touchée
    for (const executionId of touchedExecutionIds) {
      await this.refreshExecutionCounters(executionId);
    }

    this.logger.log(
      `🔄 Retry admin ${adminId} : ${resolvedIds.length} résolues, ${errors.length} erreurs`,
    );

    return {
      resolved: resolvedIds.length,
      stillFailed: issues.length - resolvedIds.length,
      errors,
    };
  }

  // ============================================================
  // RECALCUL DES COMPTEURS APRÈS RETRY
  // ============================================================

  /**
   * Recalcule les compteurs d'une exécution à partir de l'état réel des issues.
   * Le nombre d'issues `failed` non résolues devient le nouveau `failedCount`.
   */
  private async refreshExecutionCounters(executionId: number): Promise<void> {
    const execution = await this.jobRepo.findById(executionId);
    if (!execution) return;

    const unresolvedFailed = await this.jobRepo.countUnresolvedFailed(executionId);
    const newlyResolved = execution.failedCount - unresolvedFailed;

    const updatedCounters = {
      eventsCount: execution.eventsCount,
      playersCount: execution.playersCount,
      createdCount: execution.createdCount + Math.max(newlyResolved, 0),
      skippedCount: execution.skippedCount,
      failedCount: unresolvedFailed,
    };

    await this.jobRepo.updateCounters(executionId, updatedCounters);

    // Recalculer le statut global
    const status = this.computeGlobalStatus(
      updatedCounters.createdCount,
      updatedCounters.failedCount,
    );
    await this.jobRepo.complete(executionId, status);
  }

  // ============================================================
  // LECTURE (pour les contrôleurs)
  // ============================================================

  async getCurrentStatus(executionDate: Date = new Date()) {
    const periodKey = this.getTargetMonthKey(executionDate);
    return this.jobRepo.findByTargetMonth(periodKey);
  }

  async getHistory(limit = 10) {
    return this.jobRepo.findHistory(limit);
  }

  async getIssues(executionId: number, type?: 'skipped' | 'failed') {
    return this.jobRepo.findIssuesByExecution(executionId, type);
  }

  async countUnresolvedFailed(executionId: number): Promise<number> {
  return this.jobRepo.countUnresolvedFailed(executionId);
}
}