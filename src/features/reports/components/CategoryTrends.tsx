import React from 'react';
import { View } from 'react-native';
import { Card, SectionTitleWithInfo } from '@/components/ui';
import { CategoryTrendChart } from '@/components/charts';
import { styles } from '../styles/reports.styles';

interface CategoryTrendSeries {
  name: string;
  color: string;
  data: { value: number; label: string }[];
}

interface CategoryTrendsProps {
  categoryTrendData: CategoryTrendSeries[];
  currencySymbol: string;
  onInteractionChange: (active: boolean) => void;
}

export const CategoryTrends: React.FC<CategoryTrendsProps> = ({
  categoryTrendData,
  currencySymbol,
  onInteractionChange,
}) => {
  if (categoryTrendData.length === 0) return null;

  return (
    <View style={styles.categoryTrendsWrapper}>
      <SectionTitleWithInfo
        title="Category Trends"
        info="Tracks how your top spending categories have changed over the last 6 months. Spot categories that are growing out of control before they become a habit."
      />
      <Card padding={0} style={styles.chartCardOverflow}>
        <CategoryTrendChart
          series={categoryTrendData}
          currencySymbol={currencySymbol}
          onInteractionChange={onInteractionChange}
        />
      </Card>
    </View>
  );
};
