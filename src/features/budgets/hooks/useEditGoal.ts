import { useState } from 'react';
import { db } from '@/db';
import { goals } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Goal } from './useBudgetsData';
import { logger } from '@/utils/logger';

interface UseEditGoalProps {
  goal: Goal | null;
  onSuccess: () => void;
}

export function useEditGoal({ goal, onSuccess }: UseEditGoalProps) {
  const [name, setName] = useState(goal?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() ?? '');
  const [currentAmount, setCurrentAmount] = useState(goal?.currentAmount?.toString() ?? '');
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');

  const handleUpdateGoal = async () => {
    if (!goal || !name) return;
    try {
      const target = parseFloat(targetAmount);
      const current = parseFloat(currentAmount) || 0;
      if (isNaN(target) || target <= 0) return;

      const isCompleted = current >= target;

      await db
        .update(goals)
        .set({
          name,
          targetAmount: target,
          currentAmount: current,
          deadline: deadline || null,
          isCompleted,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(goals.id, goal.id));

      onSuccess();
    } catch (e) {
      logger.error('Error updating goal:', e);
    }
  };

  const handleToggleCompleted = async (completed: boolean) => {
    if (!goal) return;
    try {
      await db
        .update(goals)
        .set({
          isCompleted: completed,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(goals.id, goal.id));

      onSuccess();
    } catch (e) {
      logger.error('Error updating goal completion:', e);
    }
  };

  const handleDeleteGoal = async () => {
    if (!goal) return;
    try {
      await db.delete(goals).where(eq(goals.id, goal.id));
      onSuccess();
    } catch (e) {
      logger.error('Error deleting goal:', e);
    }
  };

  return {
    name,
    setName,
    targetAmount,
    setTargetAmount,
    currentAmount,
    setCurrentAmount,
    deadline,
    setDeadline,
    handleUpdateGoal,
    handleToggleCompleted,
    handleDeleteGoal,
  };
}
