import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Animated,
  Platform,
} from "react-native";
import WebView from "react-native-webview";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { AppText, SEMI_BOLD } from "../../shared";
import FastImage from "react-native-fast-image";
import { downIcon, upIcon } from "../../helper/ImageAssets";
import { toFixedThree } from "../../helper/utility";
import { useAppSelector } from "../../store/hooks";

const { width: Width, height: Height } = Dimensions.get("window");
const CHART_HEIGHT = Height - 140; // Full screen minus header

const SKELETON_CANDLES = [
  { bodyH: 15, bodyBot: 30, wickH: 25, wickBot: 25 },
  { bodyH: 20, bodyBot: 35, wickH: 30, wickBot: 30 },
  { bodyH: 30, bodyBot: 40, wickH: 45, wickBot: 35 },
  { bodyH: 20, bodyBot: 65, wickH: 35, wickBot: 60 },
  { bodyH: 40, bodyBot: 50, wickH: 55, wickBot: 45 },
  { bodyH: 25, bodyBot: 25, wickH: 45, wickBot: 15 },
  { bodyH: 50, bodyBot: 45, wickH: 70, wickBot: 35 },
  { bodyH: 35, bodyBot: 80, wickH: 50, wickBot: 75 },
  { bodyH: 15, bodyBot: 100, wickH: 30, wickBot: 95 },
  { bodyH: 25, bodyBot: 105, wickH: 40, wickBot: 95 },
  { bodyH: 35, bodyBot: 85, wickH: 50, wickBot: 75 },
  { bodyH: 45, bodyBot: 50, wickH: 60, wickBot: 40 },
  { bodyH: 20, bodyBot: 60, wickH: 40, wickBot: 50 },
  { bodyH: 45, bodyBot: 20, wickH: 60, wickBot: 10 },
  { bodyH: 30, bodyBot: 10, wickH: 45, wickBot: 5 },
  { bodyH: 15, bodyBot: 35, wickH: 30, wickBot: 30 },
  { bodyH: 35, bodyBot: 30, wickH: 50, wickBot: 20 },
  { bodyH: 25, bodyBot: 60, wickH: 40, wickBot: 50 },
  { bodyH: 45, bodyBot: 20, wickH: 65, wickBot: 15 },
  { bodyH: 20, bodyBot: 50, wickH: 35, wickBot: 40 },
  { bodyH: 10, bodyBot: 65, wickH: 20, wickBot: 60 },
  { bodyH: 25, bodyBot: 45, wickH: 35, wickBot: 40 },
  { bodyH: 40, bodyBot: 55, wickH: 50, wickBot: 50 },
  { bodyH: 15, bodyBot: 80, wickH: 25, wickBot: 75 },
  { bodyH: 30, bodyBot: 70, wickH: 50, wickBot: 60 },
  { bodyH: 25, bodyBot: 55, wickH: 40, wickBot: 45 },
];

const SHIMMER_STRIP_WIDTH_DEFAULT = 100;
const ShimmerBox = ({
  width, height, borderRadius = 8, style,
  shimmerStripWidth = SHIMMER_STRIP_WIDTH_DEFAULT,
  shimmerDuration = 700,
  shimmerToValue,
  shimmerColorsOverride
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const stripW = typeof shimmerStripWidth === "number" ? shimmerStripWidth : SHIMMER_STRIP_WIDTH_DEFAULT;
  const boneColor = themeColors.themeElevationColor ?? (isDark ? "rgba(100, 130, 180, 0.22)" : "rgba(160, 185, 220, 0.35)");
  const shimmerColors = shimmerColorsOverride || (themeColors
    ? ["transparent", "rgba(255,255,255,0.12)", "transparent"]
    : ["transparent", "rgba(200, 220, 255, 0.35)", "transparent"]);
  const shimmerX = useRef(new Animated.Value(-stripW)).current;
  useEffect(() => {
    shimmerX.setValue(-stripW);
    const run = () => {
      shimmerX.setValue(-stripW);
      Animated.timing(shimmerX, {
        toValue: shimmerToValue !== undefined ? shimmerToValue : (Width + stripW),
        duration: shimmerDuration,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) run();
      });
    };
    run();
    return () => shimmerX.stopAnimation();
  }, [shimmerX, stripW]);
  return (
    <View style={[{ width, height, borderRadius, overflow: "hidden", backgroundColor: boneColor }, style]}>
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

const ChartSkeleton = ({ height = CHART_HEIGHT, width = Width }) => {
  const { colors: themeColors, isDark } = useTheme();
  const bg = themeColors.background ?? "transparent";
  return (
    <View style={{ width, height, backgroundColor: bg, paddingTop: 12, paddingHorizontal: 12, paddingBottom: 15, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
        <ShimmerBox width={24} height={24} borderRadius={4} style={{ marginRight: 15 }} />
        {['1min', '5min', '15min', '1H', '1D'].map((v, i) => (
          <ShimmerBox key={i} width={50} height={24} borderRadius={4} style={{ marginRight: 10 }} />
        ))}
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1, paddingRight: 15 }}>
          <ShimmerBox width={140} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
          <ShimmerBox width={180} height={12} borderRadius={4} style={{ marginBottom: 16 }} />

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flex: 1, paddingBottom: 15, marginTop: 10 }}>
            {SKELETON_CANDLES.map((candle, i) => (
              <View key={i} style={{ alignItems: 'center', width: 8, height: '100%', justifyContent: 'flex-end' }}>
                <ShimmerBox
                  width={1.5} height={candle.wickH} borderRadius={1}
                  style={{ position: 'absolute', bottom: candle.wickBot }}
                  shimmerDuration={1500} shimmerToValue={60} shimmerStripWidth={60}
                  shimmerColorsOverride={["transparent", isDark ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.8)", "transparent"]}
                />
                <ShimmerBox
                  width={6} height={candle.bodyH} borderRadius={2}
                  style={{ position: 'absolute', bottom: candle.bodyBot }}
                  shimmerDuration={1500} shimmerToValue={60} shimmerStripWidth={60}
                  shimmerColorsOverride={["transparent", isDark ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.8)", "transparent"]}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={{ width: 45, justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 25 }}>
          <ShimmerBox width={40} height={12} borderRadius={4} />
          <ShimmerBox width={40} height={12} borderRadius={4} />
          <ShimmerBox width={40} height={12} borderRadius={4} />
          <ShimmerBox width={40} height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

const SpotChartScreen = () => {
  const { colors: themeColors, theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  const { base_currency, quote_currency, change_percentage, buy_price } = route.params || {};

  const spotSelectedPair = useAppSelector((state) => state.home.spotSelectedPair);

  // Use route params first, fallback to redux
  const pairBase = base_currency || spotSelectedPair?.base_currency || "-";
  const pairQuote = quote_currency || spotSelectedPair?.quote_currency || "-";
  const pairChange = change_percentage ?? spotSelectedPair?.change_percentage ?? 0;
  const pairPrice = buy_price ?? spotSelectedPair?.buy_price ?? "-";

  const chartUri = useMemo(() => {
    const themeSlug = theme === "Dark" ? "dark" : "light";
    return `https://zillion.wrathcode.com/chart/${themeSlug}/${pairBase}/${pairQuote}`;
  }, [theme, pairBase, pairQuote]);

  const [webViewReady, setWebViewReady] = useState(false);
  const [chartRevealed, setChartRevealed] = useState(false);
  const chartRevealDelayRef = useRef(null);
  const webViewReadyFallbackRef = useRef(null);

  const onChartLoaded = useCallback(() => {
    if (webViewReadyFallbackRef.current) {
      clearTimeout(webViewReadyFallbackRef.current);
      webViewReadyFallbackRef.current = null;
    }
    setWebViewReady(true);
  }, []);

  // Fallback: if chart doesn't fire onLoadEnd within 4s, show content anyway
  useEffect(() => {
    if (!chartUri || webViewReady) return;
    if (webViewReadyFallbackRef.current) clearTimeout(webViewReadyFallbackRef.current);
    webViewReadyFallbackRef.current = setTimeout(() => {
      webViewReadyFallbackRef.current = null;
      setWebViewReady(true);
    }, 4000);
    return () => {
      if (webViewReadyFallbackRef.current) {
        clearTimeout(webViewReadyFallbackRef.current);
        webViewReadyFallbackRef.current = null;
      }
    };
  }, [chartUri, webViewReady]);

  // Reveal chart after webViewReady with a short delay
  useEffect(() => {
    if (!webViewReady) {
      setChartRevealed(false);
      if (chartRevealDelayRef.current) {
        clearTimeout(chartRevealDelayRef.current);
        chartRevealDelayRef.current = null;
      }
      return;
    }
    chartRevealDelayRef.current = setTimeout(() => {
      chartRevealDelayRef.current = null;
      setChartRevealed(true);
    }, 250);
    return () => {
      if (chartRevealDelayRef.current) {
        clearTimeout(chartRevealDelayRef.current);
        chartRevealDelayRef.current = null;
      }
    };
  }, [webViewReady]);

  const showSkeleton = !chartRevealed;
  const bg = themeColors.background ?? "transparent";
  const isNegative = (pairChange ?? 0) < 0;
  const changeColor = isNegative ? themeColors.red : themeColors.green;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bg}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.themeBorderColor }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <AppText weight={SEMI_BOLD} style={[styles.headerTitle, { color: themeColors.text }]}>
            {pairBase}/{pairQuote}
          </AppText>
          <View style={styles.headerPriceRow}>
            <AppText style={[styles.headerPrice, { color: changeColor }]}>
              {pairPrice}
            </AppText>
            <View style={[styles.changeBadge, { backgroundColor: changeColor + '15' }]}>
              <FastImage
                source={isNegative ? downIcon : upIcon}
                resizeMode="contain"
                style={{ width: 8, height: 8, marginRight: 3 }}
                tintColor={changeColor}
              />
              <AppText style={[styles.changeText, { color: changeColor }]}>
                {pairChange != null ? `${toFixedThree(pairChange)}%` : "-"}
              </AppText>
            </View>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Chart Area */}
      <View style={[styles.chartContainer, { backgroundColor: bg }]}>
        {showSkeleton ? (
          <View style={{ width: Width, height: CHART_HEIGHT, backgroundColor: bg }} pointerEvents="none">
            <ChartSkeleton height={CHART_HEIGHT} width={Width} />
          </View>
        ) : null}
        <View
          style={{
            position: showSkeleton ? "absolute" : "relative",
            top: showSkeleton ? 0 : undefined,
            left: showSkeleton ? 0 : undefined,
            width: Width,
            height: CHART_HEIGHT,
            opacity: showSkeleton ? 0 : 1,
            pointerEvents: showSkeleton ? "none" : "auto",
            backgroundColor: bg,
          }}
        >
          {chartUri ? (
            <WebView
              source={{ uri: chartUri }}
              style={{ width: Width, height: CHART_HEIGHT, backgroundColor: "transparent" }}
              containerStyle={{ backgroundColor: "transparent" }}
              opaque={false}
              androidLayerType="hardware"
              cacheEnabled={true}
              cacheMode="LOAD_CACHE_ELSE_NETWORK"
              mixedContentMode="compatibility"
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scrollEnabled={false}
              bounces={false}
              sharedCookiesEnabled={true}
              javaScriptEnabledAndroid={true}
              scalesPageToFit={false}
              automaticallyAdjustContentInsets={false}
              setSupportMultipleWindows={false}
              overScrollMode="never"
              onLoadEnd={onChartLoaded}
            />
          ) : (
            <View style={{ width: Width, height: CHART_HEIGHT, backgroundColor: bg }} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    letterSpacing: 0.3,
  },
  headerPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  headerPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  chartContainer: {
    flex: 1,
    position: "relative",
  },
});

export default SpotChartScreen;
