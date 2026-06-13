import { type CategoryTrendSeries } from '@/components/charts/CategoryTrendChart';
import { type ComparisonDataPoint } from '@/components/charts/ComparisonLineChart';
import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { useCallback, useState } from 'react';

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
  const [comparisonCurrentData, setComparisonCurrentData] = useState<ComparisonDataPoint[]>([]);
  const [comparisonPreviousData, setComparisonPreviousData] = useState<ComparisonDataPoint[]>([]);
  const [categoryTrendData, setCategoryTrendData] = useState<CategoryTrendSeries[]>([]);
  const [loading, setLoading] = useState(false);

  const getRangeBoundaries = useCallback((range: 'week' | 'month' | 'year' | 'custom', customS: string | null, customE: string | null) => {
    const today = new Date();
    let start: Date;
    let end: Date = new Date();

    let prevStart: Date;
    let prevEnd: Date;

    if (range === 'custom') {
      start = customS ? new Date(customS + 'T00:00:00') : new Date();
      end = customE ? new Date(customE + 'T00:00:00') : new Date();

      const durationMs = end.getTime() - start.getTime();
      const prevEndMs = start.getTime() - 24 * 60 * 60 * 1000; // day before customStart
      const prevStartMs = prevEndMs - durationMs;

      prevStart = new Date(prevStartMs);
      prevEnd = new Date(prevEndMs);
    } else if (range === 'week') {
      start = new Date();
      start.setDate(today.getDate() - 6);
      end = today;

      prevStart = new Date();
      prevStart.setDate(today.getDate() - 13);
      prevEnd = new Date();
      prevEnd.setDate(today.getDate() - 7);
    } else if (range === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      prevEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    } else { // year
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);

      prevStart = new Date(today.getFullYear() - 1, 0, 1);
      prevEnd = new Date(today.getFullYear() - 1, 11, 31);
    }

    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    return {
      currentStart: formatDate(start),
      currentEnd: formatDate(end),
      previousStart: formatDate(prevStart),
      previousEnd: formatDate(prevEnd),
    };
  }, []);

  const calculateReports = useCallback(async (primaryColor: string, comparisonOnly = false) => {
    try {
      setLoading(true);
      const boundaries = getRangeBoundaries(timeRange, customStart, customEnd);
      const currentStart = boundaries.currentStart;
      const currentEnd = boundaries.currentEnd;
      const previousStart = boundaries.previousStart;
      const previousEnd = boundaries.previousEnd;


      if (!comparisonOnly) {
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
              gte(transactions.date, currentStart),
              lte(transactions.date, currentEnd),
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
              gte(transactions.date, currentStart),
              lte(transactions.date, currentEnd),
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
              gte(transactions.date, currentStart),
              lte(transactions.date, currentEnd),
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
      }

      // 4. Fetch Comparison Data (excluding transfers)
      const currentRows = await db
        .select({
          date: transactions.date,
          total: sql<number>`sum(${transactions.amount})`,
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            eq(transactions.type, 'expense'),
            gte(transactions.date, currentStart),
            lte(transactions.date, currentEnd),
            sql`(${categories.name} IS NULL OR ${categories.name} != 'Transfer')`
          )
        )
        .groupBy(transactions.date)
        .orderBy(transactions.date);

      const previousRows = await db
        .select({
          date: transactions.date,
          total: sql<number>`sum(${transactions.amount})`,
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            eq(transactions.type, 'expense'),
            gte(transactions.date, previousStart),
            lte(transactions.date, previousEnd),
            sql`(${categories.name} IS NULL OR ${categories.name} != 'Transfer')`
          )
        )
        .groupBy(transactions.date)
        .orderBy(transactions.date);

      const currentMap = new Map<string, number>();
      currentRows.forEach((r) => currentMap.set(r.date, r.total ?? 0));

      const previousMap = new Map<string, number>();
      previousRows.forEach((r) => previousMap.set(r.date, r.total ?? 0));

      const currentPoints: ComparisonDataPoint[] = [];
      const previousPoints: ComparisonDataPoint[] = [];

      const todayStr = new Date().toISOString().split('T')[0];

      if (timeRange === 'week') {
        const startD = new Date(currentStart + 'T00:00:00');
        const prevStartD = new Date(previousStart + 'T00:00:00');

        let currentSum = 0;
        let previousSum = 0;

        for (let i = 0; i < 7; i++) {
          const curDate = new Date(startD);
          curDate.setDate(startD.getDate() + i);
          const curDateStr = curDate.toISOString().split('T')[0];

          const prevDate = new Date(prevStartD);
          prevDate.setDate(prevStartD.getDate() + i);
          const prevDateStr = prevDate.toISOString().split('T')[0];

          currentSum += currentMap.get(curDateStr) ?? 0;
          previousSum += previousMap.get(prevDateStr) ?? 0;

          const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const label = weekdayNames[curDate.getDay()];

          if (curDateStr <= todayStr) {
            currentPoints.push({
              value: currentSum,
              label,
              tooltipLabel: `Day ${i + 1} (${label})`,
            });
          }

          previousPoints.push({
            value: previousSum,
            label,
            tooltipLabel: `Day ${i + 1} (${label})`,
          });
        }
      } else if (timeRange === 'month') {
        const curStart = new Date(currentStart + 'T00:00:00');
        const prevStart = new Date(previousStart + 'T00:00:00');

        const curMaxDays = new Date(curStart.getFullYear(), curStart.getMonth() + 1, 0).getDate();
        const prevMaxDays = new Date(prevStart.getFullYear(), prevStart.getMonth() + 1, 0).getDate();
        const maxDays = Math.max(curMaxDays, prevMaxDays);

        let currentSum = 0;
        let previousSum = 0;

        for (let d = 1; d <= maxDays; d++) {
          const curDateStr = `${curStart.getFullYear()}-${String(curStart.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const prevDateStr = `${prevStart.getFullYear()}-${String(prevStart.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

          currentSum += currentMap.get(curDateStr) ?? 0;
          previousSum += previousMap.get(prevDateStr) ?? 0;

          if (d <= curMaxDays && curDateStr <= todayStr) {
            currentPoints.push({
              value: currentSum,
              label: d === 1 || d === 10 || d === 20 || d === 30 ? `${d}` : '',
              tooltipLabel: `Day ${d}`,
            });
          }

          if (d <= prevMaxDays) {
            previousPoints.push({
              value: previousSum,
              label: d === 1 || d === 10 || d === 20 || d === 30 ? `${d}` : '',
              tooltipLabel: `Day ${d}`,
            });
          }
        }
      } else if (timeRange === 'year') {
        const curYear = new Date(currentStart + 'T00:00:00').getFullYear();
        const prevYear = new Date(previousStart + 'T00:00:00').getFullYear();
        const currentMonthIndex = new Date().getMonth();
        const currentYearValue = new Date().getFullYear();

        let currentSum = 0;
        let previousSum = 0;

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let m = 0; m < 12; m++) {
          const curMonthPrefix = `${curYear}-${String(m + 1).padStart(2, '0')}`;
          const prevMonthPrefix = `${prevYear}-${String(m + 1).padStart(2, '0')}`;

          let curMonthExp = 0;
          currentRows.forEach((r) => {
            if (r.date.startsWith(curMonthPrefix)) curMonthExp += r.total ?? 0;
          });

          let prevMonthExp = 0;
          previousRows.forEach((r) => {
            if (r.date.startsWith(prevMonthPrefix)) prevMonthExp += r.total ?? 0;
          });

          currentSum += curMonthExp;
          previousSum += prevMonthExp;

          const label = monthNames[m];

          if (curYear < currentYearValue || m <= currentMonthIndex) {
            currentPoints.push({
              value: currentSum,
              label,
              tooltipLabel: label,
            });
          }

          previousPoints.push({
            value: previousSum,
            label,
            tooltipLabel: label,
          });
        }
      } else if (timeRange === 'custom') {
        const curStart = new Date(currentStart + 'T00:00:00');
        const curEnd = new Date(currentEnd + 'T00:00:00');
        const prevStart = new Date(previousStart + 'T00:00:00');

        const durationMs = curEnd.getTime() - curStart.getTime();
        const daysCount = Math.round(durationMs / (24 * 60 * 60 * 1000)) + 1;

        let currentSum = 0;
        let previousSum = 0;

        for (let i = 0; i < daysCount; i++) {
          const curDate = new Date(curStart);
          curDate.setDate(curStart.getDate() + i);
          const curDateStr = curDate.toISOString().split('T')[0];

          const prevDate = new Date(prevStart);
          prevDate.setDate(prevStart.getDate() + i);
          const prevDateStr = prevDate.toISOString().split('T')[0];

          currentSum += currentMap.get(curDateStr) ?? 0;
          previousSum += previousMap.get(prevDateStr) ?? 0;

          if (curDateStr <= todayStr) {
            currentPoints.push({
              value: currentSum,
              label: '',
              tooltipLabel: `Day ${i + 1} (${curDateStr})`,
            });
          }

          previousPoints.push({
            value: previousSum,
            label: '',
            tooltipLabel: `Day ${i + 1} (${prevDateStr})`,
          });
        }
      }

      setComparisonCurrentData(currentPoints);
      setComparisonPreviousData(previousPoints);

      if (!comparisonOnly) {
        // 5. Category Spending Trend — last 6 calendar months, top 5 categories
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        const trendStartDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
        const trendEndDate = new Date().toISOString().split('T')[0];

        const catTrendRows = await db
          .select({
            categoryId: transactions.categoryId,
            categoryName: categories.name,
            categoryColor: categories.color,
            date: transactions.date,
            total: sql<number>`sum(${transactions.amount})`,
          })
          .from(transactions)
          .innerJoin(categories, eq(transactions.categoryId, categories.id))
          .where(
            and(
              eq(transactions.type, 'expense'),
              gte(transactions.date, trendStartDate),
              lte(transactions.date, trendEndDate),
              sql`${categories.name} != 'Transfer'`
            )
          )
          .groupBy(transactions.categoryId, sql`substr(${transactions.date}, 1, 7)`)
          .orderBy(sql`substr(${transactions.date}, 1, 7)`);

        // Aggregate by category across months
        const catTotals = new Map<string, { name: string; color: string; total: number; monthly: Map<string, number> }>();
        catTrendRows.forEach((row) => {
          const catId = row.categoryId ?? 'unknown';
          const monthKey = row.date.substring(0, 7);
          if (!catTotals.has(catId)) {
            catTotals.set(catId, {
              name: row.categoryName ?? 'Other',
              color: row.categoryColor ?? primaryColor,
              total: 0,
              monthly: new Map(),
            });
          }
          const entry = catTotals.get(catId)!;
          entry.total += row.total ?? 0;
          entry.monthly.set(monthKey, (entry.monthly.get(monthKey) ?? 0) + (row.total ?? 0));
        });

        // Top 5 categories by total spend
        const topCats = [...catTotals.entries()]
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 5);

        // Build month labels for the last 6 months
        const monthLabels: string[] = [];
        const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 0; i < 6; i++) {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthLabels.push(key);
        }

        const trendSeries: CategoryTrendSeries[] = topCats.map(([_, cat]) => ({
          name: cat.name,
          color: cat.color,
          data: monthLabels.map((mk) => ({
            value: cat.monthly.get(mk) ?? 0,
            label: monthShortNames[parseInt(mk.split('-')[1]) - 1],
          })),
        }));

        setCategoryTrendData(trendSeries);
      }
    } catch (e) {
      console.error('Error generating reports:', e);
    } finally {
      setLoading(false);
    }
  }, [timeRange, customStart, customEnd, getRangeBoundaries]);

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
    comparisonCurrentData,
    comparisonPreviousData,
    categoryTrendData,
    loading,
    calculateReports,
  };
}
