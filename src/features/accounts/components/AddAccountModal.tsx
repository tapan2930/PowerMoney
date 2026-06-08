import { BottomSheet, BottomSheetScrollView, Button, SelectField, TextInput } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import React from 'react';
import { Text } from 'react-native';
import { styles } from '../styles/accounts.styles';

interface AddAccountModalProps {
  visible: boolean;
  onClose: () => void;
  newAccName: string;
  setNewAccName: (val: string) => void;
  newAccType: 'bank' | 'credit_card' | 'cash' | 'savings' | 'investment' | 'other';
  setNewAccType: (val: 'bank' | 'credit_card' | 'cash' | 'savings' | 'investment' | 'other') => void;
  newAccBalance: string;
  setNewAccBalance: (val: string) => void;
  handleAddAccount: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  visible,
  onClose,
  newAccName,
  setNewAccName,
  newAccType,
  setNewAccType,
  newAccBalance,
  setNewAccBalance,
  handleAddAccount,
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

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <BottomSheetScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.modalTitle, { color: colors.text }]}>Create Account</Text>

        <TextInput
          label="Account Name"
          placeholder="e.g. Chase Bank, Cash Pocket"
          value={newAccName}
          onChangeText={setNewAccName}
          isBottomSheetInput
        />

        <SelectField
          label="Account Type"
          value={newAccType}
          options={accountTypeOptions}
          onSelect={setNewAccType}
          placeholder="Select account type"
        />

        <TextInput
          label={newAccType === 'credit_card' ? 'Outstanding Balance (Amount Owed)' : 'Starting Balance'}
          placeholder="0.00"
          keyboardType="numeric"
          value={newAccBalance}
          onChangeText={setNewAccBalance}
          isBottomSheetInput
        />
        {newAccType === 'credit_card' && (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Enter the amount you currently owe. This will be tracked as a negative liability.
          </Text>
        )}

        <Button
          label="Save Account"
          onPress={handleAddAccount}
          variant="primary"
          style={styles.saveBtn}
          accessibilityLabel="Save new account"
          accessibilityRole="button"
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
};
