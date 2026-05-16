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
import { back_ic, candle, downIcon, history_line, modes, moreImg } from "../../helper/ImageAssets";
import TradingDataModal from "../TradingDataModal/TradingDataModal";
import { AppText, SEMI_BOLD } from "../AppText";
import { toFixedThree } from "../../helper/utility";
import { useTheme } from "../../hooks/useTheme";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../../theme/colors";
import { Alert, Platform, ToastAndroid } from "react-native";
import NavigationService from "../../navigation/NavigationService";

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
  onBackPress,
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

  const showComingSoon = () => {
    if (Platform.OS === "android") {
      ToastAndroid.show("Coming soon", ToastAndroid.SHORT);
    } else {
      Alert.alert("Coming soon");
    }
  };

  const leftContent = pairLoading ? (
    <View style={styles.pairBlock} accessibilityState={{ busy: true }}>
      <View style={styles.pairRow}>
        <HeaderShimmerBar width={150} height={22} borderRadius={6} />
        <View style={{ width: 12, height: 12, marginLeft: 8 }} />
      </View>
      <HeaderShimmerBar width={96} height={18} borderRadius={8} style={{ marginTop: 10 }} />
    </View>
  ) : (
    <View style={styles.pairBlock}>
      <View style={styles.pairRow}>
        <TouchableOpacity
          onPress={openPairSheet}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, right: 8 }}
          style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}
        >
          <AppText weight={SEMI_BOLD} style={[styles.pairTitle, { color: titleColor }]} numberOfLines={1}>
            {title}
          </AppText>
          <FastImage
            source={downIcon}
            style={{ width: 12, height: 12, marginLeft: 8, marginTop: 2 }}
            tintColor={iconTint}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* No Favorite button here */}
      </View>
      <View
        style={[
          styles.changePill,
          {
            backgroundColor: colors.green,
            borderColor: colors.green
          },
        ]}
      >
        <AppText style={[styles.changeText, { color: colors.white }]}>
          {change != null && change !== ""
            ? `${Number(change) >= 0 ? "+" : ""}${toFixedThree(change)}%`
            : "—"}
        </AppText>
      </View>
    </View>
  );

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={onBackPress}
            activeOpacity={0.75}
            style={styles.backBtn}
            disabled={!onBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FastImage source={back_ic} style={{ width: 20, height: 20 }} resizeMode="contain" tintColor={colors.black} />
          </TouchableOpacity>
          <View style={styles.topTabs}>
            {["Spot", "Margin", "Fiat", "P2P", "Convert"].map((t, idx, arr) => {
              const active = t === "Spot";
              return (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.75}
                  disabled={active}
                  onPress={!active ? showComingSoon : undefined}
                  style={[
                    styles.topTabItem,
                    // `gap` is not supported on all RN versions; use margins for consistent spacing
                    idx !== arr.length - 1 && { marginRight: 5 },
                  ]}
                >
                  <AppText weight={SEMI_BOLD} style={{ fontSize: 16, color: active ? themeColors.text : themeColors.secondaryText }}>
                    {t}
                  </AppText>
                  <View style={[styles.topTabUnderline, { backgroundColor: active ? themeColors.text : "transparent" }]} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.pairRowMain}>
          <View style={{ flex: 1 }}>
            {leftContent}
          </View>

          {/* <TouchableOpacity
            activeOpacity={0.7}
            onPress={showComingSoon}
            style={styles.iconBtn}
            accessibilityLabel="More options"
          >
            <FastImage
              source={modes}
              style={styles.headerIcon}
              resizeMode="contain"
              tintColor={iconTint}
            />
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onCandlePress}
            activeOpacity={0.7}
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

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              NavigationService.navigate('Trade_History')
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open chart"
          >
            <FastImage
              source={history_line}
              style={styles.headerIcon}
              resizeMode="contain"
              tintColor={iconTint}
            />
          </TouchableOpacity>

          {/* (removed duplicate more icon; Coming soon uses the above button) */}
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
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  topTabs: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    paddingLeft: 5,
  },
  topTabItem: {
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  topTabUnderline: {
    height: 3,
    width: 18,
    borderRadius: 2,
  },
  pairRowMain: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 5,
    gap: 4,
  },
  pairBlock: {
    paddingRight: 10,
  },
  pairRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pairTitle: {
    fontSize: 18,
    letterSpacing: -0.2,
  },
  changePill: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 5
  },
  changeText: {
    fontSize: 13,

  },
  iconBtn: {
    padding: 6,
    minWidth: 34,
    minHeight: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
});
