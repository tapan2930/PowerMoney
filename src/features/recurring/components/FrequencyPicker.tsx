import { SegmentedControl } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Haptics } from '@/utils/haptics';
import { formatRecurrenceLabel, type RecurrenceFrequency } from '../types';

interface FrequencyPickerProps {
  frequency: RecurrenceFrequency;
  interval: number;
  onFrequencyChange: (frequency: RecurrenceFrequency) => void;
  onIntervalChange: (interval: number) => void;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily' as const, label: 'Daily', icon: 'today-outline' },
  { value: 'weekly' as const, label: 'Weekly', icon: 'calendar-outline' },
  { value: 'monthly' as const, label: 'Monthly', icon: 'calendar-number-outline' },
  { value: 'yearly' as const, label: 'Yearly', icon: 'globe-outline' },
];

export function FrequencyPicker({
  frequency,
  interval,
  onFrequencyChange,
  onIntervalChange,
}: FrequencyPickerProps) {
  const { colors } = useAppTheme();

  const handleDecrement = () => {
    if (interval > 1) {
      Haptics.selection();
      onIntervalChange(interval - 1);
    }
  };

  const handleIncrement = () => {
    if (interval < 365) {
      Haptics.selection();
      onIntervalChange(interval + 1);
    }
  };

  const previewLabel = formatRecurrenceLabel(frequency, interval);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Frequency
      </Text>

      <SegmentedControl
        options={FREQUENCY_OPTIONS}
        selectedValue={frequency}
        onChange={onFrequencyChange}
      />

      {/* Interval counter */}
      <View style={[styles.intervalRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.intervalLabel, { color: colors.text }]}>
          Repeat every
        </Text>
        <View style={styles.counterGroup}>
          <Pressable
            onPress={handleDecrement}
            style={({ pressed }) => [
              styles.counterBtn,
              { backgroundColor: colors.backgroundElement, opacity: pressed ? 0.7 : 1 },
              interval <= 1 && styles.counterBtnDisabled,
            ]}
            disabled={interval <= 1}
            accessibilityRole="button"
            accessibilityLabel="Decrease interval"
          >
            <Ionicons name="remove" size={18} color={interval <= 1 ? colors.textSecondary + '40' : colors.primary} />
          </Pressable>

          <View style={[styles.counterValueContainer, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.counterValue, { color: colors.text }]}>
              {interval}
            </Text>
          </View>

          <Pressable
            onPress={handleIncrement}
            style={({ pressed }) => [
              styles.counterBtn,
              { backgroundColor: colors.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Increase interval"
          >
            <Ionicons name="add" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Preview label */}
      <View style={[styles.previewRow, { backgroundColor: colors.primary + '10' }]}>
        <Ionicons name="repeat-outline" size={16} color={colors.primary} />
        <Text style={[styles.previewText, { color: colors.primary }]}>
          {previewLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    paddingLeft: Spacing.one,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
  },
  intervalLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  counterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  counterValueContainer: {
    minWidth: 44,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  counterValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
