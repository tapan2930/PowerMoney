export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'credit_card' | 'cash' | 'savings' | 'investment' | 'other';
  balance: number;
  currency: string;
  color: string | null;
  icon: string | null;
  isArchived?: boolean | null;
}

export interface TransactionItem {
  id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string | null;
  merchant: string | null;
  date: string;
  time: string | null;
  accountId: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: 'income' | 'expense';
  parentId: string | null;
  sortOrder: number | null;
  isSystem: boolean | null;
  createdAt: string | null;
}
