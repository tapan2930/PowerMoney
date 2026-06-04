import React from 'react';
import { View, StyleSheet, Text, useColorScheme } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Colors } from '@/constants/theme';

interface DonutChartData {
  value: number;
  color: string;
  label?: string;
  focused?: boolean;
}

interface DonutChartProps {
  data: DonutChartData[];
  centerLabelTitle?: string;
  centerLabelSubtitle?: string;
  size?: number;
}

export function DonutChart({
  data,
  centerLabelTitle = '',
  centerLabelSubtitle = '',
  size = 180,
}: DonutChartProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const chartData = data.map((d) => ({
    value: d.value,
    color: d.color,
    label: d.label,
    focused: d.focused,
  }));

  const innerRadius = size / 2 - 24;

  return (
    <View style={styles.container}>
      <PieChart
        data={chartData}
        donut
        showGradient
        sectionAutoFocus
        radius={size / 2}
        innerRadius={innerRadius}
        innerCircleColor={colors.surface}
        centerLabelComponent={() => {
          return (
            <View style={styles.centerLabel}>
              <Text style={[styles.centerTitle, { color: colors.text }]} numberOfLines={1}>
                {centerLabelTitle}
              </Text>
              <Text style={[styles.centerSubtitle, { color: colors.textSecondary }]}>
                {centerLabelSubtitle}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  centerLabel: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  centerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
