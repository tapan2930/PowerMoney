import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, AmountDisplay } from '@/components/ui';
import { formatTimeWithAt } from '@/utils/date';
import { styles } from '../styles/dashboard.styles';
import { DashboardUpcomingRecurring } from '../hooks/useDashboardData';

interface UpcomingRecurringListProps {
  upcomingRecurring: DashboardUpcomingRecurring[];
  currency: string;
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
  };
}

export const UpcomingRecurringList: React.FC<UpcomingRecurringListProps> = ({
  upcomingRecurring,
  currency,
  colors,
}) => {
  const handleSeeAllPress = () => router.push('/recurring-transactions');
  const handleAddRecurringPress = () => router.push('/add-recurring-transaction');

  const handleItemPress = (id: string) => {
    router.push({ pathname: '/add-recurring-transaction', params: { id } });
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return 'Recurring';
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Recurring</Text>
        <Button
          label="See All"
          onPress={handleSeeAllPress}
          variant="ghost"
          size="sm"
          accessibilityLabel="See all recurring transactions"
          accessibilityRole="button"
        />
      </View>

      {upcomingRecurring.length === 0 ? (
        <Card style={styles.emptyCard} padding={24}>
          <Ionicons name="repeat-outline" size={48} color={colors.textSecondary + '60'} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No upcoming recurring bills/transfers</Text>
          <Button
            label="Add Recurring"
            onPress={handleAddRecurringPress}
            variant="primary"
            size="sm"
            style={styles.emptyCta}
            accessibilityLabel="Add new recurring transaction"
            accessibilityRole="button"
          />
        </Card>
      ) : (
        <View style={styles.upcomingListContainer}>
          {upcomingRecurring.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleItemPress(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Edit recurring item ${item.merchant || item.description || ''}`}
            >
              <Card style={styles.txRow} padding={12}>
                <View style={styles.txLeft}>
                  <View style={[styles.txIconContainer, { backgroundColor: colors.primary + '15' }]}>
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
                      Next: {item.nextRunDate}{formatTimeWithAt(item.preferredTime)} • {getFrequencyLabel(item.frequency)}
                    </Text>
                  </View>
                </View>
                <AmountDisplay
                  amount={item.amount}
                  type={item.type === 'income' ? 'income' : 'expense'}
                  currency={currency}
                  style={styles.txAmount}
                />
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};
