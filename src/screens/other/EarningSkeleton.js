/**
 * Skeleton loader for Earning screen (Earning tab).
 * Mirrors layout: header banner, Simple Earn banner, carousel cards, dots, All Plans list.
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Platform, Animated, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";

const { width } = Dimensions.get("window");
const HORIZONTAL_PADDING = 20; // same as Earning.js KeyBoardAware
const CONTENT_WIDTH = width - HORIZONTAL_PADDING * 2;
const CARD_GAP = 10;
const CAROUSEL_WIDTH = CONTENT_WIDTH;
const CARD_WIDTH = (CAROUSEL_WIDTH - CARD_GAP) / 2;
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
        {
          width: w,
          height,
          borderRadius,
          overflow: "hidden",
          backgroundColor: boneColor,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            width: SHIMMER_STRIP_WIDTH,
            left: 0,
          },
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

const EarningSkeleton = () => {
  const { colors: themeColors, isDark } = useTheme();
  return (
    <View style={styles.wrap}>
      {/* Header banner */}
      <View style={styles.earningHeaderBanner}>
        <View style={styles.earningHeaderBannerLeft}>
          <ShimmerBox width={CONTENT_WIDTH * 0.55} height={18} borderRadius={6} style={{ marginBottom: 8 }} />
          <ShimmerBox width={CONTENT_WIDTH * 0.45} height={12} borderRadius={4} />
        </View>
      </View>

      {/* Simple Earn banner */}
      <View style={[styles.simpleEarnBanner, { backgroundColor: themeColors.themeElevationColor }]}>
        <ShimmerBox
          width={56}
          height={22}
          borderRadius={8}
          style={styles.lowRiskTag}
        />
        <ShimmerBox width={CONTENT_WIDTH * 0.72} height={20} borderRadius={6} style={styles.bannerMainTitle} />
        <View style={styles.featureIconsRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.featureItem}>
              <ShimmerBox width={44} height={44} borderRadius={22} style={{ marginBottom: 8 }} />
              <ShimmerBox width={52} height={10} borderRadius={4} />
            </View>
          ))}
        </View>
        <View style={styles.whatIsSimpleEarn}>
          <View style={styles.whatIsLeft}>
            <ShimmerBox width={32} height={32} borderRadius={16} style={{ marginRight: 10 }} />
            <View>
              <ShimmerBox width={140} height={14} borderRadius={4} />
              <ShimmerBox width={60} height={10} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          </View>
          <View style={styles.whatIsRightIcons}>
            <ShimmerBox width={24} height={24} borderRadius={12} />
            <ShimmerBox width={24} height={24} borderRadius={12} style={{ marginLeft: 4 }} />
          </View>
        </View>
        <ShimmerBox width={180} height={12} borderRadius={4} style={styles.investedText} />
      </View>

      {/* Carousel - 2 cards */}
      <View style={[styles.carouselRow, { width: CAROUSEL_WIDTH }]}>
        {[1, 2].map((i) => (
          <View key={i} style={[styles.carouselCard, { width: CARD_WIDTH, backgroundColor: themeColors.themeElevationColor }]}>
            <View style={styles.currencyBit}>
              <View style={styles.currencyBitInner}>
                <ShimmerBox width={34} height={34} borderRadius={17} />
                <View>
                  <ShimmerBox width={48} height={14} borderRadius={4} />
                  <ShimmerBox width={64} height={10} borderRadius={4} style={{ marginTop: 4 }} />
                </View>
              </View>
              <ShimmerBox width={52} height={20} borderRadius={6} />
            </View>
            <View style={styles.usdDetailList}>
              <View>
                <ShimmerBox width={28} height={10} borderRadius={4} />
                <ShimmerBox width={36} height={14} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <ShimmerBox width={36} height={10} borderRadius={4} />
                <ShimmerBox width={40} height={14} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Dots */}
      <View style={styles.dotContainer}>
        {[1, 2, 3].map((i) => (
          <ShimmerBox key={i} width={8} height={8} borderRadius={4} style={styles.dot} />
        ))}
      </View>

      {/* All Plans */}
      <View style={styles.allPlansBlock}>
        <ShimmerBox width={80} height={16} borderRadius={4} style={styles.allPlansHeading} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.allPlansCard, { backgroundColor: themeColors.themeElevationColor }]}>
            <View style={styles.allPlansCardHeader}>
              <View style={styles.allPlansCardTitleRow}>
                <ShimmerBox width={32} height={32} borderRadius={8} />
                <ShimmerBox width={56} height={14} borderRadius={4} />
              </View>
              <ShimmerBox width={15} height={15} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  earningHeaderBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 15,
    paddingHorizontal: 0,
  },
  earningHeaderBannerLeft: {
    flex: 1,
    minWidth: 0,
  },
  simpleEarnBanner: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 18,
    paddingTop: 24,

    overflow: "hidden",
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
  lowRiskTag: {
    position: "absolute",
    top: 0,
    right: 12,
  },
  bannerMainTitle: {
    marginBottom: 20,
    marginTop: 4,
  },
  featureIconsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  featureItem: {
    alignItems: "center",
    flex: 1,
  },
  whatIsSimpleEarn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  whatIsLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  whatIsRightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  investedText: {
    alignSelf: "center",
  },
  carouselRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  carouselCard: {

    borderRadius: 12,
    padding: 10,
    marginRight: CARD_GAP,
    height: 165,
  },
  currencyBit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currencyBitInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  usdDetailList: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -16,
    marginBottom: 6,
  },
  dot: {
    marginHorizontal: 3,
  },
  allPlansBlock: {
    marginTop: 8,
    marginBottom: 20,
  },
  allPlansHeading: {
    marginBottom: 12,
  },
  allPlansCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  allPlansCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  allPlansCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});

export default EarningSkeleton;
