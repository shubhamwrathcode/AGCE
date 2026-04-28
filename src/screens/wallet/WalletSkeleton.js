/**
 * Skeleton loader for Wallet (WalletNew) screen.
 * Mirrors layout: tabs, Total Equity, WalletMenu, Portfolio cards, list header + rows.
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";

const { width } = Dimensions.get("window");
const HORIZONTAL_PADDING = 20;
const CONTENT_WIDTH = width - HORIZONTAL_PADDING * 2;
const SHIMMER_STRIP_WIDTH = 80;

const ShimmerBox = ({ width: w, height, borderRadius = 6, style }) => {
  const { colors: themeColors, isDark } = useTheme();
  const shimmerX = useRef(new Animated.Value(-SHIMMER_STRIP_WIDTH)).current;

  useEffect(() => {
    shimmerX.setValue(-SHIMMER_STRIP_WIDTH);
    const run = () => {
      shimmerX.setValue(-SHIMMER_STRIP_WIDTH);
      Animated.timing(shimmerX, {
        toValue: w + SHIMMER_STRIP_WIDTH,
        duration: 1100,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) run();
      });
    };
    run();
    return () => shimmerX.stopAnimation();
  }, [shimmerX, w]);

  const boneColor = themeColors.themeElevationColor;
  const shimmerColors = isDark
    ? ["transparent", "rgba(255,255,255,0.16)", "transparent"]
    : ["transparent", "rgba(0,0,0,0.05)", "transparent"];

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
          { position: "absolute", top: 0, bottom: 0, width: SHIMMER_STRIP_WIDTH, left: 0 },
          { transform: [{ translateX: shimmerX }] },
        ]}
      >
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: SHIMMER_STRIP_WIDTH }}
        />
      </Animated.View>
    </View>
  );
};

const WalletSkeleton = () => {
  const { colors: themeColors, isDark } = useTheme();
  return (
    <View style={styles.wrap}>
      {/* Tabs row */}
      <View style={styles.tabsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <ShimmerBox key={i} width={56} height={18} borderRadius={6} style={styles.tabPill} />
        ))}
      </View>

      {/* Total Equity section */}
      <View style={styles.equitySection}>
        <View style={styles.equityLabelRow}>
          <ShimmerBox width={CONTENT_WIDTH * 0.6} height={14} borderRadius={4} />
          <ShimmerBox width={20} height={20} borderRadius={4} />
        </View>
        <ShimmerBox width={CONTENT_WIDTH * 0.5} height={18} borderRadius={4} style={{ marginTop: 10 }} />
        <ShimmerBox width={CONTENT_WIDTH * 0.35} height={16} borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      {/* WalletMenu - Deposit / Withdraw */}
      <View style={styles.menuRow}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.menuItem}>
            <ShimmerBox width={30} height={30} borderRadius={8} />
            <ShimmerBox width={50} height={12} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>

      {/* Portfolio section (Overview) */}
      <View style={styles.portfolioSection}>
        <ShimmerBox width={80} height={16} borderRadius={4} style={{ marginBottom: 10 }} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.portfolioCard, { backgroundColor: themeColors.themeElevationColor }]}>
            <View>
              <ShimmerBox width={100} height={14} borderRadius={4} />
              <View style={styles.portfolioCardBalance}>
                <ShimmerBox width={60} height={14} borderRadius={4} />
                <ShimmerBox width={36} height={12} borderRadius={4} style={{ marginLeft: 6 }} />
              </View>
            </View>
            <ShimmerBox width={20} height={20} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* List section - Hide 0 balances + search, table header, rows */}
      <View style={styles.listSection}>
        <View style={styles.listToolbar}>
          <View style={styles.hideRow}>
            <ShimmerBox width={12} height={12} borderRadius={4} />
            <ShimmerBox width={90} height={12} borderRadius={4} style={{ marginLeft: 6 }} />
          </View>
          <ShimmerBox width={CONTENT_WIDTH * 0.28} height={28} borderRadius={14} />
        </View>
        <View style={styles.tableHeader}>
          <ShimmerBox width={60} height={12} borderRadius={4} />
          <ShimmerBox width={50} height={12} borderRadius={4} />
          <ShimmerBox width={44} height={12} borderRadius={4} />
          <ShimmerBox width={36} height={12} borderRadius={4} />
        </View>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.rowCurrency}>
              <ShimmerBox width={30} height={30} borderRadius={15} />
              <ShimmerBox width={44} height={12} borderRadius={4} style={{ marginLeft: 8 }} />
            </View>
            <ShimmerBox width={48} height={12} borderRadius={4} />
            <ShimmerBox width={40} height={12} borderRadius={4} />
            <ShimmerBox width={36} height={12} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 24,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  tabPill: {
    marginRight: 4,
  },
  equitySection: {
    marginVertical: 20,
  },
  equityLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  menuItem: {
    alignItems: "center",
  },
  portfolioSection: {
    marginVertical: 20,
  },
  portfolioCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,

  },
  portfolioCardBalance: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  listSection: {
    marginTop: 15,
  },
  listToolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  hideRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  rowCurrency: {
    flexDirection: "row",
    alignItems: "center",
    width: "40%",
  },
});

export default WalletSkeleton;
