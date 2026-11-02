// packages/shared/src/utils/period-key.ts
import { format } from 'date-fns';

export function buildMonthlyPeriodKey(targetMonth: Date): string {
  return format(targetMonth, 'yyyy-MM'); // "2026-10"
}

export function buildSeasonPeriodKey(startDate: Date): string {
  const year = startDate.getFullYear();
  return `saison-${year}-${year + 1}`; // "saison-2026-2027"
}

export function buildEventPeriodKey(eventId: number, startDate: Date): string {
  return `event-${eventId}-${startDate.getFullYear()}`; // "event-42-2026"

}