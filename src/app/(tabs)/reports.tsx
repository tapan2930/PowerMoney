import { SegmentedControl, DateRangePicker } from '@/components/ui';
import { useAppStore } from '@/stores/useAppStore';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useReportData } from '@/features/reports/hooks/useReportData';
import { styles } from '@/features/reports/styles/reports.styles';

// Sub-components
import { CashflowOverviewCard } from '@/features/reports/components/CashflowOverviewCard';
import { SpendingComposition } from '@/features/reports/components/SpendingComposition';
import { SpendingTrend } from '@/features/reports/components/SpendingTrend';
import { SpendingBreakdownList } from '@/features/reports/components/SpendingBreakdownList';
import { CategoryTrends } from '@/features/reports/components/CategoryTrends';

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
    comparisonCurrentData,
    comparisonPreviousData,
    categoryTrendData,
    calculateReports,
  } = useReportData();

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [spendingTrendY, setSpendingTrendY] = useState(0);

  useEffect(() => {
    if (scrollTo === 'spending-trend' && spendingTrendY > 0) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: spendingTrendY, animated: true });
        router.setParams({ scrollTo: undefined });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scrollTo, spendingTrendY]);

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

  const formatDateDisplay = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const savings = totalIncome - totalExpense;
  const netSavingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
  const currencySymbol = currency === 'EUR' ? '€' : (currency === 'GBP' ? '£' : '$');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Analytics & Insights</Text>
      </View>

      {/* Date Range Selector */}
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
              ? `${formatDateDisplay(customStart)} - ${formatDateDisplay(customEnd)}`
              : 'Tap to select custom date range'}
          </Text>
          <Ionicons name="pencil" size={14} color={colors.primary} style={styles.pencilIcon} />
        </Pressable>
      )}

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} scrollEnabled={scrollEnabled}>
        {/* Cashflow Summary Card */}
        <CashflowOverviewCard
          savings={savings}
          currency={currency}
          netSavingsRate={netSavingsRate}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          colors={colors}
        />

        {/* Spending Composition (Donut Chart) */}
        <SpendingComposition
          totalExpense={totalExpense}
          categoryBreakdown={categoryBreakdown}
          currencySymbol={currencySymbol}
          currency={currency}
        />

        {/* Spending Trend (Cumulative Line Chart) */}
        <SpendingTrend
          comparisonCurrentData={comparisonCurrentData}
          comparisonPreviousData={comparisonPreviousData}
          currencySymbol={currencySymbol}
          currency={currency}
          onInteractionChange={(active) => setScrollEnabled(!active)}
          onLayout={setSpendingTrendY}
          colors={colors}
        />

        {/* Spending Category Breakdown List */}
        <SpendingBreakdownList
          categoryBreakdown={categoryBreakdown}
          currency={currency}
          colors={colors}
        />

        {/* Historical Category Trends Chart */}
        <CategoryTrends
          categoryTrendData={categoryTrendData}
          currencySymbol={currencySymbol}
          onInteractionChange={(active) => setScrollEnabled(!active)}
        />
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
