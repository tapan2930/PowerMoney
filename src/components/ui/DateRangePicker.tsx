import { BottomSheet, BottomSheetScrollView } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { DateTimePicker, DateTimePickerEvent } from '@expo/ui/community/datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD
  onApply: (start: string | null, end: string | null) => void;
}

const formatDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const r = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${r}`;
};

export function DateRangePicker({
  visible,
  onClose,
  startDate,
  endDate,
  onApply,
}: DateRangePickerProps) {
  const { colors, isDark } = useAppTheme();
  const [localStart, setLocalStart] = useState<string | null>(startDate);
  const [localEnd, setLocalEnd] = useState<string | null>(endDate);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setLocalStart(startDate);
      setLocalEnd(endDate);
    }
  }, [visible, startDate, endDate]);

  const handleApply = () => {
    onApply(localStart, localEnd);
    onClose();
  };

  const applyPreset = (preset: 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear' | 'all') => {
    const now = new Date();
    if (preset === 'all') {
      setLocalStart(null);
      setLocalEnd(null);
      return;
    }

    let start: Date;
    let end: Date = new Date();

    switch (preset) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last3Months':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
    }

    setLocalStart(formatDate(start));
    setLocalEnd(formatDate(end));
  };

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      const adjustedDate = Platform.OS === 'android'
        ? new Date(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate())
        : selectedDate;
      setLocalStart(formatDate(adjustedDate));
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      const adjustedDate = Platform.OS === 'android'
        ? new Date(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate())
        : selectedDate;
      setLocalEnd(formatDate(adjustedDate));
    }
  };

  const formatDateDisplay = (dateString: string | null) => {
    if (!dateString) return 'Select Date';
    return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const currentStartDateObj = localStart ? new Date(localStart + 'T00:00:00') : new Date();
  const currentEndDateObj = localEnd ? new Date(localEnd + 'T00:00:00') : new Date();

  const pickerStartDateObj = Platform.OS === 'android'
    ? new Date(Date.UTC(currentStartDateObj.getFullYear(), currentStartDateObj.getMonth(), currentStartDateObj.getDate()))
    : currentStartDateObj;

  const pickerEndDateObj = Platform.OS === 'android'
    ? new Date(Date.UTC(currentEndDateObj.getFullYear(), currentEndDateObj.getMonth(), currentEndDateObj.getDate()))
    : currentEndDateObj;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Select Date Range</Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close picker"
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Quick Presets</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.presetRow}
          contentContainerStyle={styles.presetContentContainer}
        >
          <Pressable
            onPress={() => applyPreset('thisMonth')}
            accessibilityRole="button"
            accessibilityLabel="Filter by this month"
            style={({ pressed }) => [
              styles.presetButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.presetText, { color: colors.text }]}>This Month</Text>
          </Pressable>
          <Pressable
            onPress={() => applyPreset('lastMonth')}
            accessibilityRole="button"
            accessibilityLabel="Filter by last month"
            style={({ pressed }) => [
              styles.presetButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.presetText, { color: colors.text }]}>Last Month</Text>
          </Pressable>
          <Pressable
            onPress={() => applyPreset('last3Months')}
            accessibilityRole="button"
            accessibilityLabel="Filter by last 3 months"
            style={({ pressed }) => [
              styles.presetButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.presetText, { color: colors.text }]}>Last 3 Mos</Text>
          </Pressable>
          <Pressable
            onPress={() => applyPreset('thisYear')}
            accessibilityRole="button"
            accessibilityLabel="Filter by this year"
            style={({ pressed }) => [
              styles.presetButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.presetText, { color: colors.text }]}>This Year</Text>
          </Pressable>
          <Pressable
            onPress={() => applyPreset('all')}
            accessibilityRole="button"
            accessibilityLabel="Filter by all time"
            style={({ pressed }) => [
              styles.presetButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.presetText, { color: colors.text }]}>All Time</Text>
          </Pressable>
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Custom Date Range</Text>
        <View style={styles.customContainer}>
          <View style={styles.dateFieldWrapper}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Start Date</Text>
            <Pressable
              onPress={() => setShowStartPicker(true)}
              accessibilityRole="button"
              accessibilityLabel={`Start date: ${formatDateDisplay(localStart)}`}
              style={({ pressed }) => [
                styles.dateField,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.dateText, { color: localStart ? colors.text : `${colors.textSecondary}80` }]}>
                {formatDateDisplay(localStart)}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.dateFieldWrapper}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>End Date</Text>
            <Pressable
              onPress={() => setShowEndPicker(true)}
              accessibilityRole="button"
              accessibilityLabel={`End date: ${formatDateDisplay(localEnd)}`}
              style={({ pressed }) => [
                styles.dateField,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.dateText, { color: localEnd ? colors.text : `${colors.textSecondary}80` }]}>
                {formatDateDisplay(localEnd)}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <Button
          label="Apply Range"
          onPress={handleApply}
          variant="primary"
          size="lg"
          style={styles.applyButton}
        />
      </BottomSheetScrollView>

      {/* Start Date Picker (iOS inline Modal / Android native) */}
      {showStartPicker && Platform.OS === 'ios' && (
        <Modal
          visible={showStartPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowStartPicker(false)}
        >
          <View style={styles.pickerModalContainer}>
            <Pressable style={styles.overlay} onPress={() => setShowStartPicker(false)} />
            <View style={[styles.pickerModalContent, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Start Date</Text>
                <Pressable onPress={() => setShowStartPicker(false)} style={styles.doneButton}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerStartDateObj}
                mode="date"
                display="inline"
                onChange={handleStartDateChange}
                themeVariant={isDark ? 'dark' : 'light'}
              />
            </View>
          </View>
        </Modal>
      )}

      {showStartPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerStartDateObj}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}

      {/* End Date Picker (iOS inline Modal / Android native) */}
      {showEndPicker && Platform.OS === 'ios' && (
        <Modal
          visible={showEndPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEndPicker(false)}
        >
          <View style={styles.pickerModalContainer}>
            <Pressable style={styles.overlay} onPress={() => setShowEndPicker(false)} />
            <View style={[styles.pickerModalContent, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select End Date</Text>
                <Pressable onPress={() => setShowEndPicker(false)} style={styles.doneButton}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerEndDateObj}
                mode="date"
                display="inline"
                onChange={handleEndDateChange}
                themeVariant={isDark ? 'dark' : 'light'}
              />
            </View>
          </View>
        </Modal>
      )}

      {showEndPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerEndDateObj}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: Spacing.one,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  presetRow: {
    marginHorizontal: -Spacing.four,
    marginBottom: Spacing.two,
  },
  presetContentContainer: {
    paddingHorizontal: Spacing.four,
  },
  presetButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginRight: Spacing.two,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '500',
  },
  customContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  dateFieldWrapper: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: Spacing.one,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: Spacing.three,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  applyButton: {
    marginTop: Spacing.three,
  },
  pickerModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  doneButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});
