// src/modules/admin/dto/dashboard-stats.dto.ts
export class DashboardStatsDto {
  // Utilisateurs
  totalUsers: number;
  totalAdmins: number;
  totalPlayers: number;
  totalParents: number;
  pendingRegistrations: number;

  // Documents
  pendingDocuments: number;

  // Paiements
  totalObligations: number;
  totalAmountPaid: number;
  totalAmountRemaining: number;
  paidCount: number;
  pendingPaymentsCount: number;
  overdueCount: number;
}