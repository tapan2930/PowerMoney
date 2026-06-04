import { useState, useCallback } from 'react';
import { db } from '@/db';
import { goals, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getBudgetsWithSpent } from '@/db/queries/financials';
import { logger } from '@/utils/logger';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  isCompleted: boolean;
  icon?: string | null;
  color?: string | null;
}

export function useBudgetsData() {
  const [budgetsList, setBudgetsList] = useState<any[]>([]);
  const [goalsList, setGoalsList] = useState<Goal[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch budgets with spent amounts
      const budgetsWithSpent = await getBudgetsWithSpent();
      setBudgetsList(budgetsWithSpent);

      // 2. Fetch savings goals (both active and completed, or just incomplete - let's fetch active ones as before)
      const goalsResult = await db.select().from(goals).where(eq(goals.isCompleted, false));
      setGoalsList(goalsResult as Goal[]);

      // 3. Fetch categories for budget dropdown
      const catsResult = await db.select().from(categories);
      setCategoriesList(catsResult);
    } catch (e) {
      logger.error('Error loading budget/goal data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    budgetsList,
    goalsList,
    categoriesList,
    loading,
    loadData,
  };
}
