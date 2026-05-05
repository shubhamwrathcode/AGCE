import {
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import { candle, downIcon } from "../../helper/ImageAssets";
import TradingDataModal from "../TradingDataModal/TradingDataModal";
import { AppText, SEMI_BOLD } from "../AppText";
import { toFixedThree } from "../../helper/utility";
import { useTheme } from "../../hooks/useTheme";

const { width: SCREEN_W } = Dimensions.get("window");
const HEADER_SHIMMER_STRIP = 140;

/** Same surface + shimmer language as Spot order book `ShimmerBox` (input bg). */
const HeaderShimmerBar = ({ width: w, height, borderRadius = 6, style }) => {
  const { colors: themeColors, isDark } = useTheme();
  const boneColor =
    themeColors?.input ??
    themeColors?.card ??
    (isDark ? "rgba(100, 130, 180, 0.22)" : "rgba(160, 185, 220, 0.35)");
  const shimmerColors = isDark
    ? ["transparent", "rgba(255,255,255,0.26)", "transparent"]
    : ["transparent", "rgba(255,255,255,0.72)", "transparent"];
  const stripW = HEADER_SHIMMER_STRIP;
  const shimmerX = useRef(new Animated.Value(-stripW)).current;

  useEffect(() => {
    shimmerX.setValue(-stripW);
    const run = () => {
      shimmerX.setValue(-stripW);
      Animated.timing(shimmerX, {
        toValue: SCREEN_W,
        duration: 900,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) run();
      });
    };
    run();
    return () => shimmerX.stopAnimation();
  }, [shimmerX, stripW, isDark]);

  return (
    <View
      style={[
        { width: w, height, borderRadius, overflow: "hidden", backgroundColor: boneColor },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          { position: "absolute", top: 0, bottom: 0, width: stripW, left: 0 },
          { transform: [{ translateX: shimmerX }] },
        ]}
      >
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: stripW }}
        />
      </Animated.View>
    </View>
  );
};

/**
 * Spot header: pair + chevron opens pair sheet; change % below; right = trend / candle / more.
 * @param {boolean} [pairLoading] — show input-style skeleton in left block until pair metadata is ready.
 */
const SpotHeader = ({
  title,
  setCurrency,
  change,
  onCandlePress,
  onTrendPress,
  onMorePress,
  isDark: isDarkProp,
  pairLoading = false,
}) => {
  const [pairSheetVisible, setPairSheetVisible] = useState(false);
  const { colors: themeColors, theme, isDark: isDarkFromHook } = useTheme();
  const darkMode =
    typeof isDarkProp === "boolean" ? isDarkProp : isDarkFromHook;

  const openPairSheet = () => setPairSheetVisible(true);

  const iconTint = darkMode ? themeColors.text : "#222";
  const titleColor = darkMode ? themeColors.text : "#222";
  const changeColor =
    change == null || Number.isNaN(Number(change))
      ? themeColors.secondaryText
      : Number(change) < 0
        ? themeColors.red
        : themeColors.green;

  const leftContent = pairLoading ? (
    <View style={styles.leftArea} accessibilityState={{ busy: true }}>
      <View style={styles.pairRow}>
        <HeaderShimmerBar width={132} height={17} borderRadius={5} />
        <View style={{ width: 11, height: 11, marginLeft: 5 }} />
      </View>
      <HeaderShimmerBar width={76} height={13} borderRadius={5} style={{ marginTop: 6 }} />
    </View>
  ) : (
    <TouchableOpacity
      style={styles.leftArea}
      onPress={openPairSheet}
      activeOpacity={0.75}
      hitSlop={{ top: 8, bottom: 8, right: 8 }}
    >
      <View style={styles.pairRow}>
        <AppText weight={SEMI_BOLD} style={[styles.pairTitle, { color: titleColor }]}>
          {title}
        </AppText>
        <FastImage
          source={downIcon}
          style={{ width: 11, height: 11, marginLeft: 5 }}
          tintColor={iconTint}
          resizeMode="contain"
        />
      </View>
      <AppText style={[styles.changeText, { color: changeColor }]}>
        {change != null && change !== ""
          ? `${Number(change) >= 0 ? "+" : ""}${toFixedThree(change)}%`
          : "—"}
      </AppText>
    </TouchableOpacity>
  );

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: themeColors.background },
        ]}
      >
        {leftContent}

        <View style={styles.rightIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onCandlePress}
            activeOpacity={0.7}
            hitSlop={{ top: 18, bottom: 18, left: 18, right: 18 }}
            accessibilityRole="button"
            accessibilityLabel="Open chart"
          >
            <FastImage
              source={candle}
              style={styles.headerIcon}
              resizeMode="contain"
              tintColor={iconTint}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TradingDataModal
        visible={pairSheetVisible}
        onClose={() => setPairSheetVisible(false)}
        setCurrency={setCurrency}
        isDark={darkMode}
        theme={theme}
      />
    </>
  );
};

export default SpotHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  leftArea: {
    flex: 1,
    paddingRight: 12,
  },
  pairRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pairTitle: {
    fontSize: 17,
    letterSpacing: -0.2,
  },
  chevron: {
    marginLeft: 4,
    marginTop: 1,
  },
  changeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcon: {
    width: 25,
    height: 25,
  },
});
