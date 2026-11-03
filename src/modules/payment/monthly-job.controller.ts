// apps/api/src/modules/payment/monthly-job.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { MonthlyPaymentService } from './monthly-payment.service';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { ServiceTokenGuard } from '../common/guards/service-token.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('admin/jobs/monthly')
@UseGuards(RolesGuard)
export class MonthlyJobController {
  constructor(private readonly monthlyService: MonthlyPaymentService) {}

  // ============================================================
  // LECTURE
  // ============================================================

  /**
   * Statut du mois cible courant (M-1).
   * Retourne null si aucune exécution n'a été lancée pour ce mois.
   */
  @Get('status')
  @AdminOnly()
  async getStatus() {
    return this.monthlyService.getCurrentStatus();
  }

  /**
   * Historique des N dernières exécutions.
   */
  @Get('history')
  @AdminOnly()
  async getHistory(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      throw new BadRequestException('limit doit être un entier entre 1 et 100');
    }
    return this.monthlyService.getHistory(parsedLimit);
  }

  /**
   * Liste des issues (skipped / failed) d'une exécution.
   * Si `type` n'est pas fourni, retourne tous les types.
   */
  @Get('issues/:executionId')
  @AdminOnly()
  async getIssues(
    @Param('executionId', ParseIntPipe) executionId: number,
    @Query('type') type?: 'skipped' | 'failed',
  ) {
    if (type && !['skipped', 'failed'].includes(type)) {
      throw new BadRequestException("type doit être 'skipped' ou 'failed'");
    }
    return this.monthlyService.getIssues(executionId, type);
  }

  // ============================================================
  // EXÉCUTION (automatique via GitHub Actions)
  // ============================================================

  /**
   * Déclenche la génération mensuelle.
   * Protégé par ServiceTokenGuard (header `x-service-token`).
   * Appelé par le workflow GitHub Actions le 2 du mois à 02h02 UTC.
   */
  @Post('run')
  @UseGuards(ServiceTokenGuard)
  @HttpCode(HttpStatus.OK)
  async run() {
    return this.monthlyService.generateForPreviousMonth(new Date());
  }

  // ============================================================
  // EXÉCUTION MANUELLE (admin, rattrapage)
  // ============================================================

  /**
   * Déclenche manuellement la génération mensuelle.
   * Si le job a déjà réussi pour ce mois → 409 Conflict.
   * Si le job a échoué → autorisé (reprise complète).
   */
  @Post('run-manual')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  async runManual(@GetUser() admin: any) {
    console.log("running manual");
    return this.monthlyService.generateForPreviousMonth(new Date(), admin.id);
  }

  // ============================================================
  // RÉGÉNÉRATION CIBLÉE (admin, issues failed)
  // ============================================================

  /**
   * Régénère une ou plusieurs issues `failed` non résolues.
   * Body : { issueIds: number[] } — 1 ou N IDs.
   */
  @Post('issues/retry')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  async retryIssues(
    @Body() body: { issueIds: number[] },
    @GetUser() admin: any,
  ) {
    if (!Array.isArray(body.issueIds) || body.issueIds.length === 0) {
      throw new BadRequestException('issueIds requis (tableau non vide)');
    }
    if (body.issueIds.length > 100) {
      throw new BadRequestException('Maximum 100 issues par requête');
    }
    if (!body.issueIds.every((id) => Number.isInteger(id) && id > 0)) {
      throw new BadRequestException('issueIds doit contenir des entiers positifs');
    }
    return this.monthlyService.retryFailedIssues(body.issueIds, admin.id);
  }

  /**
 * Vérification machine-to-machine du statut du mois cible (M-1).
 * Utilisé par le workflow GitHub Actions "status check" le 3 ou 4 du mois.
 */
@Get('status-check')
@UseGuards(ServiceTokenGuard)
async getStatusCheck() {
  const status = await this.monthlyService.getCurrentStatus();

  // Récupérer les issues failed non résolues si une exécution existe
  let unresolvedFailed = 0;
  if (status) {
    unresolvedFailed = await this.monthlyService.countUnresolvedFailed(status.id);
  }

  return {
    targetMonth: this.monthlyService.getTargetMonthKey(),
    execution: status
      ? {
          id: status.id,
          status: status.status,
          executedAt: status.executedAt,
          completedAt: status.completedAt,
          createdCount: status.createdCount,
          skippedCount: status.skippedCount,
          failedCount: status.failedCount,
        }
      : null,
    unresolvedFailed,
    ok: status?.status === 'success' && unresolvedFailed === 0,
  };
}
}