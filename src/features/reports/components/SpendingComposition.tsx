import React from 'react';
import { View } from 'react-native';
import { Card, SectionTitleWithInfo } from '@/components/ui';
import { DonutChart } from '@/components/charts';
import { CategorySpend } from '../hooks/useReportData';
import { styles } from '../styles/reports.styles';

interface SpendingCompositionProps {
  totalExpense: number;
  categoryBreakdown: CategorySpend[];
  currencySymbol: string;
  currency: string;
}

export const SpendingComposition: React.FC<SpendingCompositionProps> = ({
  totalExpense,
  categoryBreakdown,
  currencySymbol,
  currency,
}) => {
  if (totalExpense <= 0) return null;

  return (
    <View style={styles.chartContainer}>
      <SectionTitleWithInfo
        title="Spending Composition"
        info="Shows how your total spending is distributed across categories for the selected period."
      />
      <Card padding={16}>
        <DonutChart
          data={categoryBreakdown.map((item) => ({
            value: item.total,
            color: item.color,
            label: item.name,
          }))}
          centerLabelTitle={`${currency} ${totalExpense.toFixed(0)}`}
          centerLabelSubtitle="Total Spend"
          currencySymbol={currencySymbol}
        />
      </Card>
    </View>
  );
};
