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

      const [accs, cats, txs] = await Promise.all([
        db.select().from(accounts).where(eq(accounts.isArchived, false)),
        db.select().from(categories),
        db
          .select({
            id: transactions.id,
            amount: transactions.amount,
            type: transactions.type,
            description: transactions.description,
            merchant: transactions.merchant,
            date: transactions.date,
            time: transactions.time,
            accountId: transactions.accountId,
            categoryId: transactions.categoryId,
            categoryName: categories.name,
            categoryIcon: categories.icon,
            categoryColor: categories.color,
          })
          .from(transactions)
          .leftJoin(categories, eq(transactions.categoryId, categories.id))
          .orderBy(desc(transactions.date), desc(transactions.createdAt)),
      ]);

      setAccountsList(accs as Account[]);
      setCategoriesList(cats as Category[]);
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
