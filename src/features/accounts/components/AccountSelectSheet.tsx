import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing } from '@/constants/theme';
import { BottomSheet, BottomSheetScrollView } from '@/components/ui/BottomSheet';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Account } from '../types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface AccountSelectSheetProps {
  visible: boolean;
  onClose: () => void;
  accounts: Account[];
  selectedAccountIds: string[];
  onChange: (ids: string[]) => void;
}

export function AccountSelectSheet({
  visible,
  onClose,
  accounts,
  selectedAccountIds,
  onChange,
}: AccountSelectSheetProps) {
  const { colors } = useAppTheme();

  const handleToggleAccount = (id: string) => {
    if (selectedAccountIds.includes(id)) {
      onChange(selectedAccountIds.filter((x) => x !== id));
    } else {
      onChange([...selectedAccountIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedAccountIds.length === accounts.length) {
      onChange([]);
    } else {
      onChange(accounts.map((a) => a.id));
    }
  };

  const isAllSelected = accounts.length > 0 && selectedAccountIds.length === accounts.length;

  return (
    <BottomSheet visible={visible} onClose={onClose} height="65%">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Filter by Accounts</Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close accounts sheet"
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={handleSelectAll}
          accessibilityRole="button"
          accessibilityLabel={isAllSelected ? "Deselect all accounts" : "Select all accounts"}
          style={styles.selectAllPressable}
        >
          <Text style={[styles.selectAllText, { color: colors.primary }]}>
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Text>
        </Pressable>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {selectedAccountIds.length} selected
        </Text>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
        {accounts.map((account) => {
          const isChecked = selectedAccountIds.includes(account.id);
          return (
            <Pressable
              key={account.id}
              onPress={() => handleToggleAccount(account.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked }}
              accessibilityLabel={account.name}
              style={({ pressed }) => [
                styles.optionRow,
                {
                  backgroundColor: pressed ? `${colors.border}50` : 'transparent',
                },
              ]}
            >
              <View style={styles.optionLeft}>
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => handleToggleAccount(account.id)}
                  haptic
                />
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: account.color || colors.primary },
                  ]}
                />
                <Text style={[styles.accountName, { color: colors.text }]}>
                  {account.name}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                  {account.type.replace('_', ' ')}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </BottomSheetScrollView>

      <View style={styles.footer}>
        <Button
          label="Done"
          onPress={onClose}
          variant="primary"
          size="md"
          style={styles.doneButton}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    padding: Spacing.one,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  selectAllPressable: {
    paddingVertical: Spacing.one,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
    marginVertical: Spacing.half,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: Spacing.two,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one / 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    paddingTop: Spacing.two,
  },
  doneButton: {
    width: '100%',
  },
});
