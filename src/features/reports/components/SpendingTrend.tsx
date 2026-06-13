import React from 'react';
import { View, Text } from 'react-native';
import { Card, SectionTitleWithInfo, AmountDisplay } from '@/components/ui';
import { ComparisonLineChart } from '@/components/charts';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/reports.styles';

import { type ComparisonDataPoint } from '@/components/charts/ComparisonLineChart';

interface SpendingTrendProps {
  comparisonCurrentData: ComparisonDataPoint[];
  comparisonPreviousData: ComparisonDataPoint[];
  currencySymbol: string;
  currency: string;
  onInteractionChange: (active: boolean) => void;
  onLayout: (y: number) => void;
  colors: {
    textSecondary: string;
  };
}

export const SpendingTrend: React.FC<SpendingTrendProps> = ({
  comparisonCurrentData,
  comparisonPreviousData,
  currencySymbol,
  currency,
  onInteractionChange,
  onLayout,
  colors,
}) => {
  if (comparisonCurrentData.length === 0 && comparisonPreviousData.length === 0) return null;

  const currentTotal = comparisonCurrentData.length > 0 ? comparisonCurrentData[comparisonCurrentData.length - 1].value : 0;
  const previousTotal = comparisonPreviousData.length > 0 ? comparisonPreviousData[comparisonPreviousData.length - 1].value : 0;
  const diff = currentTotal - previousTotal;
  const percentageChange = previousTotal > 0 ? (diff / previousTotal) * 100 : 0;

  const isBetter = percentageChange <= 0;
  const badgeColor = isBetter ? '#55EFC415' : '#FF767515';
  const badgeTextColor = isBetter ? '#00B894' : '#FF6B6B';
  const badgeIcon = isBetter ? 'arrow-down-outline' : 'arrow-up-outline';

  return (
    <View style={styles.chartContainer} onLayout={(e) => onLayout(e.nativeEvent.layout.y)}>
      <SectionTitleWithInfo
        title="Spending Trend"
        info="Compares your cumulative spending trajectory against the previous equivalent period. A green badge means you're spending less than before."
      />
      <Card padding={0} style={styles.chartCardOverflow}>
        <View style={styles.trendHeaderWrapper}>
          <View style={styles.trendHeader}>
            <View>
              <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>Total Spent (vs Prev)</Text>
              <View style={styles.trendRow}>
                <AmountDisplay amount={currentTotal} currency={currency} style={styles.trendAmount} />
                <View style={[styles.trendBadge, { backgroundColor: badgeColor }]}>
                  <Ionicons name={badgeIcon as any} size={14} color={badgeTextColor} />
                  <Text style={[styles.trendBadgeText, { color: badgeTextColor }]}>
                    {Math.abs(percentageChange).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.trendCompareCol}>
              <Text style={[styles.compareLabel, { color: colors.textSecondary }]}>
                Prev: {currencySymbol}{previousTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>
        <ComparisonLineChart
          currentData={comparisonCurrentData}
          previousData={comparisonPreviousData}
          currencySymbol={currencySymbol}
          onInteractionChange={onInteractionChange}
        />
      </Card>
    </View>
  );
};
