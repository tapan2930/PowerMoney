import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface FilterChipProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  onPress: () => void;
  onClear?: () => void;
}

export function FilterChip({
  label,
  icon,
  isActive,
  onPress,
  onClear,
}: FilterChipProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isActive ? `${colors.primary}15` : colors.surface,
          borderColor: isActive ? colors.primary : colors.border,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label} filter`}
        style={({ pressed }) => [
          styles.chipPressable,
          {
            opacity: pressed ? 0.7 : 1,
            paddingRight: isActive && onClear ? Spacing.one : Spacing.three,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon as any}
            size={15}
            color={isActive ? colors.primary : colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            {
              color: isActive ? colors.primary : colors.text,
              fontWeight: isActive ? '600' : '400',
            },
          ]}
        >
          {label}
        </Text>
        {!isActive && (
          <Ionicons
            name="chevron-down"
            size={12}
            color={colors.textSecondary}
            style={styles.chevron}
          />
        )}
      </Pressable>

      {isActive && onClear && (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel={`Clear ${label} filter`}
          style={({ pressed }) => [
            styles.clearPressable,
            {
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons
            name="close-circle"
            size={16}
            color={colors.primary}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    height: 36,
    marginRight: Spacing.two,
    marginVertical: Spacing.one,
  },
  chipPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingLeft: Spacing.three,
  },
  leftIcon: {
    marginRight: Spacing.one,
  },
  label: {
    fontSize: 13,
  },
  chevron: {
    marginLeft: Spacing.one,
  },
  clearPressable: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: Spacing.two,
  },
});
