// src/modules/admin/admin.controller.ts
import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { parse } from 'date-fns';
import { MonthlyPaymentService } from '../payment/monthly-payment.service';
import { ServiceTokenGuard } from '../common/guards/service-token.guard';

@Controller('admin')
@UseGuards(RolesGuard)
@AdminOnly()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly monthlyPaymentService: MonthlyPaymentService) {}

  @Get('dashboard/stats')
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.adminService.getDashboardStats();
  }

  /**
   * Endpoint de rattrapage manuel.
   * Body: { month: "2026-10" } — le mois à générer (M-1 si on est en novembre).
   * Si absent, utilise la date du jour (génère M-1).
   */
  @Post('jobs/monthly-payments')
  @UseGuards(ServiceTokenGuard)
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  async generateMonthlyPayments(@Body('month') month?: string) {
    let executionDate: Date;

    if (month) {
      // Parse "2026-10" → 1er octobre 2026
      executionDate = parse(month, 'yyyy-MM', new Date());
      // On veut le mois SUIVANT (le job génère M-1 à partir de M)
      executionDate.setMonth(executionDate.getMonth() + 1);
    } else {
      executionDate = new Date();
    }

    if (isNaN(executionDate.getTime())) {
      throw new BadRequestException('Format de mois invalide (attendu: YYYY-MM)');
    }

    return this.monthlyPaymentService.generateForPreviousMonth(executionDate);
  }
}