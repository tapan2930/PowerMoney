import { AmountDisplay, Button, Card, GradientCard, ProgressRing } from '@/components/ui';
import { getBudgetsWithSpent, getFinancialSummary, getRecentTransactions } from '@/db/queries/financials';
import { useAppStore } from '@/stores/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

import { useAppTheme } from '@/hooks/useAppTheme';

export default function DashboardScreen() {
  const { colors, isDark } = useAppTheme();

  const { userName, currency } = useAppStore();

  const [summary, setSummary] = useState({ netBalance: 0, totalIncome: 0, totalExpense: 0, savingsRate: 0 });
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
  const [activeBudgets, setActiveBudgets] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const formatLocalDate = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      const summaryData = await getFinancialSummary(formatLocalDate(startOfMonth), formatLocalDate(endOfMonth));
      const transactionsData = await getRecentTransactions(5);
      const budgetsData = await getBudgetsWithSpent();

      setSummary(summaryData);
      setRecentTransactions(transactionsData as any[]);
      setActiveBudgets(budgetsData);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
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

        {/* Hero Balance Card */}
        <GradientCard colors={!isDark ? ['#6C5CE7', '#8E2DE2'] : ['#1A1A2E', '#16213E']} style={styles.heroCard}>
          <Text style={styles.heroLabel}>Net Wealth</Text>
          <AmountDisplay amount={summary.netBalance} currency={currency} style={styles.heroAmount} />

          <View style={styles.heroFooter}>
            <View style={styles.heroFooterItem}>
              <Ionicons name="arrow-up-circle-sharp" size={20} color="#55EFC4" />
              <View style={styles.heroFooterTextCol}>
                <Text style={styles.heroFooterLabel}>Savings Rate</Text>
                <Text style={styles.heroFooterVal}>{Math.round(summary.savingsRate)}%</Text>
              </View>
            </View>
          </View>
        </GradientCard>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} padding={14}>
            <View style={styles.statIconRow}>
              <View style={[styles.statIconBg, { backgroundColor: '#55EFC415' }]}>
                <Ionicons name="arrow-down" size={16} color="#00B894" />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Income</Text>
            </View>
            <AmountDisplay amount={summary.totalIncome} type="income" currency={currency} style={styles.statAmount} />
          </Card>

          <Card style={styles.statCard} padding={14}>
            <View style={styles.statIconRow}>
              <View style={[styles.statIconBg, { backgroundColor: '#FF767515' }]}>
                <Ionicons name="arrow-up" size={16} color="#FF6B6B" />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expenses</Text>
            </View>
            <AmountDisplay amount={summary.totalExpense} type="expense" currency={currency} style={styles.statAmount} />
          </Card>
        </View>

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    textTransform: 'uppercase',
  },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 24,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  heroFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroFooterTextCol: {
    marginLeft: 8,
  },
  heroFooterLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  heroFooterVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginVertical: 0,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  budgetCard: {
    width: 200,
    marginVertical: 0,
    marginBottom: 24
  },
  budgetCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetTextCol: {
    flex: 1,
    marginRight: 8,
  },
  budgetName: {
    fontSize: 15,
    fontWeight: '700',
  },
  budgetDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  budgetAmountText: {
    fontSize: 11,
  },
  budgetLimitAmount: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  emptyCta: {
    marginTop: 16,
    width: '100%',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txTextCol: {
    flex: 1,
    marginRight: 12,
  },
  txMerchant: {
    fontSize: 15,
    fontWeight: '600',
  },
  txDate: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
});
