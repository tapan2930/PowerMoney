import { useState, useCallback } from 'react';
import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';

export interface CategorySpend {
  id: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
}

export function useReportData() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'custom'>('month');
  const [customStart, setCustomStart] = useState<string | null>(null);
  const [customEnd, setCustomEnd] = useState<string | null>(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategorySpend[]>([]);
  const [trendData, setTrendData] = useState<{ value: number; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const getStartDateForRange = useCallback((range: 'week' | 'month' | 'year' | 'custom', customS: string | null) => {
    if (range === 'custom') {
      return customS || new Date().toISOString().split('T')[0];
    }
    const date = new Date();
    if (range === 'week') {
      date.setDate(date.getDate() - 7);
    } else if (range === 'month') {
      date.setMonth(date.getMonth() - 1);
    } else if (range === 'year') {
      date.setFullYear(date.getFullYear() - 1);
    }
    return date.toISOString().split('T')[0];
  }, []);

  const getEndDateForRange = useCallback((range: 'week' | 'month' | 'year' | 'custom', customE: string | null) => {
    if (range === 'custom') {
      return customE || new Date().toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }, []);

  const calculateReports = useCallback(async (primaryColor: string) => {
    try {
      setLoading(true);
      const startDate = getStartDateForRange(timeRange, customStart);
      const endDate = getEndDateForRange(timeRange, customEnd);

      // 1. Fetch total income & expenses in time range (excluding transfers)
      const summaryResult = await db
        .select({
          type: transactions.type,
          sum: sql<number>`sum(${transactions.amount})`,
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            gte(transactions.date, startDate),
            lte(transactions.date, endDate),
            sql`(${categories.name} IS NULL OR ${categories.name} != 'Transfer')`
          )
        )
        .groupBy(transactions.type);

      let income = 0;
      let expense = 0;

      summaryResult.forEach((row) => {
        if (row.type === 'income') income = row.sum ?? 0;
        if (row.type === 'expense') expense = row.sum ?? 0;
      });

      setTotalIncome(income);
      setTotalExpense(expense);

      // 2. Fetch category wise spending in time range (excluding transfers)
      const categoryRows = await db
        .select({
          id: categories.id,
          name: categories.name,
          color: categories.color,
          icon: categories.icon,
          total: sql<number>`sum(${transactions.amount})`,
        })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            eq(transactions.type, 'expense'),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate),
            sql`${categories.name} != 'Transfer'`
          )
        )
        .groupBy(categories.id);

      const computedBreakdown = categoryRows.map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color || primaryColor,
        icon: row.icon || 'cart',
        total: row.total ?? 0,
        percentage: expense > 0 ? ((row.total ?? 0) / expense) * 100 : 0,
      }));

      computedBreakdown.sort((a, b) => b.total - a.total);
      setCategoryBreakdown(computedBreakdown);

      // 3. Fetch trend data (spending over time, excluding transfers)
      const trendRows = await db
        .select({
          date: transactions.date,
          total: sql<number>`sum(${transactions.amount})`,
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            eq(transactions.type, 'expense'),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate),
            sql`(${categories.name} IS NULL OR ${categories.name} != 'Transfer')`
          )
        )
        .groupBy(transactions.date)
        .orderBy(transactions.date);

      const formattedTrends = trendRows.map((row) => {
        const dateParts = row.date.split('-');
        const label = dateParts.length > 2 ? `${dateParts[1]}/${dateParts[2]}` : row.date;
        return {
          value: row.total ?? 0,
          label,
        };
      });

      if (formattedTrends.length === 0) {
        setTrendData([{ value: 0, label: 'No Data' }]);
      } else {
        setTrendData(formattedTrends);
      }
    } catch (e) {
      console.error('Error generating reports:', e);
    } finally {
      setLoading(false);
    }
  }, [timeRange, customStart, customEnd, getStartDateForRange, getEndDateForRange]);

  return {
    timeRange,
    setTimeRange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    totalIncome,
    totalExpense,
    categoryBreakdown,
    trendData,
    loading,
    calculateReports,
  };
}
