import { AmountDisplay, Button, Card, GradientCard, ProgressRing } from '@/components/ui';
import { useAppStore } from '@/stores/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View, Platform, Modal, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './index.styles';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { ComparisonLineChart } from '@/components/charts';
import { useReportData } from '@/features/reports/hooks/useReportData';
import { db } from '@/db';
import { recurringTransactions, accounts } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { useRecurringEngine } from '@/features/recurring/hooks/useRecurringEngine';

interface TransactionItem {
  id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string | null;
  merchant: string | null;
  date: string;
  notes: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  accountName: string | null;
}

export default function DashboardScreen() {
  const { colors, isDark } = useAppTheme();
  const { userName, currency } = useAppStore();

  const {
    summary,
    recentTransactions,
    activeBudgets,
    refreshing,
    loadData,
  } = useDashboardData();

  const {
    comparisonCurrentData,
    comparisonPreviousData,
    calculateReports,
  } = useReportData();

  const [upcomingRecurring, setUpcomingRecurring] = useState<any[]>([]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const { processRecurringTransactions } = useRecurringEngine();

  const loadDashboardContent = useCallback(async () => {
    try {
      const today = new Date();
      // 1. Process recurring engine backfill
      await processRecurringTransactions();
      // 2. Load standard financials
      await loadData(today);
      // 3. Query upcoming active recurring transactions
      const results = await db
        .select({
          id: recurringTransactions.id,
          type: recurringTransactions.type,
          amount: recurringTransactions.amount,
          description: recurringTransactions.description,
          merchant: recurringTransactions.merchant,
          frequency: recurringTransactions.frequency,
          interval: recurringTransactions.interval,
          nextRunDate: recurringTransactions.nextRunDate,
          accountName: accounts.name,
        })
        .from(recurringTransactions)
        .leftJoin(accounts, eq(recurringTransactions.accountId, accounts.id))
        .where(eq(recurringTransactions.isActive, true))
        .orderBy(asc(recurringTransactions.nextRunDate))
        .limit(3);
      setUpcomingRecurring(results);
      // 4. Load comparison reports data
      await calculateReports(colors.primary);
    } catch (err) {
      console.error('Error loading dashboard content:', err);
    }
  }, [loadData, processRecurringTransactions, calculateReports, colors.primary]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardContent();
    }, [loadDashboardContent])
  );

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleRefresh = async () => {
    await loadDashboardContent();
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
        {/* Header Block */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.name, { color: colors.text }]}>{userName || 'Finance Buddy'}</Text>
          </View>
          <View style={styles.headerActions}>
            <Button
              label=""
              onPress={() => router.push('/chat')}
              variant="secondary"
              size="sm"
              leftIcon={<Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />}
              style={styles.headerButton}
            />
            <Button
              label=""
              onPress={() => router.push('/preferences')}
              variant="secondary"
              size="sm"
              leftIcon={<Ionicons name="settings-outline" size={20} color={colors.primary} />}
              style={styles.headerButton}
            />
          </View>
        </View>

        {/* Spending Comparison Chart (Full bleed, borderless, above Net Wealth) */}
        <View style={styles.dashboardChartContainer}>
          <Pressable
            onPress={() => router.push({ pathname: '/reports', params: { scrollTo: 'spending-trend' } })}
            accessibilityRole="button"
            accessibilityLabel="View spending reports"
            style={[styles.chartHeader, { paddingHorizontal: 16, paddingTop: 16, marginBottom: 0 }]}
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
            currencySymbol={currency === 'USD' ? '$' : (currency === 'EUR' ? '€' : (currency === 'GBP' ? '£' : '$'))}
            width={Dimensions.get('window').width}
            onInteractionChange={(active) => setScrollEnabled(!active)}
          />
        </View>

        {/* Compact Net Wealth & Stats Card */}
        <GradientCard colors={!isDark ? ['#6C5CE7', '#8E2DE2'] : ['#1A1A2E', '#16213E']} style={styles.heroCard} padding={16}>
          <View style={styles.heroMainRow}>
            <View>
              <Text style={styles.heroLabel}>Net Wealth</Text>
              <AmountDisplay amount={summary.netBalance} type="neutral" currency={currency} style={styles.heroAmount} />
            </View>
            <View style={styles.heroHeaderBadge}>
              <Ionicons name="trending-up" size={14} color="#55EFC4" />
              <Text style={styles.heroBadgeText}>{Math.round(summary.savingsRate)}% Saved</Text>
            </View>
          </View>

          <View style={styles.heroStatsGrid}>
            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatLabel}>Inflow</Text>
              <AmountDisplay amount={summary.totalIncome} type="neutral" currency={currency} style={styles.heroStatVal} />
            </View>
            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatLabel}>Outflow</Text>
              <AmountDisplay amount={summary.totalExpense} type="neutral" currency={currency} style={styles.heroStatVal} />
            </View>
          </View>
        </GradientCard>

        {/* Budgets Section */}
        {activeBudgets.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Budget Overview</Text>
            <FlatList
              horizontal
              data={activeBudgets}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <Card variant="glass" style={styles.budgetCard} padding={12}>
                  <View style={styles.budgetCardRow}>
                    <View style={styles.budgetTextCol}>
                      <Text style={[styles.budgetName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.budgetDetail, { color: colors.textSecondary }]}>
                        {Math.round(item.progress * 100)}% Used
                      </Text>
                      <View style={styles.limitRow}>
                        <Text style={[styles.budgetAmountText, { color: colors.textSecondary }]}>Limit: </Text>
                        <AmountDisplay
                          amount={item.amount}
                          type="neutral"
                          currency={currency}
                          animate={false}
                          style={styles.budgetLimitAmount}
                        />
                      </View>
                    </View>
                    <ProgressRing progress={item.progress} size={64} strokeWidth={6} />
                  </View>
                </Card>
              )}
            />
          </View>
        )}

        {/* Upcoming Recurring Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Recurring</Text>
            <Button
              label="See All"
              onPress={() => router.push('/recurring-transactions')}
              variant="ghost"
              size="sm"
            />
          </View>

          {upcomingRecurring.length === 0 ? (
            <Card style={styles.emptyCard} padding={24}>
              <Ionicons name="repeat-outline" size={48} color={colors.textSecondary + '60'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No upcoming recurring bills/transfers</Text>
              <Button
                label="Add Recurring"
                onPress={() => router.push('/add-recurring-transaction')}
                variant="primary"
                size="sm"
                style={styles.emptyCta}
              />
            </Card>
          ) : (
            <View style={{ gap: 8, marginBottom: 24 }}>
              {upcomingRecurring.map((item) => (
                <Pressable key={item.id} onPress={() => router.push({ pathname: '/add-recurring-transaction', params: { id: item.id } })}>
                  <Card style={styles.txRow} padding={12}>
                    <View style={styles.txLeft}>
                      <View
                        style={[
                          styles.txIconContainer,
                          { backgroundColor: colors.primary + '15' },
                        ]}
                      >
                        <Ionicons
                          name={item.type === 'transfer' ? 'swap-horizontal-outline' : (item.type === 'income' ? 'trending-up-outline' : 'trending-down-outline')}
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.txTextCol}>
                        <Text style={[styles.txMerchant, { color: colors.text }]} numberOfLines={1}>
                          {item.merchant || item.description || (item.type === 'transfer' ? 'Transfer' : 'Recurring Item')}
                        </Text>
                        <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                          Next: {item.nextRunDate} • {item.frequency === 'daily' ? 'Daily' : (item.frequency === 'weekly' ? 'Weekly' : (item.frequency === 'monthly' ? 'Monthly' : 'Yearly'))}
                        </Text>
                      </View>
                    </View>
                    <AmountDisplay amount={item.amount} type={item.type === 'income' ? 'income' : 'expense'} currency={currency} style={styles.txAmount} />
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
            <Button
              label="See All"
              onPress={() => router.push('/accounts')}
              variant="ghost"
              size="sm"
            />
          </View>

          {recentTransactions.length === 0 ? (
            <Card style={styles.emptyCard} padding={24}>
              <Ionicons name="receipt-outline" size={48} color={colors.textSecondary + '60'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions logged yet</Text>
              <Button
                label="Log Transaction"
                onPress={() => router.push('/add-transaction')}
                variant="primary"
                size="sm"
                style={styles.emptyCta}
              />
            </Card>
          ) : (
            <FlashList
              data={recentTransactions}
              renderItem={({ item }) => (
                <Card style={styles.txRow} padding={12}>
                  <View style={styles.txLeft}>
                    <View
                      style={[
                        styles.txIconContainer,
                        { backgroundColor: (item.categoryColor || colors.primary) + '15' },
                      ]}
                    >
                      <Ionicons
                        name={(item.categoryIcon || 'cart-outline') as any}
                        size={20}
                        color={item.categoryColor || colors.primary}
                      />
                    </View>
                    <View style={styles.txTextCol}>
                      <Text style={[styles.txMerchant, { color: colors.text }]} numberOfLines={1}>
                        {item.merchant || item.description || 'Transaction'}
                      </Text>
                      <Text style={[styles.txDate, { color: colors.textSecondary }]}>{item.date}</Text>
                    </View>
                  </View>
                  <AmountDisplay amount={item.amount} type={item.type} currency={currency} style={styles.txAmount} />
                </Card>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>


    </SafeAreaView>
  );
}


