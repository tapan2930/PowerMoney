import { AlertButton, AlertOptions, useAlertStore } from '@/stores/useAlertStore';

/**
 * Imperative custom alert helper that mirrors the native `Alert.alert` API.
 *
 * Usage:
 *   CustomAlert.alert('Title', 'Message', [{ text: 'OK' }]);
 *
 * Works in hooks, event handlers, and anywhere outside of React component trees
 * because it interacts directly with the Zustand store.
 */
export const CustomAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
    error?: Error
  ) => {
    useAlertStore.getState().showAlert(title, message, buttons, options, error);
  },
};
