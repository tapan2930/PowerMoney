import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BottomSheet, BottomSheetScrollView } from './BottomSheet';
import { TextInput } from './TextInput';
import { SelectOption } from './SelectField';

export interface SelectMultiFieldProps {
  label?: string;
  values: string[];
  options: SelectOption[];
  onSelect: (keys: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function SelectMultiField({
  label,
  values,
  options,
  onSelect,
  placeholder = 'Select options',
  searchable = false,
  searchPlaceholder = 'Search...',
  containerStyle,
}: SelectMultiFieldProps) {
  const { colors } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOptions = useMemo(() => {
    return options.filter((opt) => values.includes(opt.key));
  }, [options, values]);

  const displayValue = useMemo(() => {
    if (selectedOptions.length === 0) return placeholder;
    if (selectedOptions.length <= 2) {
      return selectedOptions.map((o) => o.label).join(', ');
    }
    return `${selectedOptions.length} selected`;
  }, [selectedOptions, placeholder]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchable, searchQuery]);

  const handleToggle = (key: string) => {
    const isSelected = values.includes(key);
    const newValues = isSelected
      ? values.filter((v) => v !== key)
      : [...values, key];
    onSelect(newValues);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSelectAll = () => {
    const allKeys = filteredOptions.map((o) => o.key);
    const allSelected = allKeys.every((k) => values.includes(k));
    if (allSelected) {
      onSelect(values.filter((k) => !allKeys.includes(k)));
    } else {
      onSelect([...new Set([...values, ...allKeys])]);
    }
  };

  const isAllSelected = useMemo(() => {
    if (filteredOptions.length === 0) return false;
    return filteredOptions.every((o) => values.includes(o.key));
  }, [filteredOptions, values]);

  const firstSelectedWithIcon = selectedOptions.find((o) => o.icon);

  return (
    <View style={[styles.outerContainer, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}

      <Pressable
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label || 'Select'}: ${displayValue}`}
        style={({ pressed }) => [
          styles.fieldContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.valueContainer}>
          {selectedOptions.length > 0 ? (
            <>
              {firstSelectedWithIcon?.icon && (
                <Ionicons
                  name={firstSelectedWithIcon.icon as any}
                  size={20}
                  color={firstSelectedWithIcon.color || colors.primary}
                  style={styles.leftIcon}
                />
              )}
              <Text style={[styles.valueText, { color: colors.text }]} numberOfLines={1}>
                {displayValue}
              </Text>
            </>
          ) : (
            <Text style={[styles.placeholderText, { color: `${colors.textSecondary}80` }]}>
              {placeholder}
            </Text>
          )}
        </View>

        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.textSecondary}
          style={styles.chevron}
        />
      </Pressable>

      <BottomSheet visible={isOpen} onClose={handleClose} height="60%">
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {label ? `Select ${label}` : 'Select Options'}
          </Text>
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close select modal"
            style={styles.closeBtn}
          >
            <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
          </Pressable>
        </View>

        {searchable && (
          <View style={styles.searchContainer}>
            <TextInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              isBottomSheetInput
              leftIcon="search-outline"
            />
          </View>
        )}

        <BottomSheetScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {filteredOptions.length > 0 ? (
            <>
              <View style={styles.selectAllRow}>
                <Pressable
                  onPress={handleSelectAll}
                  accessibilityRole="button"
                  accessibilityLabel={isAllSelected ? 'Deselect all' : 'Select all'}
                  style={styles.selectAllBtn}
                >
                  <Text style={[styles.selectAllText, { color: colors.primary }]}>
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </Text>
                </Pressable>
              </View>

              {filteredOptions.map((opt) => {
                const isSelected = values.includes(opt.key);
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => handleToggle(opt.key)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={opt.label}
                    style={({ pressed }) => [
                      styles.optionRow,
                      {
                        backgroundColor: isSelected
                          ? colors.primary + '10'
                          : pressed
                            ? colors.border + '50'
                            : 'transparent',
                      },
                    ]}
                  >
                    <View style={styles.optionLeft}>
                      {opt.icon && (
                        <Ionicons
                          name={opt.icon as any}
                          size={20}
                          color={opt.color || (isSelected ? colors.primary : colors.textSecondary)}
                          style={styles.optionIcon}
                        />
                      )}
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>

                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No options found
              </Text>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    paddingLeft: 4,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftIcon: {
    marginRight: 12,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  selectAllBtn: {
    padding: 4,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginVertical: 4,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
