// apps/api/src/modules/payment/monthly-job.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, desc, sql } from 'drizzle-orm';
import type { Database } from '@/database/db';
import {
  monthlyJobExecutions,
  monthlyJobIssues,
  type MonthlyJobExecutionSelect,
  type MonthlyJobIssueSelect,
} from '@/database/schema';
import { DATABASE } from '@/database/providers/database.providers';

@Injectable()
export class MonthlyJobRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  // ============================================================
  // EXÉCUTIONS
  // ============================================================

  async findById(id: number): Promise<MonthlyJobExecutionSelect | null> {
    const [row] = await this.db
      .select()
      .from(monthlyJobExecutions)
      .where(eq(monthlyJobExecutions.id, id))
      .limit(1);
    return row || null;
  }

  async findByTargetMonth(targetMonth: string): Promise<MonthlyJobExecutionSelect | null> {
    const [row] = await this.db
      .select()
      .from(monthlyJobExecutions)
      .where(eq(monthlyJobExecutions.targetMonth, targetMonth))
      .limit(1);
    return row || null;
  }

  async createRunning(targetMonth: string, executedBy?: number): Promise<MonthlyJobExecutionSelect> {
    const [row] = await this.db
      .insert(monthlyJobExecutions)
      .values({ targetMonth, status: 'running', executedBy })
      .returning();
    return row;
  }

  async updateCounters(
    id: number,
    counters: {
      eventsCount: number;
      playersCount: number;
      createdCount: number;
      skippedCount: number;
      failedCount: number;
    },
  ): Promise<void> {
    await this.db
      .update(monthlyJobExecutions)
      .set(counters)
      .where(eq(monthlyJobExecutions.id, id));
  }

  async complete(
    id: number,
    status: 'success' | 'failed',
    error?: string,
  ): Promise<MonthlyJobExecutionSelect> {
    const [row] = await this.db
      .update(monthlyJobExecutions)
      .set({ status, completedAt: new Date(), error: error ?? null })
      .where(eq(monthlyJobExecutions.id, id))
      .returning();
    return row;
  }

  async findHistory(limit = 10): Promise<MonthlyJobExecutionSelect[]> {
    return this.db
      .select()
      .from(monthlyJobExecutions)
      .orderBy(desc(monthlyJobExecutions.executedAt))
      .limit(limit);
  }

  // ============================================================
  // ISSUES
  // ============================================================

  async createIssues(
    issues: Array<{
      executionId: number;
      playerId: number;
      eventId: number;
      type: 'skipped' | 'failed';
      reason?: string;
    }>,
  ): Promise<void> {
    if (issues.length === 0) return;
    await this.db.insert(monthlyJobIssues).values(issues);
  }

  async findIssuesByExecution(
    executionId: number,
    type?: 'skipped' | 'failed',
  ): Promise<MonthlyJobIssueSelect[]> {
    const conditions = [eq(monthlyJobIssues.executionId, executionId)];
    if (type) conditions.push(eq(monthlyJobIssues.type, type));

    return this.db
      .select()
      .from(monthlyJobIssues)
      .where(and(...conditions))
      .orderBy(desc(monthlyJobIssues.createdAt));
  }

  async findUnresolvedFailedByIds(issueIds: number[]): Promise<MonthlyJobIssueSelect[]> {
    if (issueIds.length === 0) return [];
    return this.db
      .select()
      .from(monthlyJobIssues)
      .where(
        and(
          sql`${monthlyJobIssues.id} = ANY(${issueIds})`,
          eq(monthlyJobIssues.type, 'failed'),
          isNull(monthlyJobIssues.resolvedAt),
        ),
      );
  }

  async resolveIssues(issueIds: number[], resolvedBy: number): Promise<void> {
    if (issueIds.length === 0) return;
    await this.db
      .update(monthlyJobIssues)
      .set({ resolvedAt: new Date(), resolvedBy })
      .where(sql`${monthlyJobIssues.id} = ANY(${issueIds})`);
  }

  async countUnresolvedFailed(executionId: number): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(monthlyJobIssues)
      .where(
        and(
          eq(monthlyJobIssues.executionId, executionId),
          eq(monthlyJobIssues.type, 'failed'),
          isNull(monthlyJobIssues.resolvedAt),
        ),
      );
    return Number(row?.count ?? 0);
  }
}