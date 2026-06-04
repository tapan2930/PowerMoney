import { useAppTheme } from '@/hooks/useAppTheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'outline';
  style?: any;
  padding?: number;
}

export function Card({
  children,
  variant = 'default',
  style,
  padding = 16,
}: CardProps) {
  const { colors, isDark } = useAppTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: isDark ? 'rgba(14, 14, 17, 0.65)' : 'rgba(255, 255, 255, 0.75)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          borderWidth: 1,
          boxShadow: `0px 4px 8px ${!isDark ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.15)'}`,
        };
      case 'glass':
        return {
          backgroundColor: !isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(10, 10, 12, 0.75)',
          borderColor: !isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          backdropFilter: 'blur(20px)', // handled on web, native gets transparency
          boxShadow: `0px 8px 16px ${!isDark ? 'rgba(0, 0, 0, 0.06)' : 'rgba(0, 0, 0, 0.3)'}`,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border,
          borderWidth: 1.5,
        };
    }
  };

  return (
    <View
      style={[
        styles.card,
        { padding },
        getVariantStyles(),
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    alignSelf: 'stretch',
    marginVertical: 8,

  },
});
