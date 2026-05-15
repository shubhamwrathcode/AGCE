import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import FastImage from "react-native-fast-image";
import { AppText, FIFTEEN, SEMI_BOLD, SIXTEEN, TWENTY } from "../../shared";
import { colors } from "../../theme/colors";
import { back_ic, headPhoneIcon, helpicon, INFO } from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";

const BACK_ICON_SIZE = 18;
const INFO_ICON_SIZE = 22;

const KycStepHeader = ({ title, theme = "Dark", onBackPress, onInfoPress, onSupportPress }) => {
  const isDark = theme === "Dark";
  const textColor = isDark ? colors.white : colors.black;
  const onPress = onBackPress ?? (() => NavigationService.goBack());

  return (
    <View style={styles.headerRow}>
      <TouchableOpacity
        onPress={onPress}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.actionBtn}
      >
        <FastImage
          source={back_ic}
          resizeMode="contain"
          style={[styles.backIcon, { width: BACK_ICON_SIZE, height: BACK_ICON_SIZE }]}
          tintColor={textColor}
        />
      </TouchableOpacity>

      <AppText
        type={TWENTY}
        weight={SEMI_BOLD}
        style={[styles.headerTitle, { color: textColor, left: 10 }]}
        numberOfLines={1}
      >
        {title}
      </AppText>

      <TouchableOpacity
        onPress={onInfoPress}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={[styles.actionBtn, { alignItems: 'flex-end' }]}
        disabled={!onInfoPress}
      >
        {onInfoPress ? (
          <FastImage
            source={INFO}
            resizeMode="contain"
            style={{ width: INFO_ICON_SIZE, height: INFO_ICON_SIZE }}
            tintColor={textColor}
          />
        ) : (
          <View style={{ width: INFO_ICON_SIZE, height: INFO_ICON_SIZE }} />
        )}
      </TouchableOpacity>


      <TouchableOpacity
        onPress={onSupportPress}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={[styles.actionBtn, { alignItems: 'flex-end' }]}
        disabled={!onInfoPress}
      >
        {onInfoPress ? (
          <FastImage
            source={headPhoneIcon}
            resizeMode="contain"
            style={{ width: INFO_ICON_SIZE, height: INFO_ICON_SIZE }}
            tintColor={textColor}
          />
        ) : (
          <View style={{ width: INFO_ICON_SIZE, height: INFO_ICON_SIZE }} />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default KycStepHeader;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    height: 60,
  },
  actionBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  backIcon: {},
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
});
