import { Button, Card, TextInput } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { db } from '@/db';
import { accounts, settings } from '@/db/schema';
import { useAppStore } from '@/stores/useAppStore';
import { modelDownloader } from '@/utils/modelDownloader';
import { Ionicons } from '@expo/vector-icons';
import { getLocales } from 'expo-localization';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import {
  ACCOUNT_TYPE_OPTIONS,
  MODEL_TIER_OPTIONS,
  SUPPORTED_CURRENCIES,
  THEME_OPTIONS,
} from './onboardingConfig';

export function OnboardingWizard() {
  const systemColorScheme = useColorScheme() ?? 'light';
  const {
    theme,
    setTheme,
    setProfile,
    setIsOnboarded,
    setLlmModelTier,
  } = useAppStore();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [accountName, setAccountName] = useState('Main Account');
  const [accountType, setAccountType] = useState<'bank' | 'credit_card' | 'cash' | 'savings'>('bank');
  const [startingBalance, setStartingBalance] = useState('0');
  const [themePref, setThemePref] = useState<'light' | 'dark' | 'system'>('system');
  const [selectedModel, setSelectedModel] = useState<'lite' | 'standard' | 'pro' | null>('lite');

  // Auto-detect currency code on load
  useEffect(() => {
    try {
      const locales = getLocales();
      const code = locales[0]?.currencyCode;
      if (code) {
        setCurrency(code);
      }
    } catch (e) {
      console.warn('Could not auto-detect currency code:', e);
    }
  }, []);

  // Update store theme when pref changes
  const handleThemeChange = (pref: 'light' | 'dark' | 'system') => {
    setThemePref(pref);
    setTheme(pref);
  };

  const activePref = themePref === 'system' ? systemColorScheme : themePref;
  const currentColors = Colors[activePref === 'dark' ? 'dark' : 'light'];

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      // 1. Write settings to SQLite db
      const settingsData = [
        { key: 'is_onboarded', value: 'true' },
        { key: 'user_name', value: name || 'User' },
        { key: 'currency', value: currency },
        { key: 'theme', value: themePref },
        { key: 'llm_tier', value: selectedModel || 'none' },
      ];

      for (const item of settingsData) {
        await db.insert(settings)
          .values(item)
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: item.value },
          });
      }

      // 2. Create the initial account in SQLite db
      const balanceVal = parseFloat(startingBalance) || 0;
      const finalBalanceVal = accountType === 'credit_card' ? -Math.abs(balanceVal) : balanceVal;
      await db.insert(accounts).values({
        name: accountName || 'Default Account',
        type: accountType,
        balance: finalBalanceVal,
        currency: currency,
        color: '#6C5CE7', // Brand primary hex
        icon: accountType === 'credit_card' ? 'card' : 'wallet',
      });

      // 3. Update state store
      setProfile(name || 'User', currency);
      setLlmModelTier(selectedModel);
      setIsOnboarded(true);

      // 4. Trigger background model download if selected
      if (selectedModel) {
        // Start downloading asynchronously in the background
        modelDownloader.startDownload(selectedModel);
      }
    } catch (e) {
      console.error('Error completing onboarding:', e);
    }
  };

  const stepPercentage = (step / 5) * 100;

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* Top Progress Bar */}
      <View style={[styles.progressBackground, { backgroundColor: currentColors.border }]}>
        <View
          style={[
            styles.progressBar,
            { width: `${stepPercentage}%`, backgroundColor: currentColors.primary },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={[styles.logoContainer, { backgroundColor: currentColors.primary + '15' }]}>
              <Ionicons name="wallet-outline" size={72} color={currentColors.primary} />
            </View>
            <Text style={[styles.title, { color: currentColors.text }]}>PowerMoney</Text>
            <Text style={[styles.subtitle, { color: currentColors.textSecondary }]}>
              Your intelligent, 100% offline, privacy-first personal finance tracker. Keep details secure on your device.
            </Text>
            <Button
              label="Get Started"
              onPress={handleNext}
              size="lg"
              variant="primary"
              style={styles.ctaButton}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: currentColors.text }]}>Let's get to know you</Text>
            <Text style={[styles.stepSubtitle, { color: currentColors.textSecondary }]}>
              What should we call you and what is your default spending currency?
            </Text>

            <TextInput
              label="Your Name"
              placeholder="Enter name"
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.inputLabel, { color: currentColors.textSecondary }]}>Preferred Currency</Text>
            <View style={styles.optionsGrid}>
              {SUPPORTED_CURRENCIES.map((code) => {
                const isSelected = currency === code;
                return (
                  <Button
                    key={code}
                    label={code}
                    onPress={() => setCurrency(code)}
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"

                  />
                );
              })}
            </View>

            <View style={styles.buttonRow}>
              <Button label="Back" onPress={handleBack} variant="ghost" />
              <Button label="Next" onPress={handleNext} disabled={!name} variant="primary" />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: currentColors.text }]}>Add your first account</Text>
            <Text style={[styles.stepSubtitle, { color: currentColors.textSecondary }]}>
              Create a wallet or bank account to track transactions and budgets.
            </Text>

            <TextInput
              label="Account Name"
              placeholder="e.g. My Bank, Cash Pocket"
              value={accountName}
              onChangeText={setAccountName}
            />

            <Text style={[styles.inputLabel, { color: currentColors.textSecondary }]}>Account Type</Text>
            <View style={styles.optionsGrid}>
              {ACCOUNT_TYPE_OPTIONS.map((opt) => {
                const isSelected = accountType === opt.type;
                return (
                  <Button
                    key={opt.type}
                    label={opt.label}
                    onPress={() => setAccountType(opt.type)}
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"

                  />
                );
              })}
            </View>

            <TextInput
              label={accountType === 'credit_card' ? 'Outstanding Balance (Amount Owed)' : 'Starting Balance'}
              placeholder="0.00"
              keyboardType="numeric"
              value={startingBalance}
              onChangeText={setStartingBalance}
            />
            {accountType === 'credit_card' && (
              <Text style={[styles.onboardingHelperText, { color: currentColors.textSecondary }]}>
                Enter the amount you currently owe. This will be tracked as a negative liability.
              </Text>
            )}

            <View style={styles.buttonRow}>
              <Button label="Back" onPress={handleBack} variant="ghost" />
              <Button label="Next" onPress={handleNext} disabled={!accountName} variant="primary" />
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: currentColors.text }]}>Choose your theme</Text>
            <Text style={[styles.stepSubtitle, { color: currentColors.textSecondary }]}>
              Customize the look and feel of PowerMoney.
            </Text>

            <View style={styles.themeOptions}>
              {THEME_OPTIONS.map((opt) => {
                const isSelected = themePref === opt.type;
                return (
                  <Pressable
                    key={opt.type}
                    onPress={() => handleThemeChange(opt.type)}
                    style={[
                      styles.themeCard,
                      {
                        backgroundColor: currentColors.surface,
                        borderColor: isSelected ? currentColors.primary : currentColors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={28}
                      color={isSelected ? currentColors.primary : currentColors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.themeLabel,
                        {
                          color: isSelected ? currentColors.primary : currentColors.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.buttonRow}>
              <Button label="Back" onPress={handleBack} variant="ghost" />
              <Button label="Next" onPress={handleNext} variant="primary" />
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: currentColors.text }]}>On-Device AI Assistant</Text>
            <Text style={[styles.stepSubtitle, { color: currentColors.textSecondary }]}>
              Choose a model download tier to analyze spending and categorize receipts 100% offline.
            </Text>

            <Card style={styles.modelCard}>
              {MODEL_TIER_OPTIONS.map((opt) => {
                const isSelected = selectedModel === opt.tier;
                return (
                  <Pressable
                    key={opt.tier || 'none'}
                    onPress={() => setSelectedModel(opt.tier)}
                    style={[
                      styles.modelOption,
                      {
                        borderColor: isSelected ? currentColors.primary : currentColors.border,
                        backgroundColor: isSelected ? currentColors.primary + '05' : 'transparent',
                      },
                    ]}
                  >
                    <View style={styles.modelHeader}>
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isSelected ? currentColors.primary : currentColors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.modelName,
                          {
                            color: isSelected ? currentColors.primary : currentColors.text,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {opt.name}
                      </Text>
                    </View>
                    <Text style={[styles.modelDesc, { color: currentColors.textSecondary }]}>
                      {opt.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </Card>

            <View style={styles.buttonRow}>
              <Button label="Back" onPress={handleBack} variant="ghost" />
              <Button label="Finish Setup" onPress={handleNext} variant="primary" />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// React Native Pressable type safety check
const Pressable = require('react-native').Pressable;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBackground: {
    height: 4,
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    justifyContent: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  ctaButton: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: 16,
    marginBottom: 12,
    paddingLeft: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  optionButton: {
    flexGrow: 1,
    minWidth: 80,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 40,
    alignItems: 'center',
  },
  themeOptions: {
    gap: 16,
    width: '100%',
    marginBottom: 20,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  themeLabel: {
    fontSize: 16,
    marginLeft: 16,
  },
  modelCard: {
    width: '100%',
    borderWidth: 0,
    padding: 0,
    gap: 18,
    paddingVertical: 20

  },
  modelOption: {
    borderWidth: 1.5,
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 16,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelName: {
    fontSize: 15,
    marginLeft: 10,
  },
  modelDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    paddingLeft: 30,
  },
  onboardingHelperText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
    alignSelf: 'flex-start',
    paddingLeft: 4,
    lineHeight: 16,
  },
});
