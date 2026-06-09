import { type RecurrenceFrequency } from '@/features/recurring/types';

/**
 * Formats a date as YYYY-MM-DD local string.
 */
export function formatLocalDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date object (midnight local).
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Computes the next run date from a given date, frequency, and interval.
 *
 * @param currentDate - The date to advance from (YYYY-MM-DD)
 * @param frequency  - daily | weekly | monthly | yearly
 * @param interval   - How many units to advance (e.g. 2 = every 2 weeks)
 * @returns The next run date as YYYY-MM-DD
 */
export function computeNextRunDate(
  currentDate: string,
  frequency: RecurrenceFrequency,
  interval: number,
): string {
  const date = parseLocalDate(currentDate);

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + interval);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7 * interval);
      break;
    case 'monthly': {
      // Preserve day-of-month; clamp to last day of target month
      const targetDay = date.getDate();
      date.setMonth(date.getMonth() + interval);
      // If the day overflowed (e.g. Jan 31 → Mar 3), set to last day of the intended month
      if (date.getDate() !== targetDay) {
        date.setDate(0); // Go to last day of previous month
      }
      break;
    }
    case 'yearly': {
      const targetDay = date.getDate();
      date.setFullYear(date.getFullYear() + interval);
      if (date.getDate() !== targetDay) {
        date.setDate(0);
      }
      break;
    }
  }

  return formatLocalDate(date);
}

/**
 * Generates all due dates between `fromDate` (inclusive) and `untilDate` (inclusive)
 * by stepping forward from `fromDate` using the frequency + interval.
 *
 * Used by the recurring engine to backfill missed transactions.
 */
export function generateDueDates(
  fromDate: string,
  untilDate: string,
  frequency: RecurrenceFrequency,
  interval: number,
): string[] {
  const dates: string[] = [];
  let current = fromDate;

  while (current <= untilDate) {
    dates.push(current);
    current = computeNextRunDate(current, frequency, interval);
  }

  return dates;
}
