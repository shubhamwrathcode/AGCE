import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { AppText } from '.';
import { buttonHeight } from '../theme/dimens';
import { BLACK, FIFTEEN, MEDIUM, SEMI_BOLD, SIXTEEN, WHITE } from './AppText';
import { colors } from '../theme/colors';
import TouchableOpacityView from './TouchableOpacityView';
import { useAppSelector } from '../store/hooks';

interface ButtonProps extends TouchableOpacityProps {
  children?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  isSecond?: boolean;
  loading?: boolean;
}

const Button = ({
  children,
  containerStyle,
  titleStyle,
  disabled,
  onPress,
  isSecond,
  loading,
  ...rest
}: ButtonProps) => {
  const theme = useAppSelector(state => state.auth.theme);
  return (
    <TouchableOpacityView
      style={[
        styles.buttonStyle,
        { backgroundColor: theme === 'Dark' ? colors.orangeTheme : colors.buttonBg },
        containerStyle,
        disabled || loading ? { opacity: 0.3 } : {},
      ]}
      disabled={disabled || loading}
      onPress={
        disabled || loading ? undefined : onPress
      }
      {...rest}>
      {loading ? (
        <ActivityIndicator size={'small'} color={theme === 'Dark' ? colors.white : colors.white} />
      ) : (
        typeof children === 'string' ? (
          <AppText
            type={SIXTEEN}
            weight={SEMI_BOLD}
            style={StyleSheet.flatten([{ color: theme === 'Dark' ? colors.black : colors.white }, titleStyle])}>
            {children}
          </AppText>
        ) : (
          children
        )
      )}
    </TouchableOpacityView>
  );
};
const styles = StyleSheet.create({
  buttonStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: buttonHeight,
    borderRadius: 50,
    backgroundColor: colors.buttonBg,
  },
});

export { Button };
