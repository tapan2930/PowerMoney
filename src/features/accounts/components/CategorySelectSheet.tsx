import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing } from '@/constants/theme';
import { BottomSheet, BottomSheetScrollView } from '@/components/ui/BottomSheet';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Category } from '../types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface CategorySelectSheetProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryIds: string[];
  onChange: (ids: string[]) => void;
}

export function CategorySelectSheet({
  visible,
  onClose,
  categories,
  selectedCategoryIds,
  onChange,
}: CategorySelectSheetProps) {
  const { colors } = useAppTheme();

  const handleToggleCategory = (id: string) => {
    if (selectedCategoryIds.includes(id)) {
      onChange(selectedCategoryIds.filter((x) => x !== id));
    } else {
      onChange([...selectedCategoryIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCategoryIds.length === categories.length) {
      onChange([]);
    } else {
      onChange(categories.map((c) => c.id));
    }
  };

  const isAllSelected = categories.length > 0 && selectedCategoryIds.length === categories.length;

  const expenseCategories = useMemo(() => categories.filter((c) => c.type === 'expense'), [categories]);
  const incomeCategories = useMemo(() => categories.filter((c) => c.type === 'income'), [categories]);

  const renderCategoryItem = (category: Category) => {
    const isChecked = selectedCategoryIds.includes(category.id);
    const catColor = category.color || colors.primary;
    const catIcon = category.icon || 'cart';

    return (
      <Pressable
        key={category.id}
        onPress={() => handleToggleCategory(category.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isChecked }}
        accessibilityLabel={category.name}
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
            onCheckedChange={() => handleToggleCategory(category.id)}
            haptic
          />
          <View style={[styles.iconBg, { backgroundColor: `${catColor}15` }]}>
            <Ionicons name={catIcon as any} size={16} color={catColor} />
          </View>
          <Text style={[styles.categoryName, { color: colors.text }]}>
            {category.name}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height="75%">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Filter by Categories</Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close categories sheet"
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={handleSelectAll}
          accessibilityRole="button"
          accessibilityLabel={isAllSelected ? "Deselect all categories" : "Select all categories"}
          style={styles.selectAllPressable}
        >
          <Text style={[styles.selectAllText, { color: colors.primary }]}>
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Text>
        </Pressable>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {selectedCategoryIds.length} selected
        </Text>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
        {expenseCategories.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Expense Categories</Text>
            {expenseCategories.map(renderCategoryItem)}
          </>
        )}

        {incomeCategories.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Income Categories</Text>
            {incomeCategories.map(renderCategoryItem)}
          </>
        )}
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
    marginVertical: Spacing.half,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.two,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
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
