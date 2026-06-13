import React from 'react';
import { View, Text } from 'react-native';
import { GradientCard, AmountDisplay } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/dashboard.styles';
import { DashboardSummary } from '../hooks/useDashboardData';

interface NetWealthCardProps {
  summary: DashboardSummary;
  currency: string;
  isDark: boolean;
}

export const NetWealthCard: React.FC<NetWealthCardProps> = ({ summary, currency, isDark }) => {
  const cardGradientColors = !isDark ? ['#6C5CE7', '#8E2DE2'] : ['#1A1A2E', '#16213E'];

  return (
    <GradientCard colors={cardGradientColors} style={styles.heroCard} padding={16}>
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
  );
};
