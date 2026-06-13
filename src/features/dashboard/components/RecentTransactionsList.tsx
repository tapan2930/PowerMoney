import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, AmountDisplay } from '@/components/ui';
import { formatTimeWithAt } from '@/utils/date';
import { styles } from '../styles/dashboard.styles';
import { DashboardTransaction } from '../hooks/useDashboardData';

interface RecentTransactionsListProps {
  recentTransactions: DashboardTransaction[];
  currency: string;
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
  };
}

export const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({
  recentTransactions,
  currency,
  colors,
}) => {
  const handleSeeAllPress = () => router.push('/accounts');
  const handleLogTransactionPress = () => router.push('/add-transaction');

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        <Button
          label="See All"
          onPress={handleSeeAllPress}
          variant="ghost"
          size="sm"
          accessibilityLabel="See all recent activity"
          accessibilityRole="button"
        />
      </View>

      {recentTransactions.length === 0 ? (
        <Card style={styles.emptyCard} padding={24}>
          <Ionicons name="receipt-outline" size={48} color={colors.textSecondary + '60'} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions logged yet</Text>
          <Button
            label="Log Transaction"
            onPress={handleLogTransactionPress}
            variant="primary"
            size="sm"
            style={styles.emptyCta}
            accessibilityLabel="Log new transaction"
            accessibilityRole="button"
          />
        </Card>
      ) : (
        <View style={styles.recentTransactionsContainer}>
          {recentTransactions.map((item) => (
            <Card key={item.id} style={styles.txRow} padding={12}>
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
                  <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                    {item.date}{formatTimeWithAt(item.time)}
                  </Text>
                </View>
              </View>
              <AmountDisplay amount={item.amount} type={item.type} currency={currency} style={styles.txAmount} />
            </Card>
          ))}
        </View>
      )}
    </View>
  );
};
