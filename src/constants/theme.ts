/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#7D73E6',
    primaryLight: '#A39CFC',
    secondary: '#00B894', // Emerald (income)
    danger: '#FF6B6B',    // Coral (expense)
    warning: '#FDCB6E',   // Amber
    background: '#F8F9FE',
    surface: '#FFFFFF',
    surfaceSecondary: '#F0F0F3',
    text: '#2D3436',
    textSecondary: '#636E72',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    border: '#E2E8F0',
  },
  dark: {
    primary: '#9B94FB',
    primaryLight: '#7D73E6',
    secondary: '#55EFC4', // Lighter Emerald
    danger: '#FF7675',    // Lighter Coral
    warning: '#FFEAA7',   // Lighter Amber
    background: '#000000',
    surface: '#0E0E11',
    surfaceSecondary: '#16161A',
    text: '#F5F6FA',
    textSecondary: '#A0A0A5',
    backgroundElement: '#1B1B20',
    backgroundSelected: '#25252B',
    border: '#1A1A1E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
