import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Card, ProgressRing, AmountDisplay } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/stores/useAppStore';
import { styles } from '../styles/budgets.styles';

interface BudgetCardProps {
  budget: {
    id: string;
    name: string;
    amount: number;
    period: string;
    spent: number;
    progress: number;
  };
  onPress: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onPress }) => {
  const { colors } = useAppTheme();
  const { currency } = useAppStore();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Edit budget ${budget.name}`}
      accessibilityRole="button"
    >
      <Card style={styles.progressCard} padding={16}>
        <View style={styles.budgetRow}>
          <ProgressRing progress={budget.progress} size={70} strokeWidth={8} />

          <View style={styles.budgetRight}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                {budget.name}
              </Text>
              <Text
                style={[
                  styles.budgetPeriodBadge,
                  { backgroundColor: colors.border + '50', color: colors.textSecondary },
                ]}
              >
                {budget.period.toUpperCase()}
              </Text>
            </View>

            <View style={styles.amountBreakdown}>
              <View>
                <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Spent</Text>
                <AmountDisplay
                  amount={budget.spent}
                  type="expense"
                  currency={currency}
                  style={styles.amountVal}
                />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Limit</Text>
                <AmountDisplay amount={budget.amount} currency={currency} style={styles.limitVal} />
              </View>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
};
