export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  description: string | null;
  merchant: string | null;
  frequency: RecurrenceFrequency;
  interval: number;
  startDate: string;
  endDate: string | null;
  maxOccurrences: number | null;
  completedOccurrences: number;
  nextRunDate: string;
  lastRunDate: string | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface RecurringTransactionWithDetails extends RecurringTransaction {
  accountName: string | null;
  toAccountName: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
}

export interface RecurringFormData {
  type: TransactionType;
  amount: string;
  accountId: string;
  toAccountId: string;
  categoryId: string;
  description: string;
  merchant: string;
  frequency: RecurrenceFrequency;
  interval: string;
  startDate: string;
  endDate: string;
  hasEndDate: boolean;
  hasMaxOccurrences: boolean;
  maxOccurrences: string;
}

export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: 'Day',
  weekly: 'Week',
  monthly: 'Month',
  yearly: 'Year',
};

export const FREQUENCY_LABELS_PLURAL: Record<RecurrenceFrequency, string> = {
  daily: 'Days',
  weekly: 'Weeks',
  monthly: 'Months',
  yearly: 'Years',
};

/**
 * Formats a recurrence rule into a human-readable string.
 * e.g. "Every 2 weeks", "Every month", "Every 10 days"
 */
export function formatRecurrenceLabel(frequency: RecurrenceFrequency, interval: number): string {
  if (interval === 1) {
    return `Every ${FREQUENCY_LABELS[frequency].toLowerCase()}`;
  }
  return `Every ${interval} ${FREQUENCY_LABELS_PLURAL[frequency].toLowerCase()}`;
}
