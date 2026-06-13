import { Colors } from '@/constants/theme';
import { useOTAUpdates } from '@/hooks/useOTAUpdates';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { seedDatabase } from '@/db/seed';
import { useAppStore } from '@/stores/useAppStore';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Appearance, FlatList, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Load the migrations folder using the babel-plugin-inline-import bundler support
import migrations from '../db/migrations/migrations';

import { CustomAlertModal } from '@/components/feedback/CustomAlertModal';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { DownloadNotification } from '@/components/ui';
import { getModelFileName } from '@/utils/modelDownloader';
import * as FileSystem from 'expo-file-system/legacy';
import { StatusBar } from 'expo-status-bar';

// Disable scroll indicators globally
// @ts-ignore
if (ScrollView.defaultProps) {
  // @ts-ignore
  ScrollView.defaultProps.showsVerticalScrollIndicator = false;
  // @ts-ignore
  ScrollView.defaultProps.showsHorizontalScrollIndicator = false;
} else {
  // @ts-ignore
  ScrollView.defaultProps = {
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
  };
}

// @ts-ignore
if (FlatList.defaultProps) {
  // @ts-ignore
  FlatList.defaultProps.showsVerticalScrollIndicator = false;
  // @ts-ignore
  FlatList.defaultProps.showsHorizontalScrollIndicator = false;
} else {
  // @ts-ignore
  FlatList.defaultProps = {
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
  };
}

export default function RootLayout() {
  useOTAUpdates();

  const systemColorScheme = useColorScheme() ?? 'light';
  const { success: migrationsSuccess, error: migrationsError } = useMigrations(db, migrations);

  const {
    theme,
    setTheme,
    isOnboarded,
    setIsOnboarded,
    setProfile,
    resetStore,
    setLlmModelTier,
    setLlmStatus,
  } = useAppStore();

  const [dbLoaded, setDbLoaded] = useState(false);

  // Apply migrations and seed default data
  useEffect(() => {
    if (migrationsSuccess) {
      const initDb = async () => {
        try {
          // 1. Seed database with defaults (if empty)
          await seedDatabase();

          // 2. Fetch settings
          const result = await db.select().from(settings);
          const settingsMap = result.reduce((acc, curr) => {
            acc[curr.key] = curr.value || '';
            return acc;
          }, {} as Record<string, string>);

          if (settingsMap['is_onboarded'] === 'true') {
            setIsOnboarded(true);
            setProfile(
              settingsMap['user_name'] || '',
              settingsMap['currency'] || 'USD'
            );
          } else {
            setIsOnboarded(false);
          }

          if (settingsMap['theme']) {
            setTheme(settingsMap['theme'] as any);
          }

          // Restore model tier and check if local weights exist
          const tier = settingsMap['llm_tier'];
          if (tier && tier !== 'none') {
            const modelTier = tier as any;
            setLlmModelTier(modelTier);
            const fileName = getModelFileName(modelTier);
            const modelPath = `${FileSystem.documentDirectory}models/${fileName}`;
            try {
              const fileInfo = await FileSystem.getInfoAsync(modelPath);
              if (fileInfo.exists && fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
                setLlmStatus('ready');
              } else {
                if (fileInfo.exists) {
                  console.log('Local model file is too small (corrupted/incomplete), deleting...');
                  await FileSystem.deleteAsync(modelPath, { idempotent: true });
                }
                setLlmStatus('not_downloaded');
              }
            } catch (fsError) {
              console.warn('Error checking model weights on boot:', fsError);
              setLlmStatus('not_downloaded');
            }
          } else {
            setLlmModelTier(null);
            setLlmStatus('idle');
          }

          setDbLoaded(true);
        } catch (e) {
          console.error('Error loading app settings:', e);
          setDbLoaded(true); // Proceed to let app render
        }
      };

      initDb();
    }
  }, [migrationsSuccess]);

  // Determine active color scheme
  const activeScheme = theme === 'system' ? systemColorScheme : theme;

  // Sync native iOS/Android color scheme with our active app theme state
  useEffect(() => {
    if (activeScheme) {
      Appearance.setColorScheme(activeScheme === 'dark' ? 'dark' : 'light');
    }
  }, [activeScheme]);

  const colors = Colors[activeScheme === 'dark' ? 'dark' : 'light'];

  // Navigation theme setup
  const navigationTheme = {
    ...(activeScheme === 'dark' ? DarkTheme : DefaultTheme),
    dark: activeScheme === 'dark',
    colors: {
      ...(activeScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  // 1. Handle migration errors
  if (migrationsError) {
    return (
      <View style={[styles.center, { backgroundColor: '#FF6B6B' }]}>
        <Text style={styles.errorTitle}>Database Migration Failed</Text>
        <Text style={styles.errorText}>{migrationsError.message}</Text>
      </View>
    );
  }

  // 2. Loading state while running migrations or fetching settings
  if (!migrationsSuccess || !dbLoaded) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Initializing safe offline database...
        </Text>
      </View>
    );
  }

  // 3. Render the application inside the @expo/ui Host context
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationTheme}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <StatusBar style={activeScheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
          <DownloadNotification />
          <CustomAlertModal />
          {!isOnboarded && (
            <View style={StyleSheet.absoluteFill}>
              <OnboardingWizard />
            </View>
          )}
        </View>
      </ThemeProvider>

    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
