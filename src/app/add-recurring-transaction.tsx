import { CustomAlert } from '@/components/feedback/CustomAlert';
import {
  Button,
  DatePickerField,
  SegmentedControl,
  SelectField,
  Switch,
  TextInput,
  TimePickerField
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { db } from '@/db';
import { recurringTransactions } from '@/db/schema';
import { FrequencyPicker } from '@/features/recurring/components/FrequencyPicker';
import { useRecurringForm } from '@/features/recurring/hooks/useRecurringForm';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Haptics } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { eq } from 'drizzle-orm';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddRecurringTransactionScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    formData,
    updateField,
    accountOptions,
    categoryOptions,
    isSubmitting,
    isLoading,
    handleSubmit,
  } = useRecurringForm(id);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    const success = await handleSubmit();
    if (success) {
      router.back();
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    CustomAlert.alert(
      'Delete Recurring Transaction',
      'Are you sure you want to permanently delete this recurring template? Future occurrences will no longer be generated, but previously generated transactions will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await db.delete(recurringTransactions).where(eq(recurringTransactions.id, id));
              Haptics.notification('success');
              router.back();
            } catch (e) {
              Haptics.notification('error');
              CustomAlert.alert('Error', 'Failed to delete recurring transaction.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          label=""
          onPress={() => router.back()}
          variant="outline"
          size="sm"
          leftIcon={<Ionicons name="arrow-back" size={20} color={colors.text} />}
          style={styles.backBtn}
        />
        <Text style={[styles.title, { color: colors.text }]}>
          {id ? 'Edit Recurring' : 'Add Recurring'}
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          {/* Amount field */}
          <TextInput
            label="Amount"
            placeholder="0.00"
            keyboardType="numeric"
            value={formData.amount}
            onChangeText={(val) => updateField('amount', val)}
            containerStyle={styles.textInputContainer}
          />

          {/* Type selector */}
          <View style={styles.selectGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Transaction Type</Text>
            <SegmentedControl
              options={[
                { value: 'expense', label: 'EXPENSE', icon: 'trending-down-outline' },
                { value: 'income', label: 'INCOME', icon: 'trending-up-outline' },
                { value: 'transfer', label: 'TRANSFER', icon: 'swap-horizontal-outline' },
              ]}
              selectedValue={formData.type}
              onChange={(val) => updateField('type', val as any)}
            />
          </View>

          {/* Source Account */}
          {accountOptions.length > 0 && (
            <SelectField
              label={formData.type === 'transfer' ? 'From Account' : 'Source Account'}
              value={formData.accountId}
              options={accountOptions}
              onSelect={(val) => updateField('accountId', val)}
              placeholder="Select account"
            />
          )}

          {/* Destination Account (Only for transfers) */}
          {formData.type === 'transfer' && accountOptions.length > 0 && (
            <SelectField
              label="To Account"
              value={formData.toAccountId}
              options={accountOptions}
              onSelect={(val) => updateField('toAccountId', val)}
              placeholder="Select destination account"
            />
          )}

          {/* Merchant (Hide for transfers) */}
          {formData.type !== 'transfer' && (
            <TextInput
              label="Merchant"
              placeholder="e.g. Landlord, Netflix, Salary"
              value={formData.merchant}
              onChangeText={(val) => updateField('merchant', val)}
              containerStyle={styles.textInputContainer}
            />
          )}

          {/* Description */}
          <TextInput
            label={formData.type === 'transfer' ? 'Transfer Notes' : 'Description Notes'}
            placeholder="e.g. Monthly Rent Payment"
            value={formData.description}
            onChangeText={(val) => updateField('description', val)}
            containerStyle={styles.textInputContainer}
          />

          {/* Category Selector (Hide for transfers) */}
          {formData.type !== 'transfer' && categoryOptions.length > 0 && (
            <SelectField
              label="Category"
              value={formData.categoryId}
              options={categoryOptions}
              onSelect={(val) => updateField('categoryId', val)}
              placeholder="Select category"
              searchable
            />
          )}

          {/* Start Date */}
          <DatePickerField
            label="Start Date"
            value={formData.startDate}
            onChange={(val) => updateField('startDate', val)}
          />

          {/* Preferred Time */}
          <TimePickerField
            label="Preferred Time"
            value={formData.startTime}
            onChange={(val) => updateField('startTime', val)}
          />

          {/* Frequency & Interval Stepper */}
          <FrequencyPicker
            frequency={formData.frequency}
            interval={parseInt(formData.interval, 10) || 1}
            onFrequencyChange={(freq) => updateField('frequency', freq)}
            onIntervalChange={(val) => updateField('interval', val.toString())}
          />

          {/* End conditions toggle / inputs */}
          <View style={styles.toggleSection}>
            <Switch
              label="Has End Date"
              description="Stop generating occurrences after this date"
              value={formData.hasEndDate}
              onValueChange={(val) => updateField('hasEndDate', val)}
            />
            {formData.hasEndDate && (
              <DatePickerField
                label="End Date"
                value={formData.endDate || formData.startDate}
                onChange={(val) => updateField('endDate', val)}
              />
            )}
          </View>

          <View style={styles.toggleSection}>
            <Switch
              label="End After Occurrences"
              description="Stop after a specific number of runs"
              value={formData.hasMaxOccurrences}
              onValueChange={(val) => updateField('hasMaxOccurrences', val)}
            />
            {formData.hasMaxOccurrences && (
              <TextInput
                label="Number of Occurrences"
                placeholder="e.g. 12"
                keyboardType="numeric"
                value={formData.maxOccurrences}
                onChangeText={(val) => updateField('maxOccurrences', val)}
                containerStyle={styles.textInputContainer}
              />
            )}
          </View>

          {/* Save Action */}
          <Button
            label={id ? 'Save Changes' : 'Save Recurring'}
            onPress={handleSave}
            variant="primary"
            loading={isSubmitting}
            style={styles.submitBtn}
          />

          {id && (
            <Button
              label="Delete Recurring"
              onPress={handleDelete}
              variant="danger"
              loading={isDeleting}
              disabled={isSubmitting}
              style={styles.deleteBtn}
              accessibilityLabel="Delete recurring transaction"
              accessibilityRole="button"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  backBtn: {
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerRightSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
    paddingHorizontal: Spacing.three,
  },
  formContainer: {
    marginVertical: Spacing.two,
    gap: Spacing.four,
  },
  textInputContainer: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.one,
    paddingLeft: Spacing.one,
  },
  selectGroup: {
    gap: Spacing.two,
  },
  toggleSection: {
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
    paddingTop: Spacing.two,
  },
  submitBtn: {
    marginTop: Spacing.three,
    alignSelf: 'stretch',
  },
  deleteBtn: {
    marginTop: Spacing.two,
    alignSelf: 'stretch',
  },
});
