import React, { useState } from 'react';
import { View, StyleSheet, Text, useColorScheme, Pressable } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Colors } from '@/constants/theme';
import { Haptics } from '@/utils/haptics';

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
  currencySymbol?: string;
}

export function DonutChart({
  data,
  centerLabelTitle = '',
  centerLabelSubtitle = '',
  size = 180,
  currencySymbol = '$',
}: DonutChartProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartData = data.map((d, index) => ({
    value: d.value,
    color: d.color,
    label: d.label,
    focused: index === selectedIdx,
  }));

  const innerRadius = size / 2 - 24;

  const handlePress = (index: number) => {
    Haptics.selection();
    if (selectedIdx === index) {
      setSelectedIdx(null);
    } else {
      setSelectedIdx(index);
    }
  };

  const renderCenterLabel = () => {
    if (selectedIdx !== null && selectedIdx >= 0 && selectedIdx < data.length) {
      const selected = data[selectedIdx];
      const pct = total > 0 ? (selected.value / total) * 100 : 0;
      return (
        <Pressable
          style={styles.centerLabel}
          onPress={() => setSelectedIdx(null)}
          accessibilityRole="button"
          accessibilityLabel="Reset chart selection"
        >
          <Text style={[styles.centerCategoryName, { color: selected.color }]} numberOfLines={1}>
            {selected.label || 'Category'}
          </Text>
          <Text style={[styles.centerCategoryAmount, { color: colors.text }]} numberOfLines={1}>
            {currencySymbol}{selected.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.centerCategoryPercent, { color: colors.textSecondary }]}>
            {pct.toFixed(1)}% of total
          </Text>
        </Pressable>
      );
    }

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
  };

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
        onPress={(_item: any, index: number) => handlePress(index)}
        centerLabelComponent={renderCenterLabel}
      />

      {/* Interactive Legend Grid inside the Card */}
      <View style={styles.legendContainer}>
        {data.slice(0, 4).map((item, index) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          const isSelected = selectedIdx === index;
          return (
            <Pressable
              key={index}
              style={[
                styles.legendItem,
                isSelected && { backgroundColor: item.color + '15', borderRadius: 8 }
              ]}
              onPress={() => handlePress(index)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${item.label} category`}
            >
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={[styles.legendPercent, { color: colors.textSecondary }]}>
                {pct.toFixed(0)}%
              </Text>
            </Pressable>
          );
        })}
        {data.length > 4 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.textSecondary + '40' }]} />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]} numberOfLines={1}>
              Others
            </Text>
            <Text style={[styles.legendPercent, { color: colors.textSecondary }]}>
              {((data.slice(4).reduce((sum, item) => sum + item.value, 0) / total) * 100).toFixed(0)}%
            </Text>
          </View>
        )}
      </View>
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
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  centerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  centerCategoryName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  centerCategoryAmount: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
  },
  centerCategoryPercent: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  legendPercent: {
    fontSize: 11,
    fontWeight: '600',
  },
});
