import React, { useEffect } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';

export interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  style?: any;
}

export function ProgressBar({
  progress,
  height = 8,
  style,
}: ProgressBarProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withSpring(Math.max(0, Math.min(progress, 1)), {
      damping: 15,
      stiffness: 100,
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedWidth.value * 100}%`,
    };
  });

  // Dynamic progress bar colors depending on completeness
  const getBarColor = () => {
    if (progress >= 1.0) return colors.secondary; // Goal reached / full
    if (progress >= 0.8) return colors.warning;   // Close to completion
    return colors.primary;                       // Normal
  };

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: colors.border,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: getBarColor(),
            borderRadius: height / 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    width: 0,
  },
});
