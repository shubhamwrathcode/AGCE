import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import { AppText, SEMI_BOLD } from "../../shared";
import { useTheme } from "../../hooks/useTheme";
import { colors, lightTheme } from "../../theme/colors";
import { static_coin, static_coin1, static_coin2 } from "../../helper/ImageAssets";

const StakingDahboardData = () => {
  const { colors: themeColors } = useTheme();

  return (
    <View style={{ paddingHorizontal: 12, }}>
      <View style={styles.earnGrid}>
        <TouchableOpacity activeOpacity={0.9} style={[styles.earnCardBig, { backgroundColor: colors.iconBgColor }]}>
          <FastImage source={static_coin} style={{ width: 30, height: 30, borderRadius: 10 }} />
          <AppText numberOfLines={1} style={[styles.earnTitleBig, { color: themeColors.text }]}>
            BYUSDT
          </AppText>
          <AppText numberOfLines={1} style={[styles.earnSubBig, { color: themeColors.secondaryText }]}>
            BYUSDT
          </AppText>
          <AppText numberOfLines={1} weight={SEMI_BOLD} style={[styles.earnPctBig, { color: themeColors.text }]}>
            1.69%
          </AppText>
        </TouchableOpacity>

        <View style={styles.earnRightCol}>
          <TouchableOpacity activeOpacity={0.9} style={[styles.earnCardSmall, { backgroundColor: colors.iconBgColor }]}>
            <View style={styles.earnSmallTop}>
              <FastImage source={static_coin1} style={{ width: 25, height: 25, borderRadius: 10 }} />
              <AppText style={[styles.earnTag, { color: themeColors.secondaryText }]}>Easy Earn</AppText>
            </View>
            <View style={styles.earnSmallBottom}>
              <AppText numberOfLines={1} style={[styles.earnNameSm, { color: themeColors.text }]}>
                OPG
              </AppText>
              <AppText numberOfLines={1} weight={SEMI_BOLD} style={[styles.earnPctSm, { color: themeColors.text }]}>
                1.69%
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} style={[styles.earnCardSmall, { backgroundColor: colors.iconBgColor }]}>
            <View style={styles.earnSmallTop}>
              <FastImage source={static_coin2} style={{ width: 25, height: 25, borderRadius: 10 }} />
              <AppText style={[styles.earnTag, { color: themeColors.secondaryText }]}>Easy Earn</AppText>
            </View>
            <View style={styles.earnSmallBottom}>
              <AppText numberOfLines={1} style={[styles.earnNameSm, { color: themeColors.text }]}>
                XAUT
              </AppText>
              <AppText numberOfLines={1} weight={SEMI_BOLD} style={[styles.earnPctSm, { color: themeColors.text }]}>
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
    gap: 10,
  },
  earnCardBig: {
    flex: 1,
    minHeight: 128,
    borderRadius: 5,
    padding: 10,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  earnRightCol: {
    flex: 1,
    gap: 10,
  },
  earnCardSmall: {
    borderRadius: 5,
    padding: 8,
    minHeight: 58,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  earnTitleBig: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
    flexShrink: 1,
  },
  earnSubBig: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    flexShrink: 1,
  },
  earnPctBig: {
    fontSize: 13,
    marginTop: 10,
    flexShrink: 1,
  },
  earnSmallTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  earnTag: {
    fontSize: 10,
    fontWeight: "700",
  },
  earnSmallBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  earnNameSm: {
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 1,
  },
  earnPctSm: {
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 0,
  },
});

export default StakingDahboardData;

