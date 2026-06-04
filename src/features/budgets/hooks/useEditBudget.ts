import { useState } from 'react';
import { db } from '@/db';
import { budgets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/utils/logger';

interface UseEditBudgetProps {
  budget: any | null;
  onSuccess: () => void;
}

export function useEditBudget({ budget, onSuccess }: UseEditBudgetProps) {
  const [name, setName] = useState(budget?.name ?? '');
  const [amount, setAmount] = useState(budget?.amount?.toString() ?? '');
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? '');
  const [period, setPeriod] = useState<'monthly' | 'weekly'>(budget?.period === 'weekly' ? 'weekly' : 'monthly');

  const handleUpdateBudget = async () => {
    if (!budget || !name) return;
    try {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) return;

      await db
        .update(budgets)
        .set({
          name,
          amount: amt,
          categoryId: categoryId || null,
          period,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(budgets.id, budget.id));

      onSuccess();
    } catch (e) {
      logger.error('Error updating budget:', e);
    }
  };

  const handleDeleteBudget = async () => {
    if (!budget) return;
    try {
      await db.delete(budgets).where(eq(budgets.id, budget.id));
      onSuccess();
    } catch (e) {
      logger.error('Error deleting budget:', e);
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
    handleUpdateBudget,
    handleDeleteBudget,
  };
}
