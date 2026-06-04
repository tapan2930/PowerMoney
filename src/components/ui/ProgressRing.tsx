import React, { useEffect } from 'react';
import { View, StyleSheet, Text, useColorScheme } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 12,
  showText = true,
}: ProgressRingProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(Math.max(0, Math.min(progress, 1.5)), {
      damping: 15,
      stiffness: 90,
    });
  }, [progress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animated strokeDashoffset
  const animatedProps = useAnimatedProps(() => {
    // If progress is greater than 1, clip to 1 for visual dashOffset calculations
    const displayProgress = Math.min(animatedProgress.value, 1);
    const strokeDashoffset = circumference - displayProgress * circumference;
    return {
      strokeDashoffset,
    };
  });

  // Determine dynamic ring color based on progress threshold
  const getProgressColor = () => {
    if (progress >= 1.0) return colors.danger;   // Exceeded budget
    if (progress >= 0.8) return colors.warning;  // Close to budget limit
    return colors.primary;                      // Healthy
  };

  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getProgressColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      {showText && (
        <View style={styles.textOverlay}>
          <Text style={[styles.percentageText, { color: colors.text }]}>
            {percentage}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  textOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 20,
    fontWeight: '800',
  },
});
