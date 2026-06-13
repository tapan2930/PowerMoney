import { useState, useCallback } from 'react';
import { getBudgetsWithSpent, getFinancialSummary, getRecentTransactions, getUpcomingRecurring } from '@/db/queries/financials';

export interface DashboardSummary {
  netBalance: number;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
}

export interface DashboardTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string | null;
  merchant: string | null;
  date: string;
  time: string | null;
  notes: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  accountName: string | null;
}

export interface DashboardBudget {
  id: string;
  name: string;
  amount: number;
  period: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  categoryId: string | null;
  spent: number;
  progress: number;
}

export interface DashboardUpcomingRecurring {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string | null;
  merchant: string | null;
  frequency: string;
  interval: number;
  nextRunDate: string;
  preferredTime: string | null;
  accountName: string | null;
}

export function useDashboardData() {
  const [summary, setSummary] = useState<DashboardSummary>({
    netBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    savingsRate: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<DashboardTransaction[]>([]);
  const [activeBudgets, setActiveBudgets] = useState<DashboardBudget[]>([]);
  const [upcomingRecurring, setUpcomingRecurring] = useState<DashboardUpcomingRecurring[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const formatLocalDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const loadData = useCallback(async (currentMonth: Date) => {
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const [summaryData, transactionsData, budgetsData, upcomingData] = await Promise.all([
        getFinancialSummary(formatLocalDate(startOfMonth), formatLocalDate(endOfMonth)),
        getRecentTransactions(5),
        getBudgetsWithSpent(),
        getUpcomingRecurring(3),
      ]);

      setSummary(summaryData);
      setRecentTransactions(transactionsData as DashboardTransaction[]);
      setActiveBudgets(budgetsData as DashboardBudget[]);
      setUpcomingRecurring(upcomingData as DashboardUpcomingRecurring[]);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(new Date());
    setRefreshing(false);
  }, [loadData]);

  return {
    summary,
    recentTransactions,
    activeBudgets,
    upcomingRecurring,
    refreshing,
    setRefreshing,
    loadData,
    handleRefresh,
  };
}
