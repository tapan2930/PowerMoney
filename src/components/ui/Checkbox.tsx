import React from 'react';
import { Pressable, Text, StyleSheet, View, useColorScheme } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { Haptics } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  haptic?: boolean;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  haptic = true,
}: CheckboxProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.92, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    if (disabled) return;
    if (haptic) {
      Haptics.impact('light');
    }
    onCheckedChange(!checked);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.container, animatedStyle, disabled && styles.disabled]}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: checked ? colors.primary : colors.border,
            backgroundColor: checked ? colors.primary : 'transparent',
          },
        ]}
      >
        {checked && (
          <Ionicons
            name="checkmark"
            size={14}
            color="#FFFFFF"
            style={styles.checkmark}
          />
        )}
      </View>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkmark: {
    fontWeight: 'bold',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});
