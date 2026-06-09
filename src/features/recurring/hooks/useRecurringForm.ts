import { db } from '@/db';
import { recurringTransactions, accounts, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { logger } from '@/utils/logger';
import { Haptics } from '@/utils/haptics';
import { CustomAlert } from '@/components/feedback/CustomAlert';
import { computeNextRunDate, formatLocalDate } from '@/utils/recurrence';
import type { RecurrenceFrequency, RecurringFormData, TransactionType } from '../types';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

/**
 * Hook encapsulating the add/edit recurring transaction form logic.
 */
export function useRecurringForm(editId?: string) {
  const [accountsList, setAccountsList] = useState<Account[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);

  const [formData, setFormData] = useState<RecurringFormData>({
    type: 'expense',
    amount: '',
    accountId: '',
    toAccountId: '',
    categoryId: '',
    description: '',
    merchant: '',
    frequency: 'monthly',
    interval: '1',
    startDate: formatLocalDate(new Date()),
    endDate: '',
    hasEndDate: false,
    hasMaxOccurrences: false,
    maxOccurrences: '',
  });

  const updateField = useCallback(<K extends keyof RecurringFormData>(
    field: K,
    value: RecurringFormData[K],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const accountOptions = useMemo(() => {
    return accountsList.map(a => ({
      key: a.id,
      label: a.name,
      icon: a.type === 'credit_card' ? 'card-outline' : 'wallet-outline',
    }));
  }, [accountsList]);

  const categoryOptions = useMemo(() => {
    return categoriesList.map(c => ({
      key: c.id,
      label: c.name,
      icon: c.icon || 'tag-outline',
      color: c.color || undefined,
    }));
  }, [categoriesList]);

  // Load accounts, categories, and existing data if editing
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const accs = await db.select().from(accounts).where(eq(accounts.isArchived, false));
        setAccountsList(accs as Account[]);

        const cats = await db.select().from(categories);
        setCategoriesList(cats as Category[]);

        if (editId) {
          const [existing] = await db
            .select()
            .from(recurringTransactions)
            .where(eq(recurringTransactions.id, editId));

          if (existing) {
            setFormData({
              type: existing.type as TransactionType,
              amount: existing.amount.toString(),
              accountId: existing.accountId,
              toAccountId: existing.toAccountId ?? '',
              categoryId: existing.categoryId ?? '',
              description: existing.description ?? '',
              merchant: existing.merchant ?? '',
              frequency: existing.frequency as RecurrenceFrequency,
              interval: existing.interval.toString(),
              startDate: existing.startDate,
              endDate: existing.endDate ?? '',
              hasEndDate: !!existing.endDate,
              hasMaxOccurrences: existing.maxOccurrences !== null && existing.maxOccurrences > 0,
              maxOccurrences: existing.maxOccurrences?.toString() ?? '',
            });
          }
        } else {
          // Set defaults for new form
          if (accs.length > 0) {
            setFormData(prev => ({ ...prev, accountId: accs[0].id }));
          }
          if (accs.length > 1) {
            setFormData(prev => ({ ...prev, toAccountId: accs[1].id }));
          }
          if (cats.length > 0) {
            setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
          }
        }
      } catch (e) {
        logger.error('Error loading recurring form data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadFormData();
  }, [editId]);

  const validate = useCallback((): boolean => {
    const amt = parseFloat(formData.amount);
    if (!amt || isNaN(amt) || amt <= 0) {
      Haptics.notification('error');
      CustomAlert.alert('Validation Error', 'Please enter a valid amount.');
      return false;
    }
    if (!formData.accountId) {
      Haptics.notification('error');
      CustomAlert.alert('Validation Error', 'Please select a source account.');
      return false;
    }
    if (formData.type === 'transfer' && !formData.toAccountId) {
      Haptics.notification('error');
      CustomAlert.alert('Validation Error', 'Please select a destination account for transfer.');
      return false;
    }
    if (formData.type === 'transfer' && formData.accountId === formData.toAccountId) {
      Haptics.notification('error');
      CustomAlert.alert('Validation Error', 'Source and destination accounts must be different.');
      return false;
    }
    const interval = parseInt(formData.interval, 10);
    if (!interval || isNaN(interval) || interval < 1) {
      Haptics.notification('error');
      CustomAlert.alert('Validation Error', 'Interval must be at least 1.');
      return false;
    }
    if (!formData.startDate) {
      Haptics.notification('error');
      CustomAlert.alert('Validation Error', 'Please select a start date.');
      return false;
    }
    if (formData.hasMaxOccurrences) {
      const maxOcc = parseInt(formData.maxOccurrences, 10);
      if (!maxOcc || isNaN(maxOcc) || maxOcc < 1) {
        Haptics.notification('error');
        CustomAlert.alert('Validation Error', 'Max occurrences must be at least 1.');
        return false;
      }
    }
    return true;
  }, [formData]);

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    if (!validate()) return false;

    setIsSubmitting(true);
    try {
      const amt = parseFloat(formData.amount);
      const interval = parseInt(formData.interval, 10);
      const maxOccurrences = formData.hasMaxOccurrences
        ? parseInt(formData.maxOccurrences, 10)
        : null;

      if (editId) {
        // UPDATE
        await db
          .update(recurringTransactions)
          .set({
            type: formData.type,
            amount: amt,
            accountId: formData.accountId,
            toAccountId: formData.type === 'transfer' ? formData.toAccountId : null,
            categoryId: formData.categoryId || null,
            description: formData.description || null,
            merchant: formData.merchant || null,
            frequency: formData.frequency,
            interval,
            startDate: formData.startDate,
            endDate: formData.hasEndDate ? formData.endDate : null,
            maxOccurrences,
            nextRunDate: formData.startDate, // Reset to start date so it re-evaluates
            updatedAt: new Date().toISOString(),
          })
          .where(eq(recurringTransactions.id, editId));
      } else {
        // INSERT
        await db.insert(recurringTransactions).values({
          type: formData.type,
          amount: amt,
          accountId: formData.accountId,
          toAccountId: formData.type === 'transfer' ? formData.toAccountId : null,
          categoryId: formData.categoryId || null,
          description: formData.description || null,
          merchant: formData.merchant || null,
          frequency: formData.frequency,
          interval,
          startDate: formData.startDate,
          endDate: formData.hasEndDate ? formData.endDate : null,
          maxOccurrences,
          completedOccurrences: 0,
          nextRunDate: formData.startDate,
        });
      }

      Haptics.notification('success');
      return true;
    } catch (e) {
      Haptics.notification('error');
      logger.error('Error saving recurring transaction:', e);
      CustomAlert.alert('Error', 'Failed to save recurring transaction.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editId, validate]);

  return {
    formData,
    updateField,
    accountsList,
    categoriesList,
    accountOptions,
    categoryOptions,
    isSubmitting,
    isLoading,
    handleSubmit,
  };
}
