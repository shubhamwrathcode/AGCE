import React from "react";
import { StyleSheet, View } from "react-native";
import FastImage from "react-native-fast-image";
import { AppText, BOLD, TWENTY_SIX } from "..";
import TouchableOpacityView from "./TouchableOpacityView";
import { closeIcon, headPhoneIcon, logobg } from "../../helper/ImageAssets";
import { useTheme } from "../../hooks/useTheme";

/**
 * Auth flows: logo (left), support + close (right), optional screen title below.
 */
const AuthHeader = ({ onSupportPress, onClosePress, title }) => {
  const { colors: themeColors, isDark } = useTheme();
  const logoBg = isDark ? themeColors.card : "#F5F0E8";

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={[styles.logoWrap, { backgroundColor: logoBg }]}>
          <FastImage source={logobg} style={styles.logoImg} resizeMode="cover" />
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacityView onPress={onSupportPress} style={styles.headerIconBtn}>
            <FastImage
              source={headPhoneIcon}
              resizeMode="contain"
              style={styles.headerIcon}
              tintColor={themeColors.text}
            />
          </TouchableOpacityView>
          <TouchableOpacityView onPress={onClosePress} style={styles.headerIconBtn}>
            <FastImage
              source={closeIcon}
              resizeMode="contain"
              style={styles.headerIcon}
              tintColor={themeColors.text}
            />
          </TouchableOpacityView>
        </View>
      </View>
      {title ? (
        <AppText
          style={{ marginTop: 8, marginBottom: 4, color: themeColors.text }}
          weight={BOLD}
          type={TWENTY_SIX}
        >
          {title}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 4,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  logoImg: {
    width: "100%",
    height: "100%",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerIconBtn: {
    padding: 8,
  },
  headerIcon: {
    width: 18,
    height: 18,
  },
});

export default AuthHeader;
