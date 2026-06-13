import React from 'react';
import { View, Text } from 'react-native';
import { Card, SectionTitleWithInfo, AmountDisplay } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { CategorySpend } from '../hooks/useReportData';
import { styles } from '../styles/reports.styles';

interface SpendingBreakdownListProps {
  categoryBreakdown: CategorySpend[];
  currency: string;
  colors: {
    text: string;
    textSecondary: string;
    border: string;
  };
}

export const SpendingBreakdownList: React.FC<SpendingBreakdownListProps> = ({
  categoryBreakdown,
  currency,
  colors,
}) => {
  return (
    <View style={styles.breakdownSection}>
      <SectionTitleWithInfo
        title="Spending Breakdown"
        info="Ranked list of all expense categories with their share of total spending for the selected period."
      />
      {categoryBreakdown.length === 0 ? (
        <Card style={styles.emptyCard} padding={24}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary + '60'} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No spending data logged for this period.
          </Text>
        </Card>
      ) : (
        <View>
          {categoryBreakdown.map((item) => (
            <Card key={item.id} style={styles.breakdownItem} padding={14}>
              <View style={styles.itemHeader}>
                <View style={styles.itemLeft}>
                  <View style={[styles.iconBg, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
                </View>
                <View style={styles.itemRight}>
                  <AmountDisplay amount={item.total} type="expense" currency={currency} style={styles.itemAmount} />
                  <Text style={[styles.itemPercent, { color: colors.textSecondary }]}>
                    {Math.round(item.percentage)}%
                  </Text>
                </View>
              </View>

              {/* Progress bar with category matching color */}
              <View style={[styles.barBg, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
};
