import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import FastImage from "react-native-fast-image";
import { AppText, FIFTEEN, SEMI_BOLD } from "../../shared";
import { colors } from "../../theme/colors";
import { back_ic } from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";

const BACK_ICON_SIZE = 18;

const KycStepHeader = ({ title, theme = "Dark", onBackPress }) => {
  const isDark = theme === "Dark";
  const textColor = isDark ? colors.white : colors.black;
  const onPress = onBackPress ?? (() => NavigationService.goBack());

  return (
    <View style={styles.headerRow}>
      <TouchableOpacity onPress={onPress} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <FastImage
          source={back_ic}
          resizeMode="contain"
          style={[styles.backIcon, { width: BACK_ICON_SIZE, height: BACK_ICON_SIZE }]}
          tintColor={textColor}
        />
      </TouchableOpacity>
      <AppText
        type={FIFTEEN}
        weight={SEMI_BOLD}
        style={[styles.headerTitle, { color: textColor }]}
        numberOfLines={2}
      >
        {title}
      </AppText>
      <View style={[styles.placeholder, { width: BACK_ICON_SIZE, height: BACK_ICON_SIZE }]} />
    </View>
  );
};

export default KycStepHeader;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backIcon: {},
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  placeholder: {},
});
