import { useColorScheme } from 'react-native';
import { useAppStore } from '@/stores/useAppStore';
import { Colors } from '@/constants/theme';

export function useAppTheme() {
  const systemScheme = useColorScheme() ?? 'light';
  const { theme } = useAppStore();
  const activeScheme = theme === 'system' ? systemScheme : theme;
  const isDark = activeScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return {
    theme: activeScheme,
    isDark,
    colors,
  };
}
