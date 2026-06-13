import React from 'react';
import { View, Text } from 'react-native';
import { Card, AmountDisplay, ProgressBar } from '@/components/ui';
import { styles } from '../styles/reports.styles';

interface CashflowOverviewCardProps {
  savings: number;
  currency: string;
  netSavingsRate: number;
  totalIncome: number;
  totalExpense: number;
  colors: {
    textSecondary: string;
    primary: string;
  };
}

export const CashflowOverviewCard: React.FC<CashflowOverviewCardProps> = ({
  savings,
  currency,
  netSavingsRate,
  totalIncome,
  totalExpense,
  colors,
}) => {
  return (
    <Card style={styles.cashflowCard} padding={20}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Cash Flow Overview</Text>
      <AmountDisplay amount={savings} currency={currency} style={styles.cashflowBalance} />
      <Text style={[styles.cashflowSubtitle, { color: colors.textSecondary }]}>
        Net savings for this period
      </Text>

      <View style={styles.progressMetrics}>
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Savings Rate</Text>
          <Text style={[styles.metricVal, { color: colors.primary }]}>
            {Math.round(netSavingsRate)}%
          </Text>
        </View>
        <ProgressBar progress={Math.max(0, Math.min(netSavingsRate / 100, 1))} height={6} />
      </View>

      <View style={styles.inOutStats}>
        <View style={styles.inOutCol}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>INFLOW</Text>
          <AmountDisplay amount={totalIncome} type="income" currency={currency} style={styles.statVal} />
        </View>
        <View style={styles.inOutCol}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>OUTFLOW</Text>
          <AmountDisplay amount={totalExpense} type="expense" currency={currency} style={styles.statVal} />
        </View>
      </View>
    </Card>
  );
};
