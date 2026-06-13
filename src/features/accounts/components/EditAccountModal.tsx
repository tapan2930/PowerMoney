import { CustomAlert } from '@/components/feedback/CustomAlert';
import { BottomSheet, BottomSheetScrollView, Button, SelectField, TextInput } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles/accounts.styles';
import { Account } from '../types';

interface EditAccountModalProps {
  visible: boolean;
  onClose: () => void;
  account: Account | null;
  name: string;
  setName: (val: string) => void;
  type: 'bank' | 'credit_card' | 'cash' | 'savings' | 'investment' | 'other';
  setType: (val: 'bank' | 'credit_card' | 'cash' | 'savings' | 'investment' | 'other') => void;
  balance: string;
  setBalance: (val: string) => void;
  handleUpdateAccount: () => void;
  handleArchiveAccount: (archive: boolean) => void;
  handleDeleteAccount: () => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  visible,
  onClose,
  account,
  name,
  setName,
  type,
  setType,
  balance,
  setBalance,
  handleUpdateAccount,
  handleArchiveAccount,
  handleDeleteAccount,
}) => {
  const { colors } = useAppTheme();

  const accountTypeOptions = [
    { key: 'bank', label: 'Checking / Bank Account', icon: 'business-outline' },
    { key: 'credit_card', label: 'Credit Card', icon: 'card-outline' },
    { key: 'cash', label: 'Cash / Wallet', icon: 'wallet-outline' },
    { key: 'savings', label: 'Savings', icon: 'trending-up-outline' },
    { key: 'investment', label: 'Investment', icon: 'analytics-outline' },
    { key: 'other', label: 'Other Asset / Liability', icon: 'help-circle-outline' },
  ];

  const onDeletePress = () => {
    CustomAlert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete this account? WARNING: This will also delete all associated transactions. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: handleDeleteAccount,
        },
      ]
    );
  };

  const onArchivePress = () => {
    const isCurrentlyArchived = account?.isArchived ?? false;
    CustomAlert.alert(
      isCurrentlyArchived ? 'Restore Account' : 'Archive Account',
      isCurrentlyArchived
        ? 'Do you want to restore this account to active status?'
        : 'Do you want to archive this account? All associated transaction history will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCurrentlyArchived ? 'Restore' : 'Archive',
          onPress: () => handleArchiveAccount(!isCurrentlyArchived),
        },
      ]
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <BottomSheetScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Account</Text>

        <TextInput
          label="Account Name"
          placeholder="e.g. Chase Bank, Cash Pocket"
          value={name}
          onChangeText={setName}
          isBottomSheetInput
        />

        <SelectField
          label="Account Type"
          value={type}
          options={accountTypeOptions}
          onSelect={(key) => setType(key as 'bank' | 'credit_card' | 'cash' | 'savings' | 'investment' | 'other')}
          placeholder="Select account type"
        />

        <TextInput
          label={type === 'credit_card' ? 'Outstanding Balance (Amount Owed)' : 'Manual Balance Adjustment'}
          placeholder="0.00"
          keyboardType="numeric"
          value={balance}
          onChangeText={setBalance}
          isBottomSheetInput
        />
        {type === 'credit_card' && (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Enter the amount you currently owe. This will be tracked as a negative liability.
          </Text>
        )}

        <View style={styles.editActionsContainer}>
          <Button
            label="Save Changes"
            onPress={handleUpdateAccount}
            variant="primary"
            style={styles.fullWidthButton}
            accessibilityLabel="Save account changes"
            accessibilityRole="button"
          />

          <View style={styles.editDoubleButtonsRow}>
            <Button
              label={account?.isArchived ? "Restore Account" : "Archive Account"}
              onPress={onArchivePress}
              variant="outline"
              style={styles.flexOne}
              accessibilityLabel="Archive or restore account"
              accessibilityRole="button"
            />

            <Button
              label="Delete"
              onPress={onDeletePress}
              variant="danger"
              style={styles.flexOne}
              accessibilityLabel="Delete account"
              accessibilityRole="button"
            />
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};
