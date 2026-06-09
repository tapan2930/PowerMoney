import { Button, Card } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { RecurringTransactionCard } from '@/features/recurring/components/RecurringTransactionCard';
import { useRecurringTransactions } from '@/features/recurring/hooks/useRecurringTransactions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Haptics } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecurringTransactionsScreen() {
  const { colors } = useAppTheme();
  const {
    items,
    isLoading,
    loadRecurringTransactions,
    toggleActive,
    deleteRecurring,
  } = useRecurringTransactions();

  useFocusEffect(
    useCallback(() => {
      loadRecurringTransactions();
    }, [loadRecurringTransactions])
  );

  const handlePress = (id: string) => {
    router.push({ pathname: '/add-recurring-transaction', params: { id } });
  };

  const handleToggle = (id: string, isActive: boolean) => {
    Haptics.selection();
    toggleActive(id, isActive);
  };

  const handleAdd = () => {
    router.push('/add-recurring-transaction');
  };

  const activeItems = items.filter(i => i.isActive !== false);
  const pausedItems = items.filter(i => i.isActive === false);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          label=""
          onPress={() => router.back()}
          variant="outline"
          size="sm"
          leftIcon={<Ionicons name="arrow-back" size={20} color={colors.text} />}
          style={styles.backBtn}
        />
        <Text style={[styles.title, { color: colors.text }]}>Recurring</Text>
        <Button
          label=""
          onPress={handleAdd}
          variant="primary"
          size="sm"
          leftIcon={<Ionicons name="add" size={20} color="#FFF" />}
          style={styles.addBtn}
        />
      </View>

      {items.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <Card style={styles.emptyCard} padding={32}>
            <Ionicons name="repeat-outline" size={56} color={colors.textSecondary + '50'} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Recurring Transactions
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Set up automatic transactions that repeat on a schedule — rent, subscriptions, salary, and more.
            </Text>
            <Button
              label="Create Recurring Transaction"
              onPress={handleAdd}
              variant="primary"
              style={styles.emptyCta}
            />
          </Card>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Active Section */}
          {activeItems.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Active ({activeItems.length})
              </Text>
              {activeItems.map(item => (
                <RecurringTransactionCard
                  key={item.id}
                  item={item}
                  onPress={handlePress}
                  onToggle={handleToggle}
                />
              ))}
            </View>
          )}

          {/* Paused Section */}
          {pausedItems.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Paused ({pausedItems.length})
              </Text>
              {pausedItems.map(item => (
                <RecurringTransactionCard
                  key={item.id}
                  item={item}
                  onPress={handlePress}
                  onToggle={handleToggle}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  backBtn: {
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  addBtn: {
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.two,
    paddingLeft: Spacing.one,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  emptyCard: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: Spacing.two,
  },
  emptyDesc: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: Spacing.three,
    alignSelf: 'stretch',
  },
});
