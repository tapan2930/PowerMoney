import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BottomSheet, BottomSheetScrollView } from './BottomSheet';
import { TextInput } from './TextInput';

export interface SelectOption {
  key: string;
  label: string;
  icon?: string;
  color?: string;
}

export interface SelectFieldProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onSelect: (key: string) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function SelectField({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select option',
  searchable = false,
  searchPlaceholder = 'Search...',
  containerStyle,
}: SelectFieldProps) {
  const { colors } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.key === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchable, searchQuery]);

  const handleSelect = (key: string) => {
    onSelect(key);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

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
        accessibilityLabel={`${label || 'Select'}: ${selectedOption ? selectedOption.label : placeholder}`}
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
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <Ionicons
                  name={selectedOption.icon as any}
                  size={20}
                  color={selectedOption.color || colors.primary}
                  style={styles.leftIcon}
                />
              )}
              <Text style={[styles.valueText, { color: colors.text }]}>
                {selectedOption.label}
              </Text>
            </>
          ) : (
            <Text style={[styles.placeholderText, { color: colors.textSecondary + '80' }]}>
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
            {label ? `Select ${label}` : 'Select Option'}
          </Text>
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close select modal"
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color={colors.text} />
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
            filteredOptions.map((opt) => {
              const isSelected = opt.key === value;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => handleSelect(opt.key)}
                  accessibilityRole="radio"
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

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              );
            })
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
    padding: 4,
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
