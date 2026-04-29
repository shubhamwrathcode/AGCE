import React from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import {
  borderWidth,
  inputHeight,
  smallButtonHeight,
  universalPaddingHorizontal,
} from "../theme/dimens";
import { fontFamily, fontFamilyMedium } from "../theme/typography";
import { colors } from "../theme/colors";
import { eye_close_icon, eye_open_icon } from "../helper/ImageAssets";
import TouchableOpacityView from "./TouchableOpacityView";
import FastImage from "react-native-fast-image";
import { Button } from "./Button";
import { AppText, BLACK, FOURTEEN, SECOND, SEMI_BOLD, WHITE } from "./AppText";
import { useAppSelector } from "../store/hooks";

interface InputProps extends TextInputProps {
  value?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  hasError?: boolean;
  isSecure?: boolean;
  onPressVisible?: () => void;
  isOtp?: boolean;
  onSendOtp?: () => void;
  otpText?: string;
  title?: string;
  mainContainer?: StyleProp<ViewStyle>;
  currency?: string;
  onfocus?: any;
  assignRef?: any;
  max?: any;
  onMax?: () => void;
  isOtpDisabled?: boolean;
}

import { useTheme } from "../hooks/useTheme";

const Input = ({
  value,
  placeholder,
  onChangeText,
  onEndEditing,
  keyboardType,
  assignRef,
  onSubmitEditing,
  multiline,
  containerStyle,
  inputStyle,
  hasError = false,
  onPressVisible,
  secureTextEntry,
  isSecure,
  isOtp,
  onSendOtp,
  otpText,
  title,
  mainContainer,
  currency,
  onfocus,
  onBlur,
  max,
  onMax,
  isOtpDisabled,
  ...props
}: InputProps) => {
  const { colors: themeColors, isDark } = useTheme();
  const resolvedInputBg = themeColors.input;
  
  return (
    <View style={[styles.inputWrapper, mainContainer]}>
      {title && <AppText style={[styles.title, { color: themeColors.text }]} weight={SEMI_BOLD}>{title}</AppText>}
      <View
        style={[
          styles.container,
          {
            backgroundColor: resolvedInputBg,
            borderColor: hasError ? colors.red : isDark ? themeColors.border : "transparent",
            borderWidth: hasError ? 1 : isDark ? 1 : 0,
            ...(title ? { marginTop: 0 } : {}),
          },
          containerStyle && typeof containerStyle === "object" ? containerStyle : undefined,
        ]}
      >
        <TextInput
          {...props}
          placeholder={placeholder}
          placeholderTextColor={isDark ? colors.disabledText : colors.placeholderColor}
          autoCorrect={false}
          style={[styles.inputF, inputStyle, { color: themeColors.text }]}
          value={value}
          onChangeText={onChangeText}
          onEndEditing={onEndEditing}
          onSubmitEditing={onSubmitEditing}
          keyboardType={keyboardType}
          ref={(component) => {
            assignRef && assignRef(component);
          }}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          onFocus={onfocus}
          onBlur={onBlur}
        />
        {isSecure && (
          <TouchableOpacityView
            style={styles.eyeIconContainer}
            onPress={onPressVisible}
          >
            <FastImage
              source={secureTextEntry ? eye_close_icon : eye_open_icon}
              style={styles.eyeIcon}
              resizeMode="contain"
              tintColor={isDark ? colors.disabledText : colors.placeholderColor}
            />
          </TouchableOpacityView>
        )}
        {max && (
          <AppText
            style={{ color: themeColors.button, marginHorizontal: 10, fontSize: 14 }}
            weight={SEMI_BOLD}
            onPress={onMax}
          >
            MAX
          </AppText>
        )}
        {isOtp && (
          <Button
            children={otpText}
            titleStyle={[styles.titleStyle,{color: themeColors.buttonText}]}
            containerStyle={[styles.containerStyle,{backgroundColor: themeColors.button}]}
            onPress={onSendOtp}
            disabled={isOtpDisabled}
          />
        )}
        {currency && (
          <AppText
            // style={styles.eyeIconContainer}
            type={FOURTEEN}
            style={{ color: themeColors.text }}
          >
            {currency}
          </AppText>
        )}
      </View>
    </View>
  );
};

export { Input };
const styles = StyleSheet.create({
  inputWrapper: {
    marginBottom: 14,
  },
  inputF: {
    fontFamily: fontFamily,
    fontSize: 14,
    // color: colors.black,
    height: inputHeight,
    flex: 1,
  },

  container: {
    marginTop: 4,
    height: inputHeight,
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 9,
    paddingHorizontal: universalPaddingHorizontal,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.newThemeColor,
  },
  eyeIcon: {
    height: 20,
    width: 20,
  },
  eyeIconContainer: {
    height: inputHeight,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  otpContainer: {
    height: smallButtonHeight,
  },
  titleStyle: {
    fontSize: 12,
    fontFamily: fontFamilyMedium,
    fontWeight: "500",
  },
  containerStyle: {
    height: smallButtonHeight,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  title: {
    marginBottom: 6,
  },
});
