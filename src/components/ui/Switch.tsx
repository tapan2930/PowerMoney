import React from 'react';
import { View, Text, StyleSheet, useColorScheme, Platform, Switch as RNSwitch } from 'react-native';
import { Colors } from '@/constants/theme';
import { Haptics } from '@/utils/haptics';

// Try to load expo/ui Switch if available, fallback to standard react-native Switch
let ExpoSwitch: any;
try {
  ExpoSwitch = require('@expo/ui').Switch;
} catch (e) {
  ExpoSwitch = RNSwitch;
}

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  haptic?: boolean;
}

export function Switch({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  haptic = true,
}: SwitchProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const handleValueChange = (newValue: boolean) => {
    if (disabled) return;
    if (haptic) {
      Haptics.impact('light');
    }
    onValueChange(newValue);
  };

  const SwitchComponent = ExpoSwitch || RNSwitch;

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>

      <View style={styles.switchWrapper}>
        <SwitchComponent
          value={value}
          onValueChange={handleValueChange}
          disabled={disabled}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={Platform.OS === 'ios' ? undefined : value ? '#FFFFFF' : '#F4F3F4'}
          {...(Platform.OS !== 'ios' && Platform.OS !== 'android' ? {} : { label })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    width: '100%',
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  switchWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
