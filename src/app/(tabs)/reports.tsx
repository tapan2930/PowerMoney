import { BarChart, DonutChart, LineChart } from '@/components/charts';
import { AmountDisplay, Button, Card, ProgressBar, SegmentedControl, DateRangePicker } from '@/components/ui';
import { useAppStore } from '@/stores/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
const AnyFlashList = FlashList as any;
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useReportData, CategorySpend } from '@/features/reports/hooks/useReportData';


export default function ReportsScreen() {
  const { colors } = useAppTheme();
  const { currency } = useAppStore();

  const {
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
    calculateReports,
  } = useReportData();

  const [datePickerVisible, setDatePickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      calculateReports(colors.primary);
    }, [calculateReports, colors.primary])
  );

  const handleTimeRangeChange = (value: 'week' | 'month' | 'year' | 'custom') => {
    setTimeRange(value);
    if (value === 'custom') {
      setDatePickerVisible(true);
    }
  };

  const renderCategoryItem: ListRenderItem<CategorySpend> = useCallback(({ item }) => (
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
  ), [colors.text, colors.textSecondary, colors.border, currency]);

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
          { label: 'CUSTOM', value: 'custom', icon: 'calendar-outline' },
        ]}
        selectedValue={timeRange}
        onChange={handleTimeRangeChange}
        style={styles.tabsContainer}
      />

      {timeRange === 'custom' && (
        <Pressable
          onPress={() => setDatePickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Change custom date range"
          style={styles.customRangeSubtitle}
        >
          <Text style={[styles.customRangeText, { color: colors.primary }]}>
            {customStart && customEnd
              ? `${new Date(customStart + 'T00:00:00').toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })} - ${new Date(customEnd + 'T00:00:00').toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}`
              : 'Tap to select custom date range'}
          </Text>
          <Ionicons name="pencil" size={14} color={colors.primary} style={styles.pencilIcon} />
        </Pressable>
      )}


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
            <AnyFlashList
              data={categoryBreakdown}
              renderItem={renderCategoryItem}
              keyExtractor={(item: CategorySpend) => item.id}
              estimatedItemSize={90}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      <DateRangePicker
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        startDate={customStart}
        endDate={customEnd}
        onApply={(start, end) => {
          setCustomStart(start);
          setCustomEnd(end);
        }}
      />
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
  customRangeSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    paddingVertical: 4,
  },
  customRangeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pencilIcon: {
    marginLeft: 6,
  },
});

