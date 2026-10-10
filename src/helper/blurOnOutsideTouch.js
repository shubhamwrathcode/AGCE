import { TextInput, findNodeHandle } from "react-native";

const isTouchOnInput = (event, input) => {
  if (event?.target === input) return true;
  const tag = findNodeHandle(input);
  return tag != null && (event?.nativeEvent?.target === tag || event?.target === tag);
};

/**
 * Use as `onTouchStart` on a screen root. Web-like blur: a touch anywhere outside the focused
 * input (including buttons and order book rows, which keyboardShouldPersistTaps lets through)
 * blurs it, so the input's onBlur runs.
 */
export const blurFocusedInputOnOutsideTouch = (event) => {
  const focused = TextInput.State.currentlyFocusedInput?.();
  if (!focused || isTouchOnInput(event, focused)) return;
  focused.blur?.();
};
