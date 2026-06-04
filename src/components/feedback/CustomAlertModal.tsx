import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  Keyframe,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useAlertStore, AlertButton, AlertOptions } from '@/stores/useAlertStore';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Button, ButtonVariant } from '@/components/ui/Button';
import { Haptics } from '@/utils/haptics';

/**
 * Determines which Button variant maps to the native alert button style.
 */
function getButtonVariant(
  style: AlertButton['style'],
  index: number,
  total: number,
): ButtonVariant {
  if (style === 'destructive') return 'danger';
  if (style === 'cancel') return 'outline';
  // If there is exactly one button, make it primary.
  // If there are two buttons, the non-cancel button is primary.
  if (total <= 2) return 'primary';
  // For 3+ buttons, only the first non-cancel/non-destructive is primary.
  if (index === 0) return 'primary';
  return 'outline';
}

const cardEntering = new Keyframe({
  0: {
    transform: [{ scale: 0.92 }],
    opacity: 0,
  },
  100: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.out(Easing.cubic),
  },
});

const cardExiting = new Keyframe({
  0: {
    transform: [{ scale: 1 }],
    opacity: 1,
  },
  100: {
    transform: [{ scale: 0.96 }],
    opacity: 0,
    easing: Easing.in(Easing.ease),
  },
});

export function CustomAlertModal() {
  const { colors, isDark } = useAppTheme();
  const { visible, title, message, buttons, options, hideAlert } =
    useAlertStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<{
    title: string;
    message: string;
    buttons: AlertButton[];
    options: AlertOptions;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      setCurrentAlert({ title, message, buttons, options });
      setModalVisible(true);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [visible, title, message, buttons, options]);

  const handleExitComplete = useCallback(() => {
    setModalVisible(false);
    setCurrentAlert(null);
  }, []);

  const handleButtonPress = useCallback(
    (button: AlertButton) => {
      Haptics.impact('light');
      hideAlert();
      // Execute the callback after hiding — ensures the modal is dismissed first.
      if (button.onPress) {
        // Small delay to let the exit animation start before running the action.
        setTimeout(() => button.onPress?.(), 50);
      }
    },
    [hideAlert],
  );

  const handleBackdropPress = useCallback(() => {
    if (currentAlert?.options.cancelable) {
      hideAlert();
    }
  }, [currentAlert, hideAlert]);

  if (!modalVisible || !currentAlert) return null;

  // Determine layout: side-by-side for exactly 2 buttons, stacked otherwise.
  const isSideBySide = currentAlert.buttons.length === 2;

  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="none"
      visible={modalVisible}
      onRequestClose={handleBackdropPress}
    >
      {isOpen && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150).withCallback((finished) => {
            'worklet';
            if (finished) {
              runOnJS(handleExitComplete)();
            }
          })}
          style={styles.backdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />

          <Animated.View
            entering={cardEntering.duration(200)}
            exiting={cardExiting.duration(150)}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: isDark ? '#000' : '#6B7280',
              },
            ]}
          >
            {/* Title */}
            <Text
              style={[styles.title, { color: colors.text }]}
              accessibilityRole="header"
            >
              {currentAlert.title}
            </Text>

            {/* Message */}
            {currentAlert.message.length > 0 && (
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {currentAlert.message}
              </Text>
            )}

            {/* Buttons */}
            <View
              style={[
                styles.buttonContainer,
                isSideBySide ? styles.buttonRow : styles.buttonColumn,
              ]}
            >
              {currentAlert.buttons.map((btn, idx) => {
                const variant = getButtonVariant(btn.style, idx, currentAlert.buttons.length);
                return (
                  <Button
                    key={`alert-btn-${idx}`}
                    label={btn.text}
                    onPress={() => handleButtonPress(btn)}
                    variant={variant}
                    size="md"
                    style={isSideBySide ? styles.sideBySideBtn : styles.stackedBtn}
                    accessibilityLabel={btn.text}
                    accessibilityRole="button"
                  />
                );
              })}
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  buttonColumn: {
    flexDirection: 'column',
  },
  sideBySideBtn: {
    flex: 1,
  },
  stackedBtn: {
    alignSelf: 'stretch',
  },
});
