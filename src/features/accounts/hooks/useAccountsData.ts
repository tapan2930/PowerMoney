import { useState, useCallback } from 'react';
import { db } from '@/db';
import { accounts, transactions, categories } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Account, TransactionItem, Category } from '../types';
import { logger } from '@/utils/logger';

export function useAccountsData() {
  const [accountsList, setAccountsList] = useState<Account[]>([]);
  const [transactionsList, setTransactionsList] = useState<TransactionItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      // Fetch Accounts
      const accs = await db.select().from(accounts).where(eq(accounts.isArchived, false));
      setAccountsList(accs as Account[]);

      // Fetch Categories for dropdown
      const cats = await db.select().from(categories);
      setCategoriesList(cats as Category[]);

      // Fetch Transactions
      const txs = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          type: transactions.type,
          description: transactions.description,
          merchant: transactions.merchant,
          date: transactions.date,
          accountId: transactions.accountId,
          categoryId: transactions.categoryId,
          categoryName: categories.name,
          categoryIcon: categories.icon,
          categoryColor: categories.color,
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .orderBy(desc(transactions.date), desc(transactions.createdAt));

      setTransactionsList(txs as TransactionItem[]);
    } catch (e) {
      logger.error('Error loading accounts data:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    accountsList,
    transactionsList,
    categoriesList,
    refreshing,
    loadData,
  };
}
