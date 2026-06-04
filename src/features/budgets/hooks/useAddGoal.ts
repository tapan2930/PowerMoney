import { useState } from 'react';
import { db } from '@/db';
import { goals } from '@/db/schema';
import { logger } from '@/utils/logger';

interface UseAddGoalProps {
  onSuccess: () => void;
}

export function useAddGoal({ onSuccess }: UseAddGoalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleAddGoal = async () => {
    try {
      const target = parseFloat(targetAmount);
      const current = parseFloat(currentAmount) || 0;
      if (!name || isNaN(target) || target <= 0) return;

      await db.insert(goals).values({
        name,
        targetAmount: target,
        currentAmount: current,
        deadline: deadline || null,
        isCompleted: false,
      });

      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setDeadline('');
      onSuccess();
    } catch (e) {
      logger.error('Error creating goal:', e);
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
    handleAddGoal,
  };
}
