import { BarChart, DonutChart, LineChart } from '@/components/charts';
import { AmountDisplay, Button, Card, ProgressBar, SegmentedControl } from '@/components/ui';
import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import { useAppStore } from '@/stores/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { and, eq, gte, sql } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CategorySpend {
  id: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
}

import { useAppTheme } from '@/hooks/useAppTheme';

export default function ReportsScreen() {
  const { colors } = useAppTheme();
  const { currency } = useAppStore();

  const [timeRange, setTimeRange] = useState<'month' | 'week' | 'year'>('month');
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategorySpend[]>([]);
  const [trendData, setTrendData] = useState<{ value: number; label: string }[]>([]);

  const getStartDateForRange = (range: 'week' | 'month' | 'year') => {
    const date = new Date();
    if (range === 'week') {
      date.setDate(date.getDate() - 7);
    } else if (range === 'month') {
      date.setMonth(date.getMonth() - 1);
    } else if (range === 'year') {
      date.setFullYear(date.getFullYear() - 1);
    }
    return date.toISOString().split('T')[0];
  };

  const calculateReports = async () => {
    try {
      const startDate = getStartDateForRange(timeRange);

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
            sql`${categories.name} != 'Transfer'`
          )
        )
        .groupBy(categories.id);

      const computedBreakdown = categoryRows.map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color || colors.primary,
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
    }
  };

  useFocusEffect(
    useCallback(() => {
      calculateReports();
    }, [timeRange])
  );

  const savings = totalIncome - totalExpense;
  const netSavingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Analytics & Insights</Text>
      </View>

      {/* Date Selectors */}
      <SegmentedControl
        options={[
          { label: 'WEEK', value: 'week' },
          { label: 'MONTH', value: 'month' },
          { label: 'YEAR', value: 'year' },
        ]}
        selectedValue={timeRange}
        onChange={setTimeRange}
        style={styles.tabsContainer}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cashflow Summary Card */}
        <Card style={styles.cashflowCard} padding={20}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Cash Flow Overview</Text>
          <AmountDisplay amount={savings} currency={currency} style={styles.cashflowBalance} />
          <Text style={[styles.cashflowSubtitle, { color: colors.textSecondary }]}>
            Net savings for this period
          </Text>

          <View style={styles.progressMetrics}>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Savings Rate</Text>
              <Text style={[styles.metricVal, { color: colors.primary }]}>
                {Math.round(netSavingsRate)}%
              </Text>
            </View>
            <ProgressBar progress={Math.max(0, Math.min(netSavingsRate / 100, 1))} height={6} />
          </View>

          <View style={styles.inOutStats}>
            <View style={styles.inOutCol}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>INFLOW</Text>
              <AmountDisplay amount={totalIncome} type="income" currency={currency} style={styles.statVal} />
            </View>
            <View style={styles.inOutCol}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>OUTFLOW</Text>
              <AmountDisplay amount={totalExpense} type="expense" currency={currency} style={styles.statVal} />
            </View>
          </View>
        </Card>

        {/* Visual Charts Section */}
        {totalExpense > 0 && (
          <View style={styles.chartContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending Composition</Text>
            <Card padding={16}>
              <DonutChart
                data={categoryBreakdown.map((item) => ({
                  value: item.total,
                  color: item.color,
                  label: item.name,
                }))}
                centerLabelTitle={`${currency} ${totalExpense.toFixed(0)}`}
                centerLabelSubtitle="Total Spend"
              />
            </Card>
          </View>
        )}

        {trendData.length > 0 && trendData[0].value > 0 && (
          <View style={styles.chartContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending Trend</Text>
            <Card padding={16}>
              <LineChart data={trendData} color={colors.primary} />
            </Card>
          </View>
        )}

        <View style={styles.chartContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Inflow vs Outflow</Text>
          <Card padding={16}>
            <BarChart
              data={[
                { value: totalIncome, label: 'Inflow', frontColor: colors.primary },
                { value: totalExpense, label: 'Outflow', frontColor: colors.danger },
              ]}
            />
          </Card>
        </View>

        {/* Category Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending Breakdown</Text>
          {categoryBreakdown.length === 0 ? (
            <Card style={styles.emptyCard} padding={24}>
              <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary + '60'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No spending data logged for this period.
              </Text>
            </Card>
          ) : (
            <FlashList
              data={categoryBreakdown}
              renderItem={({ item }) => (
                <Card style={styles.breakdownItem} padding={14}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemLeft}>
                      <View style={[styles.iconBg, { backgroundColor: item.color + '15' }]}>
                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
                    </View>
                    <View style={styles.itemRight}>
                      <AmountDisplay amount={item.total} type="expense" currency={currency} style={styles.itemAmount} />
                      <Text style={[styles.itemPercent, { color: colors.textSecondary }]}>
                        {Math.round(item.percentage)}%
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar with category matching color */}
                  <View style={[styles.barBg, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>
                </Card>
              )}
              keyExtractor={(item) => item.id}
              estimatedItemSize={90}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 16,
    marginVertical: 12,
  },
  tabBtn: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  cashflowCard: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cashflowBalance: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
  },
  cashflowSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  progressMetrics: {
    marginTop: 20,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  inOutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F3',
    marginTop: 20,
    paddingTop: 16,
  },
  inOutCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  breakdownSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  breakdownItem: {
    marginVertical: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemPercent: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
});
