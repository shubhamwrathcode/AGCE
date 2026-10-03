import { useAppSelector } from "../store/hooks";
import { lightTheme, darkTheme } from "../theme/colors";

const LIGHT = {
  colors: lightTheme,
  isDark: false,
  theme: "Light" as const,
};

const DARK = {
  colors: darkTheme,
  isDark: true,
  theme: "Dark" as const,
};

// Same object per theme, so consumers can use it in memo/effect dependencies.
export const useTheme = () => {
  const theme = useAppSelector((state) => state.auth.theme);
  return theme === "Light" ? LIGHT : DARK;
};
