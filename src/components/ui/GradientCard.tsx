import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface GradientCardProps {
  children: React.ReactNode;
  colors?: string[];
  style?: any;
  padding?: number;
}

export function GradientCard({
  children,
  colors,
  style,
  padding = 24,
}: GradientCardProps) {
  const { colors: themeColors, isDark } = useAppTheme();

  // Default gradient represents our primary purple -> secondary emerald style
  const defaultColors = isDark
    ? ['#1A1A2E', '#16213E']
    : ['#6C5CE7', '#81ECEC'];

  const gradientColors = colors || defaultColors;

  return (
    <LinearGradient
      colors={gradientColors as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { padding }, style]}
    >
      <View style={styles.borderOverlay} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    alignSelf: 'stretch',
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
  },
  borderOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    pointerEvents: 'none',
  },
});
