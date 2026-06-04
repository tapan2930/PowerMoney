import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { BarChart as GiftedBarChart } from 'react-native-gifted-charts';
import { Colors } from '@/constants/theme';

interface BarChartData {
  value: number;
  label: string;
  frontColor: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  barWidth?: number;
}

export function BarChart({
  data,
  height = 200,
  barWidth = 24,
}: BarChartProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const chartData = data.map((d) => ({
    value: d.value,
    label: d.label,
    frontColor: d.frontColor,
    topLabelComponent: () => null,
  }));

  return (
    <View style={styles.container}>
      <GiftedBarChart
        data={chartData}
        barWidth={barWidth}
        noOfSections={4}
        height={height}
        spacing={24}
        barBorderRadius={6}
        xAxisThickness={1}
        xAxisColor={colors.border}
        yAxisThickness={0}
        yAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }}
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }}
        rulesColor={colors.border + '15'}
        hideRules={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingRight: 10,
    alignItems: 'center',
  },
});
