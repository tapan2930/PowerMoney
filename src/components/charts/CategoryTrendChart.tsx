import React, { useRef } from 'react';
import { View, StyleSheet, Text, useColorScheme, Dimensions } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';
import { Colors } from '@/constants/theme';
import { Haptics } from '@/utils/haptics';

function hexToRgba(hex: string, alpha: number = 1): string {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    return hex;
  }
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface CategoryTrendSeries {
  name: string;
  color: string;
  data: { value: number; label: string }[];
}

interface CategoryTrendChartProps {
  series: CategoryTrendSeries[];
  height?: number;
  currencySymbol?: string;
  onInteractionChange?: (active: boolean) => void;
}

export function CategoryTrendChart({
  series,
  height = 180,
  currencySymbol = '$',
  onInteractionChange,
}: CategoryTrendChartProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const lastHoveredKey = useRef<string | null>(null);

  if (series.length === 0) return null;

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;

  // The primary dataset is the first series
  const primarySeries = series[0];
  const pointCount = primarySeries.data.length;
  const calculatedSpacing = pointCount > 1 ? chartWidth / (pointCount - 1) : chartWidth;

  // Find global max across all series for consistent Y scale
  const maxVal = Math.max(
    ...series.flatMap((s) => s.data.map((d) => d.value)),
    1
  );

  // Build dataSet array for multi-line support
  const dataSet = series.map((s) => {
    // Ensure at least 2 data points per series to prevent SVG/Animated crashes
    const safeData = s.data.length > 1
      ? s.data
      : s.data.length === 1
        ? [s.data[0], { ...s.data[0] }]
        : [{ value: 0, label: '' }, { value: 0, label: '' }];

    return {
      data: safeData.map((d) => ({
        value: d.value,
        label: d.label,
        categoryName: s.name,
        color: s.color,
      })),
      color: hexToRgba(s.color, 1),
      startFillColor: hexToRgba(s.color, 0.15),
      endFillColor: hexToRgba(s.color, 0),
      startOpacity: 0.15,
      endOpacity: 0,
      thickness: 2.5,
    };
  });

  return (
    <View
      style={styles.container}
      onTouchStart={() => onInteractionChange?.(true)}
      onTouchEnd={() => onInteractionChange?.(false)}
      onTouchCancel={() => onInteractionChange?.(false)}
    >
      <GiftedLineChart
        dataSet={dataSet}
        height={height}
        width={chartWidth}
        areaChart
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisLabelWidth={0}
        hideRules
        hideYAxisText
        hideAxesAndRules
        hideDataPoints
        spacing={calculatedSpacing}
        initialSpacing={0}
        endSpacing={0}
        maxValue={maxVal * 1.15}
        curved
        curvature={0.15}
        isAnimated
        animateOnDataChange
        animationDuration={500}
        animateTogether
        // Interactive tooltips configuration
        pointerConfig={{
          pointerStripUptoDataPoint: true,
          pointerStripColor: colors.primary,
          pointerStripWidth: 1.5,
          strokeDashArray: [2, 4],
          pointerColor: colors.primary,
          radius: 5,
          pointerLabelWidth: 180,
          pointerLabelHeight: 120,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: any[]) => {
            if (!items || items.length === 0) {
              lastHoveredKey.current = null;
              return null;
            }

            // Get month label from first item
            const monthLabel = items[0]?.label || '';

            // Trigger soft selection haptic on new point hover
            if (monthLabel && monthLabel !== lastHoveredKey.current) {
              lastHoveredKey.current = monthLabel;
              Haptics.selection();
            }

            // Sort items by value descending
            const sortedItems = [...items]
              .filter(item => typeof item?.value === 'number')
              .sort((a, b) => b.value - a.value);

            return (
              <View
                style={[
                  styles.tooltip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowColor: colors.text,
                  },
                ]}
              >
                <Text style={[styles.tooltipTitle, { color: colors.textSecondary }]}>
                  {monthLabel} Spending
                </Text>
                {sortedItems.map((item, index) => {
                  const categoryName = item.categoryName || 'Other';
                  const color = item.color || colors.primary;
                  const valStr = `${currencySymbol}${item.value.toFixed(0)}`;
                  return (
                    <View key={index} style={styles.tooltipRow}>
                      <View style={[styles.dot, { backgroundColor: color }]} />
                      <Text style={[styles.tooltipText, { color: colors.text }]} numberOfLines={1}>
                        {categoryName}
                      </Text>
                      <Text style={[styles.tooltipValue, { color: colors.text }]}>
                        {valStr}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          },
        }}
      />

      {/* Legend */}
      <View style={styles.legend}>
        {series.map((s) => (
          <View key={s.name} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text
              style={[styles.legendText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {s.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tooltip: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 160,
  },
  tooltipTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  tooltipValue: {
    fontSize: 11,
    fontWeight: '700',
  },
});
