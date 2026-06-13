import React, { useCallback } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Card, AmountDisplay, ProgressRing } from '@/components/ui';
import { styles } from '../styles/dashboard.styles';
import { DashboardBudget } from '../hooks/useDashboardData';

interface BudgetOverviewProps {
  activeBudgets: DashboardBudget[];
  currency: string;
  colors: {
    text: string;
    textSecondary: string;
  };
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({ activeBudgets, currency, colors }) => {
  const renderBudgetItem = useCallback(({ item }: { item: DashboardBudget }) => (
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
  ), [currency, colors.text, colors.textSecondary]);

  const keyExtractor = useCallback((item: DashboardBudget) => item.id, []);

  if (activeBudgets.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Budget Overview</Text>
      <FlatList
        horizontal
        data={activeBudgets}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        renderItem={renderBudgetItem}
      />
    </View>
  );
};
