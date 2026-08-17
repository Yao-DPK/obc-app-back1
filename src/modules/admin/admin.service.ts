// src/modules/admin/admin.service.ts
import { Injectable } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { PaymentObligationRepository } from '../payment/payment-obligation.repository';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { DocumentRepository } from '../document/document.repository';

@Injectable()
export class AdminService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly obligationRepo: PaymentObligationRepository,
    private readonly documentRepo: DocumentRepository,
  ) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    // 1. Statistiques utilisateurs
    const [
      totalUsers,
      totalAdmins,
      totalSuperAdmins,
      totalPlayers,
      totalParents,
      pendingRegistrations,
    ] = await Promise.all([
      this.userRepo.countTotalUsers(),
      this.userRepo.countByRole('admin'),
      this.userRepo.countByRole('super_admin'),
      this.userRepo.countByRole('player'),
      this.userRepo.countByRole('parent'),
      this.userRepo.countPendingRegistrations(),
    ]);

    // 2. Statistiques paiements
    const paymentStats = await this.obligationRepo.getDashboardStats();

    // 3. Statistiques documents
    const pendingDocuments = await this.documentRepo.countPendingDocuments();

    return {
      totalUsers,
      totalAdmins: totalAdmins + totalSuperAdmins,
      totalPlayers,
      totalParents,
      pendingRegistrations,
      pendingDocuments: pendingDocuments,
      totalAmountPaid: paymentStats.totalPaid,
      totalAmountRemaining: paymentStats.totalRemaining,
      paidCount: paymentStats.paidCount,
      totalObligations: paymentStats.totalObligations,
      overdueCount: paymentStats.overdueCount,
      pendingPaymentsCount: paymentStats.pendingCount,
    };
  }
}