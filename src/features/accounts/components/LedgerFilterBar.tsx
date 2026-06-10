import { FilterChip, TextInput } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Account, Category } from '../types';
import { LedgerFilterSheet } from './LedgerFilterSheet';

export interface LedgerFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateRange: { start: string | null; end: string | null };
  setDateRange: (range: { start: string | null; end: string | null }) => void;
  accounts: Account[];
  selectedAccountIds: string[];
  setSelectedAccountIds: (ids: string[]) => void;
  categories: Category[];
  selectedCategoryIds: string[];
  setSelectedCategoryIds: (ids: string[]) => void;
  selectedType: 'all' | 'income' | 'expense' | 'transfer';
  setSelectedType: (type: 'all' | 'income' | 'expense' | 'transfer') => void;
  activeFilterCount: number;
  clearAllFilters: () => void;
}

export function LedgerFilterBar({
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  accounts,
  selectedAccountIds,
  setSelectedAccountIds,
  categories,
  selectedCategoryIds,
  setSelectedCategoryIds,
  selectedType,
  setSelectedType,
  activeFilterCount,
  clearAllFilters,
}: LedgerFilterBarProps) {
  const { colors } = useAppTheme();

  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);

  // Active labels calculations
  const typeLabel = useMemo(() => {
    if (selectedType === 'all') return null;
    return `Type: ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`;
  }, [selectedType]);

  const dateLabel = useMemo(() => {
    if (!dateRange.start && !dateRange.end) return null;
    if (dateRange.start && dateRange.end) {
      const formatMin = (dStr: string) => {
        return new Date(dStr + 'T00:00:00').toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
      };
      return `${formatMin(dateRange.start)} - ${formatMin(dateRange.end)}`;
    }
    if (dateRange.start) return `from ${dateRange.start}`;
    return `to ${dateRange.end}`;
  }, [dateRange]);

  const accountLabel = useMemo(() => {
    if (selectedAccountIds.length === 0) return null;
    if (selectedAccountIds.length === 1) {
      const acc = accounts.find((a) => a.id === selectedAccountIds[0]);
      return acc ? acc.name : '1 Account';
    }
    return `${selectedAccountIds.length} Accounts`;
  }, [selectedAccountIds, accounts]);

  const categoryLabel = useMemo(() => {
    if (selectedCategoryIds.length === 0) return null;
    if (selectedCategoryIds.length === 1) {
      const cat = categories.find((c) => c.id === selectedCategoryIds[0]);
      return cat ? cat.name : '1 Category';
    }
    return `${selectedCategoryIds.length} Categories`;
  }, [selectedCategoryIds, categories]);

  return (
    <View style={styles.container}>
      {/* Search & Filter Trigger Row */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search merchant or description"
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          containerStyle={styles.searchContainer}
        />
        <Pressable
          onPress={() => setIsFilterSheetVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open filters bottom sheet"
          style={({ pressed }) => [
            styles.filterToggleBtn,
            {
              backgroundColor: activeFilterCount > 0 ? `${colors.primary}15` : colors.surface,
              borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons
            name={activeFilterCount > 0 ? 'filter' : 'filter-outline'}
            size={20}
            color={activeFilterCount > 0 ? colors.primary : colors.textSecondary}
          />
          {activeFilterCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Horizontal Active Filter Tags Row */}
      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipContentContainer}
        >
          <Pressable
            onPress={clearAllFilters}
            accessibilityRole="button"
            accessibilityLabel="Clear all active filters"
            style={({ pressed }) => [
              styles.clearAllButton,
              {
                backgroundColor: `${colors.danger}15`,
                borderColor: colors.danger,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="trash-outline" size={13} color={colors.danger} />
            <Text style={[styles.clearAllText, { color: colors.danger }]}>Clear All</Text>
          </Pressable>

          {typeLabel && (
            <FilterChip
              label={typeLabel}
              isActive
              onPress={() => setIsFilterSheetVisible(true)}
              onClear={() => setSelectedType('all')}
            />
          )}

          {dateLabel && (
            <FilterChip
              label={dateLabel}
              icon="calendar-outline"
              isActive
              onPress={() => setIsFilterSheetVisible(true)}
              onClear={() => setDateRange({ start: null, end: null })}
            />
          )}

          {accountLabel && (
            <FilterChip
              label={accountLabel}
              icon="wallet-outline"
              isActive
              onPress={() => setIsFilterSheetVisible(true)}
              onClear={() => setSelectedAccountIds([])}
            />
          )}

          {categoryLabel && (
            <FilterChip
              label={categoryLabel}
              icon="pricetag-outline"
              isActive
              onPress={() => setIsFilterSheetVisible(true)}
              onClear={() => setSelectedCategoryIds([])}
            />
          )}
        </ScrollView>
      )}

      {/* Unified Filter Sheet */}
      <LedgerFilterSheet
        visible={isFilterSheetVisible}
        onClose={() => setIsFilterSheetVisible(false)}
        accounts={accounts}
        categories={categories}
        activeType={selectedType}
        activeDateRange={dateRange}
        activeAccountIds={selectedAccountIds}
        activeCategoryIds={selectedCategoryIds}
        onApply={(filters) => {
          setSelectedType(filters.type);
          setDateRange(filters.dateRange);
          setSelectedAccountIds(filters.accountIds);
          setSelectedCategoryIds(filters.categoryIds);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.two,

  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,

  },
  searchContainer: {
    flex: 1,
    marginBottom: 0,
  },
  filterToggleBtn: {
    width: 56,
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  chipRow: {
    marginHorizontal: -Spacing.four,
    marginTop: Spacing.two,
    maxHeight: 44,
  },
  chipContentContainer: {
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    height: 36,
    paddingHorizontal: Spacing.three,
    marginRight: Spacing.two,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: Spacing.one,
  },
});
