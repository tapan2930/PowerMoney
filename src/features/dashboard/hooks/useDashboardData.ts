import { useState, useCallback } from 'react';
import { getBudgetsWithSpent, getFinancialSummary, getRecentTransactions } from '@/db/queries/financials';

export function useDashboardData() {
  const [summary, setSummary] = useState({ netBalance: 0, totalIncome: 0, totalExpense: 0, savingsRate: 0 });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [activeBudgets, setActiveBudgets] = useState<any[]>([]);
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

      const summaryData = await getFinancialSummary(formatLocalDate(startOfMonth), formatLocalDate(endOfMonth));
      const transactionsData = await getRecentTransactions(5);
      const budgetsData = await getBudgetsWithSpent();

      setSummary(summaryData);
      setRecentTransactions(transactionsData as any[]);
      setActiveBudgets(budgetsData);
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
    refreshing,
    loadData,
    handleRefresh,
  };
}
