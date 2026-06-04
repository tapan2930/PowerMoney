import { create } from 'zustand';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  cancelable?: boolean;
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  options: AlertOptions;

  showAlert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: '',
  buttons: [],
  options: {},

  showAlert: (title, message = '', buttons = [{ text: 'OK' }], options = {}) =>
    set({ visible: true, title, message, buttons, options }),

  hideAlert: () =>
    set({ visible: false, title: '', message: '', buttons: [], options: {} }),
}));
