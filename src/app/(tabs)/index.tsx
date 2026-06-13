import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { useAppStore } from '@/stores/useAppStore';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { useReportData } from '@/features/reports/hooks/useReportData';
import { useRecurringEngine } from '@/features/recurring/hooks/useRecurringEngine';
import { ComparisonLineChart } from '@/components/charts';
import { styles } from '@/features/dashboard/styles/dashboard.styles';

// Sub-components
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { NetWealthCard } from '@/features/dashboard/components/NetWealthCard';
import { BudgetOverview } from '@/features/dashboard/components/BudgetOverview';
import { UpcomingRecurringList } from '@/features/dashboard/components/UpcomingRecurringList';
import { RecentTransactionsList } from '@/features/dashboard/components/RecentTransactionsList';

export default function DashboardScreen() {
  const { colors, isDark } = useAppTheme();
  const { userName, currency } = useAppStore();
  const { width } = useWindowDimensions();

  const {
    summary,
    recentTransactions,
    activeBudgets,
    upcomingRecurring,
    loadData,
  } = useDashboardData();

  const {
    comparisonCurrentData,
    comparisonPreviousData,
    calculateReports,
  } = useReportData();

  const [refreshing, setRefreshing] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const { processRecurringTransactions } = useRecurringEngine();

  const loadDashboardContent = useCallback(async () => {
    try {
      const today = new Date();
      // 1. Process recurring engine backfill
      await processRecurringTransactions();
      // 2. Load standard financials concurrently
      await loadData(today);
      // 3. Load comparison reports data (comparison only, skipping heavy queries)
      await calculateReports(colors.primary, true);
    } catch (err) {
      console.error('Error loading dashboard content:', err);
    }
  }, [loadData, processRecurringTransactions, calculateReports, colors.primary]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardContent();
    }, [loadDashboardContent])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardContent();
    setRefreshing(false);
  };

  const currencySymbol = currency === 'EUR' ? '€' : (currency === 'GBP' ? '£' : '$');

  const handleChartPress = () => {
    router.push({ pathname: '/reports', params: { scrollTo: 'spending-trend' } });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={scrollEnabled}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            enabled={scrollEnabled}
          />
        }
      >
        {/* Greetings Header */}
        <DashboardHeader userName={userName} colors={colors} />

        {/* Spending Comparison Chart */}
        <View style={styles.dashboardChartContainer}>
          <Pressable
            onPress={handleChartPress}
            accessibilityRole="button"
            accessibilityLabel="View spending reports"
            style={styles.dashboardChartHeader}
          >
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Spending Comparison</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>This Month vs Previous Month</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
          <ComparisonLineChart
            currentData={comparisonCurrentData}
            previousData={comparisonPreviousData}
            currencySymbol={currencySymbol}
            width={width}
            onInteractionChange={(active) => setScrollEnabled(!active)}
          />
        </View>

        {/* Net Wealth & Stats Card */}
        <NetWealthCard summary={summary} currency={currency} isDark={isDark} />

        {/* Budgets Section */}
        <BudgetOverview activeBudgets={activeBudgets} currency={currency} colors={colors} />

        {/* Upcoming Recurring Section */}
        <UpcomingRecurringList upcomingRecurring={upcomingRecurring} currency={currency} colors={colors} />

        {/* Recent Transactions Section */}
        <RecentTransactionsList recentTransactions={recentTransactions} currency={currency} colors={colors} />
      </ScrollView>
    </SafeAreaView>
  );
}
