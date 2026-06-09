import { db } from '@/db';
import { recurringTransactions, transactions, accounts } from '@/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { useCallback } from 'react';
import { logger } from '@/utils/logger';
import { generateDueDates, computeNextRunDate, formatLocalDate } from '@/utils/recurrence';
import type { RecurrenceFrequency } from '../types';

/**
 * Hook that provides the recurring transaction execution engine.
 *
 * On each call to `processRecurringTransactions()`, it:
 * 1. Queries all active recurring rules where nextRunDate <= today
 * 2. For each, generates all missed transactions (backfill) up to today
 * 3. Inserts real transactions, adjusts account balances
 * 4. Advances nextRunDate and completedOccurrences
 * 5. Auto-deactivates if endDate passed or maxOccurrences reached
 *
 * Also handles the case where a generated transaction was deleted —
 * the engine will detect missing transactions and re-generate them.
 */
export function useRecurringEngine() {
  const processRecurringTransactions = useCallback(async (): Promise<number> => {
    const today = formatLocalDate(new Date());
    let totalGenerated = 0;

    try {
      // Get all active recurring rules
      // Note: We scan all active rules because we might need to backfill deleted ones
      // even if their nextRunDate is in the future.
      const activeRules = await db
        .select()
        .from(recurringTransactions)
        .where(eq(recurringTransactions.isActive, true));

      for (const rule of activeRules) {
        const frequency = rule.frequency as RecurrenceFrequency;
        const interval = rule.interval;

        // Determine the upper bound for generation
        let upperBound = today;
        if (rule.endDate && rule.endDate < today) {
          upperBound = rule.endDate;
        }

        // Generate all expected due dates from the start date to the upper bound
        const dueDates = generateDueDates(
          rule.startDate,
          upperBound,
          frequency,
          interval,
        );

        let newNextRunDate = rule.nextRunDate;
        let lastGeneratedDate = rule.lastRunDate;

        for (const dueDate of dueDates) {
          // Check if we've hit the max occurrences limit (count what's currently in DB)
          const currentCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(transactions)
            .where(eq(transactions.recurringTransactionId, rule.id));
          const completedCount = currentCount[0]?.count ?? 0;

          if (rule.maxOccurrences !== null && completedCount >= rule.maxOccurrences) {
            break;
          }

          // Check if a transaction was already generated for this exact date + rule
          const existing = await db
            .select({ id: transactions.id })
            .from(transactions)
            .where(
              and(
                eq(transactions.recurringTransactionId, rule.id),
                eq(transactions.date, dueDate),
              )
            );

          if (existing.length > 0) {
            // Already exists for this date, skip
            continue;
          }

          // Generate the transaction
          const signedAmt = rule.type === 'expense' ? -rule.amount : rule.amount;

          await db.insert(transactions).values({
            accountId: rule.accountId,
            toAccountId: rule.toAccountId,
            categoryId: rule.categoryId,
            type: rule.type,
            amount: rule.amount,
            description: rule.description ?? rule.merchant ?? 'Recurring Transaction',
            merchant: rule.merchant,
            date: dueDate,
            isRecurring: true,
            recurringTransactionId: rule.id,
          });

          // Update source/destination account balances
          if (rule.type === 'transfer') {
            // Transfer: debit source, credit destination
            await db
              .update(accounts)
              .set({ balance: sql`${accounts.balance} - ${rule.amount}` })
              .where(eq(accounts.id, rule.accountId));

            if (rule.toAccountId) {
              await db
                .update(accounts)
                .set({ balance: sql`${accounts.balance} + ${rule.amount}` })
                .where(eq(accounts.id, rule.toAccountId));
            }
          } else {
            await db
              .update(accounts)
              .set({ balance: sql`${accounts.balance} + ${signedAmt}` })
              .where(eq(accounts.id, rule.accountId));
          }

          if (!lastGeneratedDate || dueDate > lastGeneratedDate) {
            lastGeneratedDate = dueDate;
          }
          if (dueDate >= newNextRunDate) {
            newNextRunDate = computeNextRunDate(dueDate, frequency, interval);
          }
          totalGenerated++;
        }

        // Count final occurrences after insertions
        const finalCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(transactions)
          .where(eq(transactions.recurringTransactionId, rule.id));
        const finalCompletedOccurrences = finalCountResult[0]?.count ?? 0;

        // Check if the rule should be deactivated
        let shouldDeactivate = false;
        if (rule.endDate && newNextRunDate > rule.endDate) {
          shouldDeactivate = true;
        }
        if (rule.maxOccurrences !== null && finalCompletedOccurrences >= rule.maxOccurrences) {
          shouldDeactivate = true;
        }

        await db
          .update(recurringTransactions)
          .set({
            nextRunDate: newNextRunDate,
            lastRunDate: lastGeneratedDate,
            completedOccurrences: finalCompletedOccurrences,
            isActive: shouldDeactivate ? false : true,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(recurringTransactions.id, rule.id));
      }
    } catch (e) {
      logger.error('Error processing recurring transactions:', e);
    }

    return totalGenerated;
  }, []);

  return { processRecurringTransactions };
}
