import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
} from "react-native";
import WebView from "react-native-webview";
import LinearGradient from "react-native-linear-gradient";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { useTheme } from "../../hooks/useTheme";
import { AppText, SEMI_BOLD, ELEVEN, TEN } from "../../shared";
import FastImage from "react-native-fast-image";
import { back_ic, downIcon, upIcon } from "../../helper/ImageAssets";
import { toFixedFive, toFixedThree, twoFixedTwo } from "../../helper/utility";
import { useAppSelector } from "../../store/hooks";
import { SocketContext } from "../../SocketProvider";
import { CHART_WEB_BASE_URL } from "../../helper/Constants";
import TradingDataModal from "../../common/TradingDataModal/TradingDataModal";
import { setBuyOrders, setSellOrders, setSpotSelectedPair } from "../../slices/homeSlice";

const { width: Width, height: Height } = Dimensions.get("window");
const CHART_BLOCK_HEIGHT = Math.round(Height * 0.38);
const ORDER_BOOK_ROWS = 12;

const toFinite = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** One row: bid (qty | price + green depth) + ask (price + red depth | qty) — theme colors from app. */
function DepthRow({ bid, ask, maxBidVol, maxAskVol, themeColors, isDark, formatPrice, formatQty }) {
  const baseGreen = isDark ? "#213438" : "#C6F9E9";
  const baseRed = isDark ? "#352933f7" : "#FFD9DB";
  const bidRem = bid ? toFinite(bid.remaining) : 0;
  const askRem = ask ? toFinite(ask.remaining) : 0;
  const br = maxBidVol > 0 ? clamp01(bidRem / maxBidVol) : 0;
  const ar = maxAskVol > 0 ? clamp01(askRem / maxAskVol) : 0;
  const bEnd = Math.min(1, br + 1e-6);
  const aEnd = Math.min(1, ar + 1e-6);

  return (
    <View style={styles.depthRow}>
      <View style={styles.depthBidSide}>
        <AppText type={ELEVEN} style={[styles.depthQty, { color: themeColors.secondaryText }]} numberOfLines={1}>
          {bid ? formatQty(bid.remaining) : "—"}
        </AppText>
        <View style={styles.depthBidGradWrap}>
          <LinearGradient
            style={styles.depthGradInner}
            colors={[baseGreen, baseGreen, "transparent", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            locations={[0, br, bEnd, 1]}
          >
            <AppText style={[styles.depthBidPrice, { color: themeColors.green }]}>
              {bid ? formatPrice(bid.price) : ""}
            </AppText>
          </LinearGradient>
        </View>
      </View>
      <View style={styles.depthMidRule} />
      <View style={styles.depthAskSide}>
        <View style={styles.depthAskGradWrap}>
          <LinearGradient
            style={[styles.depthGradInner, styles.depthAskInner]}
            colors={[baseRed, baseRed, "transparent", "transparent"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            locations={[0, ar, aEnd, 1]}
          >
            <AppText style={[styles.depthAskPrice, { color: themeColors.red }]}>
              {ask ? formatPrice(ask.price) : ""}
            </AppText>
          </LinearGradient>
        </View>
        <AppText type={ELEVEN} style={[styles.depthQty, { color: themeColors.secondaryText, textAlign: "right" }]} numberOfLines={1}>
          {ask ? formatQty(ask.remaining) : "—"}
        </AppText>
      </View>
    </View>
  );
}

const SpotChartScreen = () => {
  const dispatch = useDispatch();
  const { colors: themeColors, theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { subscribeToExchange, unsubscribeFromExchange } = useContext(SocketContext) || {};

  const spotSelectedPair = useAppSelector((state) => state.home.spotSelectedPair);
  const buyOrders = useAppSelector((state) => state.home.buyOrders);
  const sellOrders = useAppSelector((state) => state.home.sellOrders);

  const [pairSheetVisible, setPairSheetVisible] = useState(false);

  const params = route.params || {};
  /** Redux pair wins over stale navigation params after user changes pair in `TradingDataModal`. */
  const mergedPair = useMemo(
    () => ({
      ...spotSelectedPair,
      ...params,
      base_currency: spotSelectedPair?.base_currency || params.base_currency,
      quote_currency: spotSelectedPair?.quote_currency || params.quote_currency,
      base_currency_id: spotSelectedPair?.base_currency_id ?? params.base_currency_id,
      quote_currency_id: spotSelectedPair?.quote_currency_id ?? params.quote_currency_id,
      high: params.high ?? spotSelectedPair?.high,
      low: params.low ?? spotSelectedPair?.low,
      volume: params.volume ?? spotSelectedPair?.volume,
      buy_price: spotSelectedPair?.buy_price ?? params.buy_price,
      change_percentage: spotSelectedPair?.change_percentage ?? params.change_percentage,
    }),
    [spotSelectedPair, params]
  );

  const pairRef = useRef(mergedPair);
  pairRef.current = mergedPair;

  const pairBase = mergedPair?.base_currency || "-";
  const pairQuote = mergedPair?.quote_currency || "-";
  const pairChange = mergedPair?.change_percentage ?? 0;
  const pairPrice = mergedPair?.buy_price ?? "—";
  const high = mergedPair?.high;
  const low = mergedPair?.low;
  const volume = mergedPair?.volume;

  useFocusEffect(
    useCallback(() => {
      const p = pairRef.current;
      if (!p?.base_currency_id || !p?.quote_currency_id) return undefined;
      subscribeToExchange?.(p.base_currency_id, p.quote_currency_id);
      return () => {
        unsubscribeFromExchange?.(p.base_currency_id, p.quote_currency_id);
      };
    }, [subscribeToExchange, unsubscribeFromExchange])
  );

  const chartUri = useMemo(() => {
    const themeSlug = theme === "Dark" ? "dark" : "light";
    const symbol = `${pairBase}_${pairQuote}`;
    return `${CHART_WEB_BASE_URL}chart/${themeSlug}/${symbol}`;
  }, [theme, pairBase, pairQuote]);

  const handleCurrencyChange = useCallback(
    (coin) => {
      dispatch(setSpotSelectedPair(coin));
      dispatch(setBuyOrders([]));
      dispatch(setSellOrders([]));
    },
    [dispatch]
  );

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

  useEffect(() => {
    setWebViewReady(false);
    setChartRevealed(false);
  }, [chartUri]);

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
  const isNeg = Number(pairChange) < 0;
  const changeColor = isNeg ? themeColors.red : themeColors.green;

  const sellsSorted = useMemo(() => {
    if (!sellOrders?.length) return [];
    return [...sellOrders].sort((a, b) => toFinite(a?.price) - toFinite(b?.price));
  }, [sellOrders]);

  const bidsDisplay = useMemo(() => (buyOrders || []).slice(0, ORDER_BOOK_ROWS), [buyOrders]);
  const asksDisplay = useMemo(() => sellsSorted.slice(0, ORDER_BOOK_ROWS), [sellsSorted]);

  const maxBidVol = useMemo(
    () => Math.max(1, ...bidsDisplay.map((o) => toFinite(o?.remaining))),
    [bidsDisplay]
  );
  const maxAskVol = useMemo(
    () => Math.max(1, ...asksDisplay.map((o) => toFinite(o?.remaining))),
    [asksDisplay]
  );

  const formatPrice = useCallback((p) => {
    const n = Number(p);
    if (!Number.isFinite(n)) return "—";
    return String(toFixedFive(n));
  }, []);

  const formatQty = useCallback((q) => {
    const n = Number(q);
    if (!Number.isFinite(n)) return "—";
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
    return n >= 1 ? n.toFixed(4) : n.toFixed(6);
  }, []);

  const depthRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < ORDER_BOOK_ROWS; i++) {
      rows.push({
        bid: bidsDisplay[i] || null,
        ask: asksDisplay[i] || null,
      });
    }
    return rows;
  }, [bidsDisplay, asksDisplay]);

  const bidVolSum = useMemo(
    () => bidsDisplay.reduce((s, o) => s + toFinite(o?.remaining), 0),
    [bidsDisplay]
  );
  const askVolSum = useMemo(
    () => asksDisplay.reduce((s, o) => s + toFinite(o?.remaining), 0),
    [asksDisplay]
  );
  const totalVolBar = bidVolSum + askVolSum || 1;
  const bidPct = (bidVolSum / totalVolBar) * 100;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />

      <View style={[styles.header, {  backgroundColor: bg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <FastImage
            source={back_ic}
            style={styles.backIcon}
            resizeMode="contain"
            tintColor={themeColors.text}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <TouchableOpacity
            style={styles.headerPairRow}
            onPress={() => setPairSheetVisible(true)}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppText weight={SEMI_BOLD} style={[styles.headerTitle, { color: themeColors.text }]}>
              {pairBase}/{pairQuote}
            </AppText>
            <FastImage
              source={downIcon}
              style={styles.headerChevron}
              resizeMode="contain"
              tintColor={themeColors.text}
            />
          </TouchableOpacity>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <ScrollView
          style={styles.scrollMain}
          contentContainerStyle={styles.scrollMainContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
        {/* 24h strip (same content as former Spot minicontainer; colors from theme / change %) */}
        <View style={[styles.statsStrip, { borderBottomColor: themeColors.themeBorderColor }]}>
          <View style={styles.statsLeft}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <AppText style={[styles.statMainPrice, { color: changeColor }]}>
                {pairPrice != null && pairPrice !== "" ? String(pairPrice) : "—"}
              </AppText>
              <FastImage
                source={isNeg ? downIcon : upIcon}
                resizeMode="contain"
                style={styles.statTrendIcon}
                tintColor={changeColor}
              />
            </View>
            <AppText style={[styles.statChange, { color: changeColor }]}>
              {mergedPair?.change_percentage != null ? `${toFixedThree(Number(mergedPair.change_percentage))}%` : "—"}
            </AppText>
          </View>
          <View style={styles.statsRight}>
            <View style={styles.statCell}>
              <AppText type={TEN} style={[styles.statLabel, { color: themeColors.secondaryText }]}>
                24h High
              </AppText>
              <AppText type={ELEVEN} style={[styles.statValue, { color: themeColors.text }]}>{high ?? "—"}</AppText>
            </View>
            <View style={styles.statCell}>
              <AppText type={TEN} style={[styles.statLabel, { color: themeColors.secondaryText }]}>
                24h Low
              </AppText>
              <AppText type={ELEVEN} style={[styles.statValue, { color: themeColors.text }]}>{low ?? "—"}</AppText>
            </View>
            <View style={styles.statCell}>
              <AppText type={TEN} style={[styles.statLabel, { color: themeColors.secondaryText }]}>
                24h Vol
              </AppText>
              <AppText type={ELEVEN} style={[styles.statValue, { color: themeColors.text }]} numberOfLines={1}>
                {volume != null ? twoFixedTwo(volume) : "—"} {pairBase}
              </AppText>
            </View>
          </View>
        </View>

        {/* Chart — WebView clipped so it does not paint over the order book below */}
        <View style={[styles.chartWrap, { backgroundColor: bg }]}>
          {showSkeleton ? (
            <View style={[styles.chartSkeleton, { height: CHART_BLOCK_HEIGHT, backgroundColor: themeColors.card }]} />
          ) : null}
          <View
            style={[
              styles.chartWebWrap,
              {
                height: CHART_BLOCK_HEIGHT,
                opacity: showSkeleton ? 0 : 1,
              },
            ]}
            pointerEvents={showSkeleton ? "none" : "auto"}
          >
            {chartUri ? (
              <WebView
                key={chartUri}
                source={{ uri: chartUri }}
                style={{ width: Width, height: CHART_BLOCK_HEIGHT, backgroundColor: "transparent" }}
                containerStyle={{ backgroundColor: "transparent" }}
                opaque={false}
                androidLayerType="hardware"
                cacheEnabled
                cacheMode="LOAD_CACHE_ELSE_NETWORK"
                mixedContentMode="compatibility"
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
                bounces={false}
                sharedCookiesEnabled
                javaScriptEnabledAndroid
                scalesPageToFit={false}
                automaticallyAdjustContentInsets={false}
                setSupportMultipleWindows={false}
                overScrollMode="never"
                onLoadEnd={onChartLoaded}
              />
            ) : null}
          </View>
        </View>
        </ScrollView>

        {/* Order book: own flex region so it stays on screen (not only below a long scroll). */}
        <View style={[styles.obSection, { borderTopColor: themeColors.themeBorderColor, flex: 1 }]}>
          <AppText weight={SEMI_BOLD} style={[styles.obTitle, { color: themeColors.text }]}>
            Order Book
          </AppText>
          <View style={[styles.obRatioBar, { backgroundColor: themeColors.card }]}>
            <View style={[styles.obRatioBid, { width: `${bidPct}%`, backgroundColor: themeColors.green }]} />
            <View style={[styles.obRatioAsk, { flex: 1, backgroundColor: themeColors.red }]} />
          </View>
          <View style={styles.obColHeader}>
            <AppText type={TEN} style={[styles.obColH, { color: themeColors.secondaryText }]}>
              Bid
            </AppText>
            <AppText type={TEN} style={[styles.obColH, styles.obColHRight, { color: themeColors.secondaryText }]}>
              Ask
            </AppText>
          </View>
          {depthRows.map((row, idx) => (
            <DepthRow
              key={`d_${idx}`}
              bid={row.bid}
              ask={row.ask}
              maxBidVol={maxBidVol}
              maxAskVol={maxAskVol}
              themeColors={themeColors}
              isDark={isDark}
              formatPrice={formatPrice}
              formatQty={formatQty}
            />
          ))}
        </View>
      </View>

      <TradingDataModal
        visible={pairSheetVisible}
        onClose={() => setPairSheetVisible(false)}
        setCurrency={handleCurrencyChange}
        isDark={isDark}
        theme={theme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  scrollMain: {
    flexGrow: 0,
  },
  scrollMainContent: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 52 : 18,
    paddingBottom: 10,
    paddingHorizontal: 12,
    // borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 18,
    height: 18,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerPairRow: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
  },
  headerTitle: {
    fontSize: 14,
    letterSpacing: 0.15,
  },
  headerChevron: {
    width: 11,
    height: 11,
    marginLeft: 5,
    marginTop: 1,
  },
  statsStrip: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "flex-start",
  },
  statsLeft: {
    width: "44%",
    paddingRight: 8,
  },
  statMainPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
  statChange: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  statTrendIcon: {
    width: 9,
    height: 9,
  },
  statsRight: {
    flex: 1,
    gap: 6,
  },
  statCell: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    flexShrink: 0,
  },
  statValue: {
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  chartWrap: {
    width: Width,
    position: "relative",
    overflow: "hidden",
  },
  chartSkeleton: {
    width: Width,
  },
  chartWebWrap: {
    width: Width,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  obSection: {
    minHeight: 200,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  obTitle: {
    fontSize: 12,
    marginBottom: 6,
  },
  obRatioBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    flexDirection: "row",
    marginBottom: 10,
  },
  obRatioBid: {
    height: "100%",
  },
  obRatioAsk: {
    height: "100%",
  },
  obColHeader: {
    flexDirection: "row",
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  obColH: {
    flex: 1,
    fontWeight: "600",
  },
  obColHRight: {
    textAlign: "right",
  },
  depthRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 19,
    marginBottom: 1,
  },
  depthBidSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 2,
  },
  depthAskSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 2,
  },
  depthQty: {
    width: 48,
  },
  depthBidGradWrap: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 2,
  },
  depthAskGradWrap: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 2,
  },
  depthGradInner: {
    flex: 1,
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 4,
    paddingVertical: 2,
  },
  depthAskInner: {
    justifyContent: "flex-start",
    paddingRight: 0,
    paddingLeft: 4,
  },
  depthBidPrice: {
    fontSize: 10,
    fontWeight: "600",
  },
  depthAskPrice: {
    fontSize: 10,
    fontWeight: "600",
  },
  depthMidRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(128,128,128,0.25)",
    marginHorizontal: 4,
  },
});

export default SpotChartScreen;
