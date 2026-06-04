import { Haptics } from '@/utils/haptics';
import React from 'react';
import { ActivityIndicator, GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: any;
  accessibilityLabel?: string;
  accessibilityRole?: any;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  haptic = 'light',
  leftIcon,
  rightIcon,
  style,
  accessibilityLabel,
  accessibilityRole,
}: ButtonProps) {
  const { colors, isDark } = useAppTheme();

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, { damping: 25, stiffness: 350 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withSpring(1, { damping: 25, stiffness: 350 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  const handlePress = (e: GestureResponderEvent) => {
    if (disabled || loading) return;
    if (haptic !== 'none') {
      Haptics.impact(haptic === 'light' ? 'light' : haptic === 'medium' ? 'medium' : 'heavy');
    }
    onPress(e);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  // Get background and border styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: colors.primary },
          text: { color: '#FFFFFF' },
          loaderColor: '#FFFFFF',
        };
      case 'secondary':
        return {
          container: { backgroundColor: isDark ? '#2A3E6B' : '#E0EBFF' },
          text: { color: colors.primary },
          loaderColor: colors.primary,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)',
          },
          text: { color: colors.textSecondary },
          loaderColor: colors.textSecondary,
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: colors.textSecondary },
          loaderColor: colors.textSecondary,
        };
      case 'danger':
        return {
          container: { backgroundColor: colors.danger },
          text: { color: '#FFFFFF' },
          loaderColor: '#FFFFFF',
        };
    }
  };

  // Get padding and font styling
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
          text: { fontSize: 13, fontWeight: '600' as const },
        };
      case 'md':
        return {
          container: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 16 },
          text: { fontSize: 15, fontWeight: '600' as const },
        };
      case 'lg':
        return {
          container: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 20 },
          text: { fontSize: 17, fontWeight: '700' as const },
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={[
        styles.baseContainer,
        variantStyle.container,
        sizeStyle.container,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.loaderColor} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View>{leftIcon}</View>}
          {label && label.length > 0 && <Text style={[styles.baseText, variantStyle.text, sizeStyle.text]}>{label}</Text>}
          {rightIcon && <View >{rightIcon}</View>}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'flex-start',

  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    textAlign: 'center',
    marginHorizontal: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});
