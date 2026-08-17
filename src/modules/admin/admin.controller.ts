// src/modules/admin/admin.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Controller('admin')
@UseGuards(RolesGuard)
@AdminOnly()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.adminService.getDashboardStats();
  }
}