import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { styles } from '../styles/accounts.styles';

interface AccountsHeaderProps {
  viewMode: 'carousel' | 'list';
  onToggleViewMode: () => void;
  onImportPress: () => void;
  onAddAccountPress: () => void;
}

export const AccountsHeader: React.FC<AccountsHeaderProps> = ({
  viewMode,
  onToggleViewMode,
  onImportPress,
  onAddAccountPress,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.text }]}>Accounts & Ledgers</Text>
      <View style={styles.actionButtons}>
        <Button
          label=""
          onPress={onToggleViewMode}
          variant="outline"
          size="sm"
          leftIcon={
            <Ionicons
              name={viewMode === 'carousel' ? 'list-sharp' : 'grid-sharp'}
              size={20}
              color={colors.textSecondary}
            />
          }
          style={styles.headerBtn}
          accessibilityLabel="Toggle View Mode"
          accessibilityRole="button"
        />
        <Button
          label=""
          onPress={onImportPress}
          variant="outline"
          size="sm"
          leftIcon={<Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />}
          style={styles.headerBtn}
          accessibilityLabel="Import Statement PDF"
          accessibilityRole="button"
        />
        <Button
          label=""
          onPress={onAddAccountPress}
          variant="secondary"
          size="sm"
          leftIcon={<Ionicons name="add" size={20} color={colors.primary} />}
          style={styles.headerBtn}
          accessibilityLabel="Add New Account"
          accessibilityRole="button"
        />
      </View>
    </View>
  );
};
