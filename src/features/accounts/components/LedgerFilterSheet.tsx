import { BottomSheet, BottomSheetScrollView } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { SelectMultiField } from '@/components/ui/SelectMultiField';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Account, Category } from '../types';
import { FilterDateSection } from './FilterDateSection';
import { FilterTypeSection } from './FilterTypeSection';

export interface LedgerFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  activeType: 'all' | 'income' | 'expense' | 'transfer';
  activeDateRange: { start: string | null; end: string | null };
  activeAccountIds: string[];
  activeCategoryIds: string[];
  onApply: (filters: {
    type: 'all' | 'income' | 'expense' | 'transfer';
    dateRange: { start: string | null; end: string | null };
    accountIds: string[];
    categoryIds: string[];
  }) => void;
}

export function LedgerFilterSheet({
  visible,
  onClose,
  accounts,
  categories,
  activeType,
  activeDateRange,
  activeAccountIds,
  activeCategoryIds,
  onApply,
}: LedgerFilterSheetProps) {
  const { colors } = useAppTheme();

  // Pending filter states
  const [pendingType, setPendingType] = useState(activeType);
  const [pendingStart, setPendingStart] = useState<string | null>(activeDateRange.start);
  const [pendingEnd, setPendingEnd] = useState<string | null>(activeDateRange.end);
  const [pendingAccountIds, setPendingAccountIds] = useState<string[]>(activeAccountIds);
  const [pendingCategoryIds, setPendingCategoryIds] = useState<string[]>(activeCategoryIds);

  // Sync state with props when visible changes to true
  useEffect(() => {
    if (visible) {
      setPendingType(activeType);
      setPendingStart(activeDateRange.start);
      setPendingEnd(activeDateRange.end);
      setPendingAccountIds(activeAccountIds);
      setPendingCategoryIds(activeCategoryIds);
    }
  }, [visible, activeType, activeDateRange, activeAccountIds, activeCategoryIds]);

  const handleApply = () => {
    onApply({
      type: pendingType,
      dateRange: { start: pendingStart, end: pendingEnd },
      accountIds: pendingAccountIds,
      categoryIds: pendingCategoryIds,
    });
    onClose();
  };

  const handleReset = () => {
    setPendingType('all');
    setPendingStart(null);
    setPendingEnd(null);
    setPendingAccountIds([]);
    setPendingCategoryIds([]);
  };

  const accountOptions = useMemo(() => {
    return accounts.map((account) => ({
      key: account.id,
      label: account.name,
      color: account.color || undefined,
      icon: account.icon || 'wallet-outline',
    }));
  }, [accounts]);

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      key: category.id,
      label: category.name,
      color: category.color || undefined,
      icon: category.icon || 'pricetag-outline',
    }));
  }, [categories]);

  return (
    <BottomSheet visible={visible} onClose={onClose} height="80%">
      {/* Title Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={handleReset}
          accessibilityRole="button"
          accessibilityLabel="Reset all filters"
          style={styles.resetButton}
        >
          <Text style={[styles.resetText, { color: colors.primary }]}>Reset All</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Filters</Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close filter sheet"
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
        {/* Transaction Type */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Transaction Type
          </Text>
          <FilterTypeSection type={pendingType} onChange={setPendingType} />
        </View>

        {/* Date Range */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Date Range
          </Text>
          <FilterDateSection
            startDate={pendingStart}
            endDate={pendingEnd}
            onChange={(start, end) => {
              setPendingStart(start);
              setPendingEnd(end);
            }}
          />
        </View>

        {/* Accounts Selection */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Accounts
          </Text>
          <SelectMultiField
            values={pendingAccountIds}
            options={accountOptions}
            onSelect={setPendingAccountIds}
            placeholder="All Accounts"
            searchable
            searchPlaceholder="Search accounts..."
          />
        </View>

        {/* Categories Selection */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Categories
          </Text>
          <SelectMultiField
            values={pendingCategoryIds}
            options={categoryOptions}
            onSelect={setPendingCategoryIds}
            placeholder="All Categories"
            searchable
            searchPlaceholder="Search categories..."
          />
        </View>
      </BottomSheetScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <Button
          label="Apply Filters"
          onPress={handleApply}
          variant="primary"
          size="lg"
          style={styles.applyButton}
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
  resetButton: {
    paddingVertical: Spacing.one,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    padding: Spacing.one,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  sectionContainer: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    paddingTop: Spacing.two,
  },
  applyButton: {
    width: '100%',
  },
});
