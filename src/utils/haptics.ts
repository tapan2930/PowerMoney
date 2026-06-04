import * as ExpoHaptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback wrapper.
 * Checks for Platform.OS to avoid errors on Web or other unsupported platforms.
 */
export const Haptics = {
  selection: () => {
    if (Platform.OS === 'web') return;
    ExpoHaptics.selectionAsync().catch(() => {});
  },

  impact: (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'web') return;
    let feedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Light;

    if (style === 'medium') {
      feedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Medium;
    } else if (style === 'heavy') {
      feedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Heavy;
    }

    ExpoHaptics.impactAsync(feedbackStyle).catch(() => {});
  },

  notification: (type: 'success' | 'warning' | 'error') => {
    if (Platform.OS === 'web') return;
    let feedbackType = ExpoHaptics.NotificationFeedbackType.Success;

    if (type === 'warning') {
      feedbackType = ExpoHaptics.NotificationFeedbackType.Warning;
    } else if (type === 'error') {
      feedbackType = ExpoHaptics.NotificationFeedbackType.Error;
    }

    ExpoHaptics.notificationAsync(feedbackType).catch(() => {});
  },
};
