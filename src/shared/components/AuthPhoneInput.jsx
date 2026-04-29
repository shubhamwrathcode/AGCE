import React, { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import FastImage from "react-native-fast-image";
import CountryPicker from "react-native-country-picker-modal";
import { downIcon } from "../../helper/ImageAssets";
import { useTheme } from "../../hooks/useTheme";
import { colors } from "../../theme/colors";
import { borderWidth, inputHeight, universalPaddingHorizontal } from "../../theme/dimens";
import TouchableOpacityView from "./TouchableOpacityView";
import { AppText } from "..";

const AuthPhoneInput = ({
  value,
  onChangeText,
  placeholder,
  onSelectCountry,
  onCountry,
  country,
  countryCode,
  hasError = false,
  maxLength = 15,
  onFocus = () => {},
  onBlur = () => {},
  onSubmitEditing = () => {},
  onEndEditing = () => {},
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.input,
          borderColor: hasError ? colors.red : isDark ? themeColors.border : "transparent",
          borderWidth: hasError ? 1 : isDark ? borderWidth : 0,
        },
      ]}
    >
      <TouchableOpacityView style={styles.leftSection} onPress={() => setPickerVisible(true)}>
        <CountryPicker
          onSelect={(countryItem) => {
            onCountry(countryItem.cca2);
            onSelectCountry(countryItem.callingCode);
            setPickerVisible(false);
          }}
          withFilter
          withCallingCode={false}
          withEmoji
          countryCode={country}
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          containerButtonStyle={styles.countryButton}
          theme={
            isDark
              ? {
                  backgroundColor: themeColors.background,
                  onBackgroundTextColor: themeColors.text,
                  fontSize: 14,
                  itemHeight: 50,
                  flagSize: 20,
                }
              : undefined
          }
        />
        <FastImage
          source={downIcon}
          resizeMode="contain"
          style={styles.downArrow}
          tintColor={themeColors.text}
        />
        <AppText style={[styles.codeText, { color: themeColors.text }]}>
          +{countryCode?.[0] || "91"}
        </AppText>
      </TouchableOpacityView>
      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={isDark ? colors.disabledText : colors.placeholderColor}
        style={[styles.input, { color: themeColors.text }]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        autoCapitalize="none"
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        onSubmitEditing={onSubmitEditing}
        onEndEditing={onEndEditing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    marginTop: 4,
    height: inputHeight,
    borderRadius: 12,
    paddingHorizontal: universalPaddingHorizontal,
    flexDirection: "row",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 2,
  },
  countryButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  downArrow: {
    width: 9,
    height: 9,
    marginLeft: 4,
  },
  codeText: {
    marginLeft: 6,
    fontSize: 15,
    minWidth: 30,
  },
  divider: {
    width: 1,
    height: 30,
    marginHorizontal: 8,
  },
  input: {
    flex: 1,
    height: inputHeight,
    fontSize: 14,
  },
});

export default AuthPhoneInput;
