import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';
import { Colors } from '@/constants/theme';

interface LineChartData {
  value: number;
  label: string;
}

interface LineChartProps {
  data: LineChartData[];
  height?: number;
  color?: string;
}

export function LineChart({
  data,
  height = 180,
  color,
}: LineChartProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const strokeColor = color || colors.primary;

  const chartData = data.map((d) => ({
    value: d.value,
    label: d.label,
  }));

  return (
    <View style={styles.container}>
      <GiftedLineChart
        data={chartData}
        height={height}
        color={strokeColor}
        thickness={3}
        startFillColor={strokeColor}
        endFillColor={strokeColor + '00'}
        startOpacity={0.3}
        endOpacity={0}
        noOfSections={4}
        xAxisColor={colors.border}
        yAxisThickness={0}
        xAxisThickness={1}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }}
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }}
        rulesColor={colors.border + '15'}
        rulesType="solid"
        hideDataPoints
        areaChart
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
