import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, Platform, StyleProp, ViewStyle } from 'react-native';
import { DateTimePicker, DateTimePickerEvent } from '@expo/ui/community/datetime-picker';

export interface DatePickerFieldProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export function DatePickerField({
  label,
  value,
  onChange,
  containerStyle,
}: DatePickerFieldProps) {
  const { colors } = useAppTheme();
  const [showPicker, setShowPicker] = useState(false);

  const currentDate = value ? new Date(value + 'T00:00:00') : new Date();

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // On Android, we must close the picker first
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate && event.type !== 'dismissed') {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      onChange(formattedDate);
    }
  };

  const handlePress = () => {
    setShowPicker(true);
  };

  const formattedDisplay = value ? new Date(value + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Select Date';

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
        accessibilityLabel={`${label || 'Select Date'}: ${formattedDisplay}`}
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
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
      </Pressable>

      {/* iOS inline calendar in a bottom modal, or Android native dialog */}
      {showPicker && Platform.OS === 'ios' && (
        <View style={styles.pickerModalContainer}>
          <Pressable style={styles.overlay} onPress={() => setShowPicker(false)} />
          <View style={[styles.pickerModalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{label || 'Select Date'}</Text>
              <Pressable onPress={() => setShowPicker(false)} style={styles.doneButton}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={currentDate}
              mode="date"
              display="inline"
              onChange={handleDateChange}
              textColor={colors.text}
              themeVariant={colors.background === '#FFFFFF' ? 'light' : 'dark'}
            />
          </View>
        </View>
      )}

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: -500, // extend overlay up to cover screen
    zIndex: 9999,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 8,
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
