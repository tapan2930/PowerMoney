import { CustomAlert } from '@/components/feedback/CustomAlert';
import { Button, Card, SelectField, TextInput, SegmentedControl } from '@/components/ui';
import { db } from '@/db';
import { accounts, budgets, chatMessages, goals, settings, transactions } from '@/db/schema';
import { seedDatabase } from '@/db/seed';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ModelTier, useAppStore } from '@/stores/useAppStore';
import { restoreBackupFromCloud, uploadBackupToCloud, exportLocalBackup, importLocalBackup } from '@/utils/backup';
import { Haptics } from '@/utils/haptics';
import { getModelFileName } from '@/utils/modelDownloader';
import { Ionicons } from '@expo/vector-icons';
import { eq, sql } from 'drizzle-orm';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PreferencesScreen() {
  const { colors } = useAppTheme();

  const {
    userName,
    currency,
    theme,
    llmModelTier,
    setTheme,
    setProfile,
    setLlmModelTier,
    setLlmStatus,
    setIsOnboarded,
    resetStore,
  } = useAppStore();

  const [editName, setEditName] = useState(userName);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLocalBackingUp, setIsLocalBackingUp] = useState(false);
  const [isLocalRestoring, setIsLocalRestoring] = useState(false);

  const currencyOptions = [
    { key: 'USD', label: 'USD ($)', icon: 'logo-usd' },
    { key: 'EUR', label: 'EUR (€)', icon: 'logo-euro' },
    { key: 'GBP', label: 'GBP (£)', icon: 'logo-pound' },
    { key: 'INR', label: 'INR (₹)', icon: 'cash-outline' },
    { key: 'JPY', label: 'JPY (¥)', icon: 'cash-outline' },
    { key: 'CAD', label: 'CAD ($)', icon: 'cash-outline' },
    { key: 'AUD', label: 'AUD ($)', icon: 'cash-outline' },
  ];

  const handleCloudBackup = async () => {
    setIsBackingUp(true);
    try {
      await uploadBackupToCloud();
      Haptics.notification('success');
      CustomAlert.alert('Backup Complete', 'Your database was successfully copied to cloud storage.');
    } catch (e: any) {
      Haptics.notification('error');
      CustomAlert.alert('Backup Failed', e.message || 'An error occurred.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleCloudRestore = async () => {
    CustomAlert.alert(
      'Restore From Cloud',
      'This will replace your current local database with the backup saved on your cloud storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setIsRestoring(true);
            try {
              await restoreBackupFromCloud();
              Haptics.notification('success');
              CustomAlert.alert(
                'Success',
                'Backup restored successfully. Please restart the app to apply all updates.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      resetStore();
                      setIsOnboarded(false);
                    },
                  },
                ]
              );
            } catch (e: any) {
              Haptics.notification('error');
              CustomAlert.alert('Restore Failed', e.message || 'No backup was found or restored.');
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  const handleLocalBackup = async () => {
    setIsLocalBackingUp(true);
    try {
      const savedPathInfo = await exportLocalBackup();
      Haptics.notification('success');
      CustomAlert.alert('Backup Exported', savedPathInfo);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      if (errorMsg !== 'Import cancelled.' && errorMsg !== 'Share cancelled') {
        Haptics.notification('error');
        CustomAlert.alert('Export Failed', errorMsg || 'An error occurred.');
      }
    } finally {
      setIsLocalBackingUp(false);
    }
  };

  const handleLocalRestore = async () => {
    CustomAlert.alert(
      'Import Backup File',
      'This will replace your current local database with the selected backup file. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import & Overwrite',
          style: 'destructive',
          onPress: async () => {
            setIsLocalRestoring(true);
            try {
              await importLocalBackup();
              Haptics.notification('success');
              CustomAlert.alert(
                'Success',
                'Backup imported successfully. Please restart the app to apply all updates.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      resetStore();
                      setIsOnboarded(false);
                    },
                  },
                ]
              );
            } catch (e) {
              const errorMsg = e instanceof Error ? e.message : String(e);
              if (errorMsg !== 'Import cancelled.') {
                Haptics.notification('error');
                CustomAlert.alert('Import Failed', errorMsg || 'No backup was picked or restored.');
              }
            } finally {
              setIsLocalRestoring(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Update database settings table
      await db.insert(settings).values([
        { key: 'user_name', value: editName },
        { key: 'currency', value: selectedCurrency },
      ]).onConflictDoUpdate({
        target: settings.key,
        set: { value: sql`excluded.value` },
      });

      setProfile(editName, selectedCurrency);
      Haptics.notification('success');
      CustomAlert.alert('Success', 'Profile settings updated successfully!');
    } catch (e) {
      Haptics.notification('error');
      console.error('Error saving profile settings:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModelChange = async (tier: ModelTier) => {
    try {
      await db.update(settings).set({ value: tier || 'none' }).where(eq(settings.key, 'llm_tier'));
      setLlmModelTier(tier);
      
      if (tier) {
        const fileName = getModelFileName(tier);
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
          console.warn('Error checking model weights:', fsError);
          setLlmStatus('not_downloaded');
        }
      } else {
        setLlmStatus('idle');
      }

      Haptics.impact('medium');
      CustomAlert.alert('AI Settings Updated', `Offline model tier changed to: ${tier || 'None'}`);
    } catch (e) {
      console.error('Error changing model tier:', e);
    }
  };

  const handleThemeChange = async (pref: 'light' | 'dark' | 'system') => {
    try {
      await db.update(settings).set({ value: pref }).where(eq(settings.key, 'theme'));
      setTheme(pref);
      Haptics.impact('light');
    } catch (e) {
      console.error('Error updating theme settings:', e);
    }
  };

  const handleResetWipe = () => {
    CustomAlert.alert(
      'Wipe All App Data',
      'This will permanently delete all your accounts, transaction logs, budgets, goals, and settings. This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all records from tables
              await db.delete(transactions);
              await db.delete(accounts);
              await db.delete(budgets);
              await db.delete(goals);
              await db.delete(chatMessages);
              await db.delete(settings);

              // Re-seed default tables and reset stores
              await seedDatabase();
              resetStore();
              setIsOnboarded(false); // Redirects to Onboarding
            } catch (e) {
              console.error('Error resetting app database:', e);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Button
          label=""
          onPress={() => router.back()}
          variant="outline"
          size="sm"
          leftIcon={<Ionicons name="arrow-back" size={20} color={colors.text} />}
          style={styles.backBtn}
        />
        <Text style={[styles.title, { color: colors.text }]}>Settings & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={styles.sectionCard} padding={20}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile & Locale</Text>

          <TextInput
            label="Profile Name"
            value={editName}
            onChangeText={setEditName}
            placeholder="Edit name"
          />

          <SelectField
            label="Default Currency"
            value={selectedCurrency}
            options={currencyOptions}
            onSelect={setSelectedCurrency}
            placeholder="Select default currency"
          />

          <Button
            label="Save Profile Changes"
            onPress={handleSaveProfile}
            variant="primary"
            loading={isSaving}
            style={styles.saveBtn}
          />
        </Card>

        {/* Appearance Setup */}
        <Card style={styles.sectionCard} padding={20}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme Customization</Text>
          <SegmentedControl
            options={[
              { value: 'light', label: 'Light', icon: 'sunny-outline' },
              { value: 'dark', label: 'Dark', icon: 'moon-outline' },
              { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
            ]}
            selectedValue={theme}
            onChange={(val) => handleThemeChange(val as 'light' | 'dark' | 'system')}
          />
        </Card>

        {/* AI Tier Setup */}
        <Card style={styles.sectionCard} padding={20}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Offline AI Engine</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            Change your on-device LLM model size weights. Swapping sizes resets downloaded statuses.
          </Text>

          <View style={styles.modelSelectorList}>
            {[
              { tier: 'lite', label: 'Lite SmolLM (~70 MB)' },
              { tier: 'standard', label: 'Standard Qwen (~350 MB)' },
              { tier: 'pro', label: 'Pro Phi-4 (~2.2 GB)' },
              { tier: 'ultra', label: 'Ultra Gemma 4 (~1 GB)' },
              { tier: null, label: 'Deactivate / Rules only' },
            ].map((opt) => {
              const isSelected = llmModelTier === opt.tier;
              return (
                <Button
                  key={opt.label}
                  label={opt.label}
                  onPress={() => handleModelChange(opt.tier as ModelTier)}
                  variant={isSelected ? 'primary' : 'outline'}
                  size="sm"
                  style={styles.modelBtn}
                />
              );
            })}
          </View>
        </Card>

        {/* Backup Settings */}
        <Card style={styles.sectionCard} padding={20}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Backup & Cloud Sync</Text>
          
          {/* Cloud Sync section */}
          <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Cloud Sync</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            Export your database records directly to iCloud or Google Drive.
          </Text>

          <View style={styles.backupActions}>
            <Button
              label="Backup to Cloud"
              onPress={handleCloudBackup}
              variant="outline"
              size="sm"
              loading={isBackingUp}
              leftIcon={<Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />}
              style={styles.backupBtn}
            />
            <Button
              label="Restore from Cloud"
              onPress={handleCloudRestore}
              variant="outline"
              size="sm"
              loading={isRestoring}
              leftIcon={<Ionicons name="cloud-download-outline" size={18} color={colors.secondary} />}
              style={styles.backupBtn}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Local Backup section */}
          <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Local Backup</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            Export database backup file to share/save, or import a previously exported backup file offline.
          </Text>

          <View style={styles.backupActions}>
            <Button
              label="Export Backup"
              onPress={handleLocalBackup}
              variant="outline"
              size="sm"
              loading={isLocalBackingUp}
              leftIcon={<Ionicons name="share-outline" size={18} color={colors.primary} />}
              style={styles.backupBtn}
            />
            <Button
              label="Import Backup"
              onPress={handleLocalRestore}
              variant="outline"
              size="sm"
              loading={isLocalRestoring}
              leftIcon={<Ionicons name="download-outline" size={18} color={colors.secondary} />}
              style={styles.backupBtn}
            />
          </View>
        </Card>

        {/* Reset settings */}
        <View style={styles.dangerZone}>
          <Button
            label="Wipe Database & Reset App"
            onPress={handleResetWipe}
            variant="danger"
            size="md"
            leftIcon={<Ionicons name="trash" size={18} color="#FFFFFF" />}
            style={styles.wipeBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
    gap: 16,
  },
  sectionCard: {
    marginVertical: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  optionButton: {
    flexGrow: 1,
    minWidth: 80,
  },
  saveBtn: {
    marginTop: 16,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeBtn: {
    flex: 1,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  modelSelectorList: {
    gap: 8,
  },
  modelBtn: {
    alignSelf: 'stretch',
  },
  backupActions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  backupBtn: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  dangerZone: {
    marginTop: 12,
  },
  wipeBtn: {
    borderRadius: 16,
  },
});
