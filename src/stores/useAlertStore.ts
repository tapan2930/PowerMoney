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
  error?: Error;

  showAlert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
    error?: Error
  ) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: '',
  buttons: [],
  options: {},
  error: undefined,

  showAlert: (title, message = '', buttons = [{ text: 'OK' }], options = {}, error?: Error) =>
    set({ visible: true, title, message, buttons, options, error }),

  hideAlert: () =>
    set({ visible: false, title: '', message: '', buttons: [], options: {}, error: undefined }),
}));
