import { AmountDisplay, Button, Card, GradientCard, ProgressRing } from '@/components/ui';
import { useAppStore } from '@/stores/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View, Platform, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './index.styles';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';

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
    selectedMonth,
    setSelectedMonth,
    summary,
    recentTransactions,
    activeBudgets,
    refreshing,
    loadData,
    handlePrevMonth,
    handleNextMonth,
    handleRefresh,
  } = useDashboardData();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const now = new Date();
  const isCurrentMonth =
    selectedMonth.getFullYear() === now.getFullYear() &&
    selectedMonth.getMonth() === now.getMonth();

  const handleResetMonth = () => {
    setSelectedMonth(new Date());
  };

  useFocusEffect(
    useCallback(() => {
      loadData(selectedMonth);
    }, [loadData, selectedMonth])
  );

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date && event.type !== 'dismissed') {
      setSelectedMonth(date);
    }
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
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

        {/* Month Selector Row */}
        <View style={styles.monthSelectorRow}>
          <Pressable
            onPress={handlePrevMonth}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            style={({ pressed }) => [
              styles.monthArrow,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>

          <View style={styles.monthTextWrapper}>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              accessibilityRole="button"
              accessibilityLabel={`Select month: ${selectedMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`}
              style={styles.monthTextContainer}
            >
              <Text style={[styles.monthLabelText, { color: colors.text }]}>
                {selectedMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Text>
              <Ionicons name="calendar-outline" size={14} color={colors.primary} style={styles.calendarIcon} />
            </Pressable>

            {!isCurrentMonth && (
              <Pressable
                onPress={handleResetMonth}
                style={[styles.resetButton, { backgroundColor: colors.primary + '15' }]}
                accessibilityRole="button"
                accessibilityLabel="Reset to current month"
              >
                <Ionicons name="refresh" size={14} color={colors.primary} />
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={handleNextMonth}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            style={({ pressed }) => [
              styles.monthArrow,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </View>

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

      {showDatePicker && Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.pickerModalContainer}>
            <Pressable style={styles.overlay} onPress={() => setShowDatePicker(false)} />
            <View style={[styles.pickerModalContent, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Month</Text>
                <Pressable onPress={() => setShowDatePicker(false)} style={styles.doneButton}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={selectedMonth}
                mode="date"
                display="inline"
                onChange={handleDateChange}
                themeVariant={isDark ? 'dark' : 'light'}
              />
            </View>
          </View>
        </Modal>
      )}

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedMonth}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
}


