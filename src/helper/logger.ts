import Toast from 'react-native-simple-toast';

export const showError = (err: any) => {
  let temp = err?.toString();
  Toast.showWithGravity(temp, Toast.LONG, Toast.BOTTOM);
};

export const showSuccess = (message: string) => {
  Toast.showWithGravity(message, Toast.LONG, Toast.BOTTOM);
};

export const logger = (_e: unknown) => {
  // No-op in production; use showError for user-facing errors
};
