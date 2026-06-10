import { Colors } from '@/constants/theme';
import { Haptics } from '@/utils/haptics';
import { useRef } from 'react';
import { Dimensions, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';

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

export interface ComparisonDataPoint {
  value: number;
  label?: string;
  tooltipLabel?: string;
}

interface ComparisonLineChartProps {
  currentData: ComparisonDataPoint[];
  previousData: ComparisonDataPoint[];
  height?: number;
  currencySymbol?: string;
  width?: number;
  onInteractionChange?: (active: boolean) => void;
}

export function ComparisonLineChart({
  currentData,
  previousData,
  height = 180,
  currencySymbol = '$',
  width,
  onInteractionChange,
}: ComparisonLineChartProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const lastHoveredKey = useRef<string | null>(null);

  // Fallback defaults if empty or single point to prevent SVG/Animated crashes
  const line1DataRaw = currentData.length > 1
    ? currentData
    : currentData.length === 1
      ? [currentData[0], { ...currentData[0] }]
      : [{ value: 0 }, { value: 0 }];

  const line2DataRaw = previousData.length > 1
    ? previousData
    : previousData.length === 1
      ? [previousData[0], { ...previousData[0] }]
      : [{ value: 0 }, { value: 0 }];

  // Map raw data with isCurrent property to style pointer dots
  const line1Data = line1DataRaw.map(d => ({ ...d, isCurrent: true }));
  const line2Data = line2DataRaw.map(d => ({ ...d, isCurrent: false }));

  // Find max value to configure vertical padding
  const maxVal = Math.max(
    ...line1Data.map((d) => d.value ?? 0),
    ...line2Data.map((d) => d.value ?? 0),
    1
  );

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = width ?? (screenWidth - 32); // Full width minus card margins (16 * 2)
  const maxPoints = Math.max(line1Data.length, line2Data.length);
  const calculatedSpacing = maxPoints > 1 ? chartWidth / (maxPoints - 1) : chartWidth;

  const dataSet = [
    {
      data: line2Data,
      color: hexToRgba(colors.textSecondary, 0.4),
      thickness: 2,
      startFillColor: hexToRgba(colors.textSecondary, 0.1),
      endFillColor: hexToRgba(colors.textSecondary, 0),
      startOpacity: 0.1,
      endOpacity: 0,
      hideDataPoints: true,
    },
    {
      data: line1Data,
      color: hexToRgba(colors.primary, 1),
      thickness: 3,
      startFillColor: hexToRgba(colors.primary, 0.2),
      endFillColor: hexToRgba(colors.primary, 0),
      startOpacity: 0.2,
      endOpacity: 0,
      hideDataPoints: true,
    },
  ];

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
        isAnimated
        animateOnDataChange
        animationDuration={500}
        animateTogether
        areaChart
        interpolateMissingValues={false}
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisLabelWidth={0}
        xAxisLabelsHeight={0}
        hideRules
        hideYAxisText
        hideAxesAndRules
        spacing={calculatedSpacing}
        initialSpacing={0}
        endSpacing={0}
        maxValue={maxVal * 1.1}
        pointerConfig={{
          pointerStripUptoDataPoint: true,
          pointerStripColor: colors.primary,
          pointerStripWidth: 1.5,
          strokeDashArray: [2, 4],
          pointerColor: colors.primary,
          radius: 5,
          pointerLabelWidth: 160,
          pointerLabelHeight: 80,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerComponent: (item: any) => {
            // Safely return null if this dataset has no point at the active index
            if (!item || typeof item.value !== 'number') {
              return null;
            }
            return (
              <View
                style={{
                  height: 10,
                  width: 10,
                  borderRadius: 5,
                  backgroundColor: item.isCurrent ? colors.primary : colors.textSecondary,
                  borderWidth: 1.5,
                  borderColor: colors.surface,
                }}
              />
            );
          },
          pointerLabelComponent: (items: any[], secondItems: any[], pointerIndex: number) => {
            const currentItem = line1Data[pointerIndex];
            const prevItem = line2Data[pointerIndex];

            const title = currentItem?.tooltipLabel || prevItem?.tooltipLabel || '';
            const currentVal = currentItem?.value;
            const prevVal = prevItem?.value;

            // Trigger soft selection haptic on new point hover
            const hoverKey = prevItem?.tooltipLabel || currentItem?.tooltipLabel || '';
            if (hoverKey && hoverKey !== lastHoveredKey.current) {
              lastHoveredKey.current = hoverKey;
              Haptics.selection();
            }

            const currentValStr = (typeof currentVal === 'number')
              ? `${currencySymbol}${currentVal.toFixed(2)}`
              : '—';
            const prevValStr = (typeof prevVal === 'number')
              ? `${currencySymbol}${prevVal.toFixed(2)}`
              : '—';

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
                {title ? (
                  <Text style={[styles.tooltipTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                    {title}
                  </Text>
                ) : null}
                <View style={styles.tooltipRow}>
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.tooltipText, { color: colors.text }]} numberOfLines={1}>
                    Current: {currentValStr}
                  </Text>
                </View>
                <View style={styles.tooltipRow}>
                  <View style={[styles.dot, { backgroundColor: colors.textSecondary + '90' }]} />
                  <Text style={[styles.tooltipText, { color: colors.textSecondary }]} numberOfLines={1}>
                    Previous: {prevValStr}
                  </Text>
                </View>
              </View>
            );
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  tooltip: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 140,
    gap: 4,
  },
  tooltipTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
