import Toast from 'react-native-simple-toast';

export const showError = (err: any) => {
  let temp = err?.toString();
  Toast.showWithGravity(temp, Toast.LONG, Toast.BOTTOM);
};

export const showSuccess = (message: string) => {
  Toast.showWithGravity(message, Toast.LONG, Toast.BOTTOM);
};

const toTitleCase = (str?: string) => {
  if (!str) return str;
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

/** Same copy rules as web `alertErrorMessage`. */
export const alertErrorMessage = (message?: string) => {
  Toast.showWithGravity(message || 'Network error. Please try again later.', Toast.SHORT, Toast.BOTTOM);
};

/** Same copy rules as web `alertSuccessMessage` (title-cased). */
export const alertSuccessMessage = (message?: string) => {
  Toast.showWithGravity(toTitleCase(message) || 'Success', Toast.SHORT, Toast.BOTTOM);
};

export const logger = (_e: unknown) => {
  // No-op in production; use showError for user-facing errors
};
