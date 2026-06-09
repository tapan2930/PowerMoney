import { db } from '@/db';
import { recurringTransactions, accounts, categories } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { useCallback, useState } from 'react';
import { logger } from '@/utils/logger';
import type { RecurringTransactionWithDetails } from '../types';

/**
 * Hook to fetch and manage the list of recurring transactions.
 */
export function useRecurringTransactions() {
  const [items, setItems] = useState<RecurringTransactionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecurringTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await db
        .select({
          id: recurringTransactions.id,
          type: recurringTransactions.type,
          amount: recurringTransactions.amount,
          accountId: recurringTransactions.accountId,
          toAccountId: recurringTransactions.toAccountId,
          categoryId: recurringTransactions.categoryId,
          description: recurringTransactions.description,
          merchant: recurringTransactions.merchant,
          frequency: recurringTransactions.frequency,
          interval: recurringTransactions.interval,
          startDate: recurringTransactions.startDate,
          endDate: recurringTransactions.endDate,
          maxOccurrences: recurringTransactions.maxOccurrences,
          completedOccurrences: recurringTransactions.completedOccurrences,
          nextRunDate: recurringTransactions.nextRunDate,
          lastRunDate: recurringTransactions.lastRunDate,
          isActive: recurringTransactions.isActive,
          createdAt: recurringTransactions.createdAt,
          updatedAt: recurringTransactions.updatedAt,
          accountName: accounts.name,
          categoryName: categories.name,
          categoryIcon: categories.icon,
          categoryColor: categories.color,
        })
        .from(recurringTransactions)
        .leftJoin(accounts, eq(recurringTransactions.accountId, accounts.id))
        .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id));

      // Fetch toAccount names separately for transfers
      const withDetails: RecurringTransactionWithDetails[] = [];
      for (const row of results) {
        let toAccountName: string | null = null;
        if (row.toAccountId) {
          const [toAcc] = await db
            .select({ name: accounts.name })
            .from(accounts)
            .where(eq(accounts.id, row.toAccountId));
          toAccountName = toAcc?.name ?? null;
        }
        withDetails.push({
          ...row,
          toAccountName,
        } as RecurringTransactionWithDetails);
      }

      setItems(withDetails);
    } catch (e) {
      logger.error('Error loading recurring transactions:', e);
      setError('Failed to load recurring transactions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    try {
      await db
        .update(recurringTransactions)
        .set({ isActive: !isActive, updatedAt: new Date().toISOString() })
        .where(eq(recurringTransactions.id, id));
      await loadRecurringTransactions();
    } catch (e) {
      logger.error('Error toggling recurring transaction:', e);
    }
  }, [loadRecurringTransactions]);

  const deleteRecurring = useCallback(async (id: string) => {
    try {
      await db
        .delete(recurringTransactions)
        .where(eq(recurringTransactions.id, id));
      await loadRecurringTransactions();
    } catch (e) {
      logger.error('Error deleting recurring transaction:', e);
    }
  }, [loadRecurringTransactions]);

  return {
    items,
    isLoading,
    error,
    loadRecurringTransactions,
    toggleActive,
    deleteRecurring,
  };
}
