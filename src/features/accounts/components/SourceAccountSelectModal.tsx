import React from 'react';
import { View, Text } from 'react-native';
import { BottomSheet, BottomSheetScrollView, Button } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Account } from '../types';
import { styles } from '../styles/accounts.styles';

interface SourceAccountSelectModalProps {
  visible: boolean;
  onClose: () => void;
  accountsList: Account[];
  onSelectAccount: (accountId: string) => void;
  title?: string;
}

export const SourceAccountSelectModal: React.FC<SourceAccountSelectModalProps> = ({
  visible,
  onClose,
  accountsList,
  onSelectAccount,
  title = 'Select Source Account',
}) => {
  const { colors } = useAppTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} height="50%">
      <BottomSheetScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
        <View style={styles.optionsRow}>
          {accountsList.map((a) => (
            <Button
              key={a.id}
              label={a.name}
              onPress={() => onSelectAccount(a.id)}
              variant="outline"
              size="sm"
              style={styles.categorySelectItemBtn}
              accessibilityLabel={`Select account ${a.name}`}
              accessibilityRole="button"
            />
          ))}
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};
