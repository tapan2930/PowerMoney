import { useState } from 'react';
import { db } from '@/db';
import { budgets } from '@/db/schema';
import { logger } from '@/utils/logger';

interface UseAddBudgetProps {
  categoriesList: any[];
  onSuccess: () => void;
}

export function useAddBudget({ categoriesList, onSuccess }: UseAddBudgetProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly');

  const handleAddBudget = async () => {
    try {
      const amt = parseFloat(amount);
      if (!name || isNaN(amt) || amt <= 0) return;

      const finalCategoryId = categoryId || null;

      await db.insert(budgets).values({
        name,
        amount: amt,
        categoryId: finalCategoryId,
        period,
        isActive: true,
      });

      setName('');
      setAmount('');
      setCategoryId('');
      setPeriod('monthly');
      onSuccess();
    } catch (e) {
      logger.error('Error creating budget:', e);
    }
  };

  return {
    name,
    setName,
    amount,
    setAmount,
    categoryId,
    setCategoryId,
    period,
    setPeriod,
    handleAddBudget,
  };
}
