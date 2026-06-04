import { useState } from 'react';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { useAppStore } from '@/stores/useAppStore';
import { logger } from '@/utils/logger';

interface UseAddAccountProps {
  onSuccess: () => void;
}

export function useAddAccount({ onSuccess }: UseAddAccountProps) {
  const { currency } = useAppStore();
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'bank' | 'credit_card' | 'cash' | 'savings' | 'investment' | 'other'>('bank');
  const [newAccBalance, setNewAccBalance] = useState('');

  const handleAddAccount = async () => {
    try {
      if (!newAccName) return;
      const bal = parseFloat(newAccBalance) || 0;
      const finalBal = newAccType === 'credit_card' ? -Math.abs(bal) : bal;

      let color = '#6C5CE7';
      let icon = 'wallet';
      if (newAccType === 'credit_card') {
        color = '#FF7675';
        icon = 'card';
      } else if (newAccType === 'investment') {
        color = '#00B894';
        icon = 'analytics';
      } else if (newAccType === 'savings') {
        color = '#0984E3';
        icon = 'trending-up';
      } else if (newAccType === 'bank') {
        color = '#6C5CE7';
        icon = 'business';
      }

      await db.insert(accounts).values({
        name: newAccName,
        type: newAccType,
        balance: finalBal,
        currency: currency,
        color,
        icon,
      });

      setNewAccName('');
      setNewAccBalance('');
      onSuccess();
    } catch (e) {
      logger.error('Error adding account:', e);
    }
  };

  return {
    newAccName,
    setNewAccName,
    newAccType,
    setNewAccType,
    newAccBalance,
    setNewAccBalance,
    handleAddAccount,
  };
}
