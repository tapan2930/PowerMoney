import { useState, useEffect } from 'react';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Account } from '../types';
import { logger } from '@/utils/logger';

interface UseEditAccountProps {
  account: Account | null;
  onSuccess: () => void;
}

export function useEditAccount({ account, onSuccess }: UseEditAccountProps) {
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<'bank' | 'credit_card' | 'cash' | 'savings' | 'investment' | 'other'>(account?.type ?? 'bank');
  const [balance, setBalance] = useState(
    account
      ? account.type === 'credit_card'
        ? Math.abs(account.balance).toString()
        : account.balance.toString()
      : ''
  );

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setBalance(
        account.type === 'credit_card'
          ? Math.abs(account.balance).toString()
          : account.balance.toString()
      );
    }
  }, [account]);

  const handleUpdateAccount = async () => {
    if (!account || !name) return;
    try {
      const enteredBal = parseFloat(balance) || 0;
      const bal = type === 'credit_card' ? -Math.abs(enteredBal) : enteredBal;
      await db
        .update(accounts)
        .set({
          name,
          type,
          balance: bal,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(accounts.id, account.id));

      onSuccess();
    } catch (e) {
      logger.error('Error updating account:', e);
    }
  };

  const handleArchiveAccount = async (archive: boolean) => {
    if (!account) return;
    try {
      await db
        .update(accounts)
        .set({
          isArchived: archive,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(accounts.id, account.id));

      onSuccess();
    } catch (e) {
      logger.error('Error archiving account:', e);
    }
  };

  const handleDeleteAccount = async () => {
    if (!account) return;
    try {
      await db.delete(accounts).where(eq(accounts.id, account.id));
      onSuccess();
    } catch (e) {
      logger.error('Error deleting account:', e);
    }
  };

  return {
    name,
    setName,
    type,
    setType,
    balance,
    setBalance,
    handleUpdateAccount,
    handleArchiveAccount,
    handleDeleteAccount,
  };
}
