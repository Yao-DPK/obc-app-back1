// packages/database/src/schema/monthly-job-executions.ts
import {
  pgTable, serial, varchar, integer, timestamp, text,
  uniqueIndex, index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { paymentEvents } from './payments';

export const monthlyJobExecutions = pgTable('monthly_job_executions', {
  id: serial('id').primaryKey(),
  targetMonth: varchar('target_month', { length: 7 }).notNull(), // "2026-10"
  status: varchar('status', { length: 20 }).notNull().default('running'),

  // Compteurs agrégés
  eventsCount: integer('events_count').default(0).notNull(),
  playersCount: integer('players_count').default(0).notNull(),
  createdCount: integer('created_count').default(0).notNull(),
  skippedCount: integer('skipped_count').default(0).notNull(),
  failedCount: integer('failed_count').default(0).notNull(),

  executedBy: integer('executed_by').references(() => users.id),
  executedAt: timestamp('executed_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  error: text('error'),
}, (t) => ({
  targetMonthUnique: uniqueIndex('monthly_job_target_unique').on(t.targetMonth),
  statusIdx: index('monthly_job_status_idx').on(t.status),
}));

export type MonthlyJobExecutionInsert = typeof monthlyJobExecutions.$inferInsert;
export type MonthlyJobExecutionSelect = typeof monthlyJobExecutions.$inferSelect;

export const monthlyJobIssues = pgTable('monthly_job_issues', {
  id: serial('id').primaryKey(),
  executionId: integer('execution_id')
    .references(() => monthlyJobExecutions.id, { onDelete: 'cascade' })
    .notNull(),
  playerId: integer('player_id').references(() => users.id).notNull(),
  eventId: integer('event_id').references(() => paymentEvents.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'skipped' | 'failed'
  reason: text('reason'),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: integer('resolved_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  executionIdx: index('monthly_issue_exec_idx').on(t.executionId),
  typeIdx: index('monthly_issue_type_idx').on(t.type),
  playerIdx: index('monthly_issue_player_idx').on(t.playerId),
}));

export type MonthlyJobIssueInsert = typeof monthlyJobIssues.$inferInsert;
export type MonthlyJobIssueSelect = typeof monthlyJobIssues.$inferSelect;