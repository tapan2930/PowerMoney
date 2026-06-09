import { Colors } from '@/constants/theme';
import { Haptics } from '@/utils/haptics';
import { Switch as ExpoSwitch, Host } from '@expo/ui';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
// Try to load expo/ui Switch if available, fallback to standard react-native Switch
// let ExpoSwitch: any;
// try {
//   ExpoSwitch = require('@expo/ui').Switch;
// } catch (e) {
//   ExpoSwitch = RNSwitch;
// }

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

      <Host matchContents style={styles.switchWrapper}>
        <ExpoSwitch
          value={value}
          onValueChange={handleValueChange}
        />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,

    justifyContent: "space-between",
  },
  textContainer: {
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

  },
});
