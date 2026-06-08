import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { DateTimePicker, DateTimePickerEvent } from '@expo/ui/community/datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export interface FilterDateSectionProps {
  startDate: string | null;
  endDate: string | null;
  onChange: (start: string | null, end: string | null) => void;
}

const formatDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const r = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${r}`;
};

export function FilterDateSection({
  startDate,
  endDate,
  onChange,
}: FilterDateSectionProps) {
  const { colors, isDark } = useAppTheme();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const applyPreset = (preset: 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear' | 'all') => {
    const now = new Date();
    if (preset === 'all') {
      onChange(null, null);
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

    onChange(formatDate(start), formatDate(end));
  };

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      onChange(formatDate(selectedDate), endDate);
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      onChange(startDate, formatDate(selectedDate));
    }
  };

  const formatDateDisplay = (dateString: string | null, placeholder: string = 'Select Date') => {
    if (!dateString) return placeholder;
    return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const currentStartDateObj = startDate ? new Date(startDate + 'T00:00:00') : new Date();
  const currentEndDateObj = endDate ? new Date(endDate + 'T00:00:00') : new Date();

  return (
    <View style={[styles.container, { backgroundColor: colors.border + '30' }]}>
      {/* <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>Quick Presets</Text> */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.presetRow}
        contentContainerStyle={styles.presetContentContainer}
      >
        {(['thisMonth', 'lastMonth', 'last3Months', 'thisYear', 'all'] as const).map((preset) => {
          const labelMap = {
            thisMonth: 'This Month',
            lastMonth: 'Last Month',
            last3Months: 'Last 3 Mos',
            thisYear: 'This Year',
            all: 'All Time',
          };
          return (
            <Pressable
              key={preset}
              onPress={() => applyPreset(preset)}
              style={({ pressed }) => [
                styles.presetButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.presetText, { color: colors.text }]}>{labelMap[preset]}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>Custom Range</Text>
      <View style={styles.customDateContainer}>
        <View style={styles.dateFieldWrapper}>
          {/* <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Start Date</Text> */}
          <Pressable
            onPress={() => setShowStartPicker(true)}
            style={({ pressed }) => [
              styles.dateField,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.dateText, { color: startDate ? colors.text : `${colors.textSecondary}80` }]}>
              {formatDateDisplay(startDate, 'Start Date')}
            </Text>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.dateFieldWrapper}>
          {/* <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>End Date</Text> */}
          <Pressable
            onPress={() => setShowEndPicker(true)}
            style={({ pressed }) => [
              styles.dateField,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.dateText, { color: endDate ? colors.text : `${colors.textSecondary}80` }]}>
              {formatDateDisplay(endDate, 'End Date')}
            </Text>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* DateTimePicker Modals */}
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
                value={currentStartDateObj}
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
          value={currentStartDateObj}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}

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
                value={currentEndDateObj}
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
          value={currentEndDateObj}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 10,
    padding: Spacing.three,
    borderRadius: 16,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.one,
    marginBottom: Spacing.one,
  },
  presetRow: {
    marginHorizontal: -Spacing.three,
    marginBottom: Spacing.two,
  },
  presetContentContainer: {
    paddingHorizontal: Spacing.three,
  },
  presetButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
    marginRight: Spacing.two,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  customDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  dateFieldWrapper: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: Spacing.three,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
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
