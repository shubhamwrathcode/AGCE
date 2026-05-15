import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import { AppText, MEDIUM, SEMI_BOLD } from "../../shared";
import { useTheme } from "../../hooks/useTheme";
import { colors, lightTheme } from "../../theme/colors";
import { static_coin, static_coin1, static_coin2 } from "../../helper/ImageAssets";
import { fontFamilyMedium } from "../../theme/typography";

const StakingDahboardData = () => {
  const { colors: themeColors } = useTheme();

  return (
    <View style={{ paddingHorizontal: 12, bottom: 0, }}>
      <View style={styles.earnGrid}>
        <TouchableOpacity activeOpacity={0.9} style={[styles.earnCardBig, { backgroundColor: colors.iconBgColor }]}>
          <FastImage source={static_coin} style={{ width: 31, height: 31, borderRadius: 20, marginTop: 15 }} />
          <AppText numberOfLines={1} weight={SEMI_BOLD} style={[styles.earnTitleBig, { color: themeColors.text }]}>
            BYUSDT
          </AppText>
          <AppText numberOfLines={1} style={[styles.earnSubBig, { color: themeColors.secondaryText }]}>
            BYUSDT
          </AppText>
          <AppText numberOfLines={1} weight={MEDIUM} style={[styles.earnPctBig, { color: themeColors.text, bottom: 30 }]}>
            1.69%
          </AppText>
        </TouchableOpacity>

        <View style={styles.earnRightCol}>
          <TouchableOpacity activeOpacity={0.9} style={[styles.earnCardSmall, { backgroundColor: colors.iconBgColor }]}>
            <View style={styles.earnSmallTop}>
              <FastImage source={static_coin1} style={{ width: 22, height: 22, borderRadius: 20 }} />
              <AppText style={[styles.earnTag, { color: themeColors.secondaryText }]}>Easy Earn</AppText>
            </View>
            <View style={styles.earnSmallBottom}>
              <AppText weight={MEDIUM} numberOfLines={1} style={[styles.earnNameSm, { color: themeColors.text }]}>
                OPG
              </AppText>
              <AppText numberOfLines={1} weight={MEDIUM} style={[styles.earnPctSm, { color: themeColors.text }]}>
                1.69%
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} style={[styles.earnCardSmall, { backgroundColor: colors.iconBgColor }]}>
            <View style={styles.earnSmallTop}>
              <FastImage source={static_coin2} style={{ width: 22, height: 22, borderRadius: 20, }} />
              <AppText weight={MEDIUM} style={[styles.earnTag, { color: themeColors.secondaryText }]}>Easy Earn</AppText>
            </View>
            <View style={styles.earnSmallBottom}>
              <AppText weight={MEDIUM} numberOfLines={1} style={[styles.earnNameSm, { color: themeColors.text }]}>
                XAUT
              </AppText>
              <AppText numberOfLines={1} weight={MEDIUM} style={[styles.earnPctSm, { color: themeColors.text }]}>
                1.69%
              </AppText>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  earnGrid: {
    flexDirection: "row",
    gap: 5,
  },
  earnCardBig: {
    flex: 1,
    minHeight: 170,
    borderRadius: 5,
    padding: 10,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  earnRightCol: {
    flex: 1,
    gap: 8,
  },
  earnCardSmall: {
    borderRadius: 6,
    padding: 6,
    minHeight: 80,
    justifyContent: "center",
    overflow: "hidden",
  },
  earnTitleBig: {
    fontSize: 14,
    marginTop: 4,
    flexShrink: 1,
    bottom: 5
  },
  earnSubBig: {
    fontSize: 10,
    bottom: 16
  },
  earnPctBig: {
    fontSize: 14,
    marginTop: 10,
    flexShrink: 1,
  },
  earnSmallTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    top: 4
  },
  earnTag: {
    fontSize: 10,
  },
  earnSmallBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  earnNameSm: {
    fontSize: 14,
    flexShrink: 1,
  },
  earnPctSm: {
    fontSize: 12,
    flexShrink: 0,
  },
});

export default StakingDahboardData;

