import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetTextInput } from '@expo/ui/community/bottom-sheet';
import React, { useState } from 'react';
import { Pressable, TextInput as RNTextInput, StyleSheet, Text, View } from 'react-native';

export interface TextInputProps extends React.ComponentProps<typeof RNTextInput> {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: React.ReactNode;
  containerStyle?: any;
  isBottomSheetInput?: boolean;
}

export function TextInput({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  onFocus,
  onBlur,
  secureTextEntry,
  isBottomSheetInput = false,
  style,
  ...props
}: TextInputProps) {
  const { colors } = useAppTheme();
  const InputComponent = isBottomSheetInput ? BottomSheetTextInput : RNTextInput;

  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const isPassword = secureTextEntry;
  const isSecure = isPassword && !showPassword;

  return (
    <View style={[styles.outerContainer, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error
              ? colors.danger
              : isFocused
                ? colors.primary
                : colors.border,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.leftIcon}
          />
        )}

        <InputComponent
          placeholderTextColor={colors.textSecondary + '80'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isSecure}
          style={[
            styles.input,
            { color: colors.text },
            style,
          ]}
          {...props}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIconPressable}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : rightIcon ? (
          <View style={styles.rightIconContainer}>{rightIcon}</View>
        ) : null}
      </View>

      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {error}
        </Text>
      )}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '500',
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIconPressable: {
    padding: 4,
  },
  rightIconContainer: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    paddingLeft: 4,
  },
});
