import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, Platform, StyleProp, ViewStyle, Modal } from 'react-native';
import { DateTimePicker, DateTimePickerEvent } from '@expo/ui/community/datetime-picker';

export interface TimePickerFieldProps {
  label?: string;
  value: string; // HH:mm (24-hour format)
  onChange: (time: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Parses an HH:mm string into a Date object (today at that time).
 */
function parseTimeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

/**
 * Formats a Date into HH:mm (24-hour).
 */
function formatTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Formats an HH:mm string into a human-readable 12-hour string.
 */
function formatDisplayTime(timeStr: string): string {
  if (!timeStr) return 'Select Time';
  const date = parseTimeToDate(timeStr);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function TimePickerField({
  label,
  value,
  onChange,
  containerStyle,
}: TimePickerFieldProps) {
  const { colors, isDark } = useAppTheme();
  const [showPicker, setShowPicker] = useState(false);

  const currentDate = value ? parseTimeToDate(value) : new Date();

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate && event.type !== 'dismissed') {
      onChange(formatTime(selectedDate));
    }
  };

  const handlePress = () => {
    setShowPicker(true);
  };

  const formattedDisplay = value ? formatDisplayTime(value) : 'Select Time';

  return (
    <View style={[styles.outerContainer, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}

      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${label || 'Select Time'}: ${formattedDisplay}`}
        style={({ pressed }) => [
          styles.fieldContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text style={[styles.valueText, { color: value ? colors.text : colors.textSecondary + '80' }]}>
          {formattedDisplay}
        </Text>
        <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
      </Pressable>

      {/* iOS spinner in a bottom modal */}
      {showPicker && Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.pickerModalContainer}>
            <Pressable style={styles.overlay} onPress={() => setShowPicker(false)} />
            <View style={[styles.pickerModalContent, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{label || 'Select Time'}</Text>
                <Pressable onPress={() => setShowPicker(false)} style={styles.doneButton}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={currentDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                themeVariant={isDark ? 'dark' : 'light'}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android native time dialog */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={currentDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    paddingLeft: 4,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '500',
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
