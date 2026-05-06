import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  Animated,
  LayoutAnimation,
  UIManager,
  AppState,
  ActivityIndicator,
  Modal,
  Pressable,
  ImageBackground,
} from "react-native";
import WebView from "react-native-webview";
import LinearGradient from "react-native-linear-gradient";
import { useRoute, useNavigation, useFocusEffect, useIsFocused } from "@react-navigation/native";
import moment from "moment";
import { useDispatch } from "react-redux";
import { useTheme } from "../../hooks/useTheme";
import { AppText, SEMI_BOLD, ELEVEN, TEN, BOLD } from "../../shared";
import FastImage from "react-native-fast-image";
import {
  back_ic,
  downIcon,
  upIcon,
  Refresh,
  starIcon,
  starFillIcon,
  notification_bell_ic,
  bell_ic,
  margin,
  futuresIcon,
  Robot,
  margin_ic,
  future_ic,
  bots_ic,
  buyImage,
  selImage,
} from "../../helper/ImageAssets";
import { toFixedFive, toFixedThree, twoFixedTwo } from "../../helper/utility";
import { useAppSelector } from "../../store/hooks";
import { SocketContext } from "../../SocketProvider";
import { CHART_WEB_BASE_URL } from "../../helper/Constants";
import TradingDataModal from "../../common/TradingDataModal/TradingDataModal";
import { addToFavorites, getFavoriteArray } from "../../actions/homeActions";
import { setBuyOrders, setRecentTrades, setSellOrders, setSpotSelectedPair } from "../../slices/homeSlice";
import { getUserSpotWallet } from "../../actions/walletActions";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import { colors, lightTheme } from "../../theme/colors";
import * as routes from "../../navigation/routes";
import NavigationService from "../../navigation/NavigationService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors as themePalette } from "../../theme/colors";

const { width: Width, height: Height } = Dimensions.get("window");
const CHART_BLOCK_HEIGHT = Math.round(Height * 0.38);
const ORDER_BOOK_ROWS = 12;
/** Tail padding below tab pager + clearance for fixed Buy/Sell bar */
const TAB_SCROLL_BOTTOM_GAP = 12;
const TAB_SCROLL_BAR_CLEARANCE = 72;

/** Pager + chip labels (stable reference for scroll sync callbacks). */
const CHART_BOTTOM_TABS = ["Order Book", "Market Trades", "Assets"];

const CHART_BOTTOM_TAB_ICON = {
  "Order Book": "book-outline",
  "Market Trades": "stats-chart-outline",
  Assets: "wallet-outline",
};

const DEFAULT_ORDER_BOOK_AGG_OPTIONS = [0.1, 0.5, 1, 10, 100];

/** Same idea as web `TradePage/index.js`: steps = tick × 1, 10, 100, … */
function getOrderBookAggOptionsForPair(tickSize) {
  const tick = Number(tickSize);
  if (!Number.isFinite(tick) || tick <= 0) {
    return DEFAULT_ORDER_BOOK_AGG_OPTIONS.slice();
  }
  const mults = [1, 10, 100, 1000, 10000];
  const out = [];
  for (const m of mults) {
    const v = tick * m;
    if (!Number.isFinite(v) || v <= 0) continue;
    out.push(parseFloat(Number(v).toPrecision(12)));
  }
  const unique = Array.from(new Set(out)).sort((a, b) => a - b);
  return unique.length ? unique : DEFAULT_ORDER_BOOK_AGG_OPTIONS.slice();
}

function roundPriceToAgg(price, agg) {
  const n = Number(price);
  const a = Number(agg);
  if (!Number.isFinite(n) || !Number.isFinite(a) || a <= 0) return n;
  return Math.round(n / a) * a;
}

function aggregateOrderBookRows(orders, agg) {
  if (!orders?.length) return [];
  const map = new Map();
  for (const o of orders) {
    const rem = Number(o?.remaining ?? o?.quantity ?? o?.qty ?? o?.amount ?? 0) || 0;
    const bucket = roundPriceToAgg(o.price, agg);
    const prev = map.get(bucket);
    if (prev) {
      prev.quantity = (Number(prev.quantity) || 0) + (Number(o.quantity) || 0);
      prev.remaining = (Number(prev.remaining) || 0) + rem;
    } else {
      map.set(bucket, { ...o, price: bucket, remaining: rem });
    }
  }
  return Array.from(map.values());
}

/** Show only the numeric step (no quote currency suffix). */
function formatAggStepLabel(step) {
  if (step == null || step === "") return "—";
  if (typeof step === "number" && Number.isFinite(step)) {
    const s = step >= 1 ? step.toString() : step.toFixed(8).replace(/\.?0+$/, "");
    return s || String(step);
  }
  const raw = String(step).trim();
  const m = raw.match(/^-?\d*\.?\d+(?:e[+-]?\d+)?/i);
  if (m) {
    const n = Number(m[0]);
    if (Number.isFinite(n)) {
      const s = n >= 1 ? n.toString() : n.toFixed(8).replace(/\.?0+$/, "");
      return s || m[0];
    }
  }
  return raw;
}

const orderBookDataEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i],
      y = b[i];
    if (String(x?.price) !== String(y?.price) || String(x?.remaining) !== String(y?.remaining)) return false;
  }
  return true;
};

const SHIMMER_STRIP_WIDTH_DEFAULT = 100;
const ShimmerBox = React.memo(({
  width,
  height,
  borderRadius = 8,
  style,
  shimmerStripWidth = SHIMMER_STRIP_WIDTH_DEFAULT,
  shimmerDuration = 700,
  shimmerToValue,
  shimmerColorsOverride,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const stripW = typeof shimmerStripWidth === "number" ? shimmerStripWidth : SHIMMER_STRIP_WIDTH_DEFAULT;
  const boneColor =
    themeColors?.input ??
    themeColors?.card ??
    (isDark ? "rgba(100, 130, 180, 0.22)" : "rgba(160, 185, 220, 0.35)");
  const shimmerColors =
    shimmerColorsOverride ||
    (isDark
      ? ["transparent", "rgba(255,255,255,0.26)", "transparent"]
      : ["transparent", "rgba(255,255,255,0.72)", "transparent"]);
  const shimmerX = useRef(new Animated.Value(-stripW)).current;
  useEffect(() => {
    shimmerX.setValue(-stripW);
    const run = () => {
      shimmerX.setValue(-stripW);
      Animated.timing(shimmerX, {
        toValue: shimmerToValue !== undefined ? shimmerToValue : Width + stripW,
        duration: shimmerDuration,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) run();
      });
    };
    run();
    return () => shimmerX.stopAnimation();
  }, [shimmerX, stripW, isDark, shimmerDuration, shimmerToValue]);
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
});

const CHART_BG_FALLBACK = "transparent";

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

const ChartSkeleton = React.memo(({ height = CHART_BLOCK_HEIGHT, width = Width }) => {
  const { colors: themeColors, isDark } = useTheme();
  const bg = themeColors.background ?? CHART_BG_FALLBACK;
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
            {SKELETON_CANDLES.map((candle, i) => {
              return (
                <View key={i} style={{ alignItems: 'center', width: 8, height: '100%', justifyContent: 'flex-end' }}>
                  <ShimmerBox
                    width={1.5} height={candle.wickH} borderRadius={1}
                    style={{ position: 'absolute', bottom: candle.wickBot }}
                    shimmerDuration={1500} shimmerToValue={60} shimmerStripWidth={60} shimmerColorsOverride={["transparent", isDark ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.8)", "transparent"]}
                  />
                  <ShimmerBox
                    width={6} height={candle.bodyH} borderRadius={2}
                    style={{ position: 'absolute', bottom: candle.bodyBot }}
                    shimmerDuration={1500} shimmerToValue={60} shimmerStripWidth={60} shimmerColorsOverride={["transparent", isDark ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.8)", "transparent"]}
                  />
                </View>
              );
            })}
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
});

const OrderBookSkeleton = React.memo(({ rows = 12 }) => {
  const ROW_HEIGHT = 19;
  const BONE_HEIGHT = 14;
  const BONE_RADIUS = 4;
  return (
    <View style={{ flex: 1, paddingVertical: 4, gap: 2 }}>
      {[...Array(rows)].map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            height: ROW_HEIGHT,
          }}
        >
          <ShimmerBox width="48%" height={BONE_HEIGHT} borderRadius={BONE_RADIUS} />
          <ShimmerBox width="48%" height={BONE_HEIGHT} borderRadius={BONE_RADIUS} />
        </View>
      ))}
    </View>
  );
});

/** One row: bid (qty | price + green depth) + ask (price + red depth | qty) — theme colors from app. */
const toFinite = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const orderBookRemaining = (row) =>
  toFinite(row?.remaining ?? row?.quantity ?? row?.qty ?? row?.amount ?? 0);

const DepthRow = React.memo(({ bid, ask, maxBidVol, maxAskVol, themeColors, isDark, formatPrice, formatQty }) => {
  // Depth bar colors (web-like). Keep low opacity so text stays readable.
  const depthGreen = isDark ? "rgba(0, 192, 118, 0.16)" : "rgba(0, 192, 118, 0.12)";
  const depthRed = isDark ? "rgba(232, 97, 97, 0.18)" : "rgba(255, 77, 79, 0.14)";
  const bidRem = bid ? orderBookRemaining(bid) : 0;
  const askRem = ask ? orderBookRemaining(ask) : 0;
  const br = maxBidVol > 0 ? clamp01(bidRem / maxBidVol) : 0;
  const ar = maxAskVol > 0 ? clamp01(askRem / maxAskVol) : 0;

  return (
    <View style={styles.depthRow}>
      <View style={styles.depthBidSide}>
        <AppText type={ELEVEN} style={[styles.depthQty, { color: themeColors.secondaryText }]} numberOfLines={1}>
          {bid ? formatQty(bidRem) : "—"}
        </AppText>
        <View style={styles.depthBidGradWrap}>
          <View style={[styles.depthGradInner, { position: "relative", overflow: "hidden" }]}>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: `${Math.round(br * 100)}%`,
                backgroundColor: depthGreen,
              }}
            />
            <AppText style={[styles.depthBidPrice, { color: themeColors.green }]}>
              {bid ? formatPrice(bid.price) : ""}
            </AppText>
          </View>
        </View>
      </View>
      <View style={styles.depthMidRule} />
      <View style={styles.depthAskSide}>
        <View style={styles.depthAskGradWrap}>
          <View style={[styles.depthGradInner, styles.depthAskInner, { position: "relative", overflow: "hidden" }]}>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                right: 0,
                width: `${Math.round(ar * 100)}%`,
                backgroundColor: depthRed,
              }}
            />
            <AppText style={[styles.depthAskPrice, { color: themeColors.red }]}>
              {ask ? formatPrice(ask.price) : ""}
            </AppText>
          </View>
        </View>
        <AppText type={ELEVEN} style={[styles.depthQty, { color: themeColors.secondaryText, textAlign: "right" }]} numberOfLines={1}>
          {ask ? formatQty(askRem) : "—"}
        </AppText>
      </View>
    </View>
  );
});

const SpotChartScreen = () => {
  const dispatch = useDispatch();
  const { colors: themeColors, theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const tabScrollBottomPadding =
    TAB_SCROLL_BOTTOM_GAP + TAB_SCROLL_BAR_CLEARANCE + Math.max(insets.bottom, 8);
  const { subscribeToExchange } = useContext(SocketContext) || {};

  const spotSelectedPair = useAppSelector((state) => state.home.spotSelectedPair);
  const buyOrders = useAppSelector((state) => state.home.buyOrders);
  const sellOrders = useAppSelector((state) => state.home.sellOrders);
  const userData = useAppSelector((state) => state.auth.userData);
  const loading = useAppSelector((state) => state.auth.loading);
  const userSpotWallet = useAppSelector((state) => state.wallet.userSpotWallet);
  const recentTrades = useAppSelector((state) => state.home.recentTrades);
  const favoriteArray = useAppSelector((state) => state.home.favoriteArray);
  const favoriteArrayLoaded = useAppSelector((state) => state.home.favoriteArrayLoaded);

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
      _id: spotSelectedPair?._id ?? params._id ?? params.pair_id,
      tick_size: spotSelectedPair?.tick_size ?? params?.tick_size,
    }),
    [spotSelectedPair, params]
  );

  const pairRef = useRef(mergedPair);
  pairRef.current = mergedPair;

  const isFav = useMemo(() => {
    if (!favoriteArray || !mergedPair?._id) return false;
    return favoriteArray.includes(mergedPair._id);
  }, [favoriteArray, mergedPair?._id]);

  useEffect(() => {
    if (userData && !favoriteArrayLoaded) {
      dispatch(getFavoriteArray());
    }
  }, [userData, favoriteArrayLoaded, dispatch]);

  const [favLoading, setFavLoading] = useState(false);

  const toggleFavorite = useCallback(async () => {
    if (!mergedPair?._id || favLoading) {
      return;
    }
    setFavLoading(true);
    try {
      await dispatch(addToFavorites({ pair_id: mergedPair._id }));
    } catch (e) {
      console.log("Favorite toggle error", e);
    } finally {
      setFavLoading(false);
    }
  }, [dispatch, mergedPair?._id, favLoading]);

  const onNotificationPress = useCallback(() => {
    NavigationService.navigate(routes.NOTIFICATION_SCREEN);
  }, []);

  const [pairSheetVisible, setPairSheetVisible] = useState(false);

  const pairBase = mergedPair?.base_currency || "-";
  const pairQuote = mergedPair?.quote_currency || "-";
  const pairChange = mergedPair?.change_percentage ?? 0;
  const pairPrice = mergedPair?.buy_price ?? "—";
  const high = mergedPair?.high;
  const low = mergedPair?.low;
  const volume = mergedPair?.volume;

  /** `activeTab` drives header highlight & controls; `mountedTab` drives rendered body to avoid height issues. */
  const [activeTab, setActiveTab] = useState("Order Book");
  const [mountedTab, setMountedTab] = useState("Order Book");
  /** Tab press slide animation (mount 1–2 panels only; avoids tallest-tab height issue). */
  const bottomSlideX = useRef(new Animated.Value(0)).current;
  const [bottomSlidePair, setBottomSlidePair] = useState(null); // { from:string, to:string, dir:1|-1 } | null
  const pairTickSize = mergedPair?.tick_size ?? 0.01;
  const orderBookAggOptions = useMemo(
    () => getOrderBookAggOptionsForPair(pairTickSize),
    [pairTickSize]
  );
  const [orderBookAggStep, setOrderBookAggStep] = useState(DEFAULT_ORDER_BOOK_AGG_OPTIONS[0]);
  // Aggregation dropdown disabled per design (no selector next to Assets)
  /** both = split, bids = buy side only, asks = sell side only (matches web `orderBookViewMode`) */
  const [orderBookViewMode, setOrderBookViewMode] = useState("both");

  useEffect(() => {
    if (!orderBookAggOptions.length) return;
    setOrderBookAggStep(orderBookAggOptions[0]);
  }, [orderBookAggOptions, mergedPair?.base_currency_id, mergedPair?.quote_currency_id]);

  const formatRecentTradeTime = (item) => {
    const ts = item?.executed_at || item?.executedAt || item?.time || item?.created_at;
    if (!ts) return "—";
    const m = moment(ts);
    return m.isValid() ? m.format("HH:mm:ss") : "—";
  };

  const getFilteredWallets = () => {
    if (!userSpotWallet) return [];
    return [...userSpotWallet]
      .filter((w) => parseFloat(w.balance) > 0)
      .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
  };

  const filteredWallets = getFilteredWallets();

  const handleTabChange = (tab) => {
    if (!CHART_BOTTOM_TABS.includes(tab)) return;
    if (bottomSlidePair) return;
    if (activeTab === tab) return;
    const from = mountedTab;
    const to = tab;
    const fromIdx = CHART_BOTTOM_TABS.indexOf(from);
    const toIdx = CHART_BOTTOM_TABS.indexOf(to);
    const dir = toIdx > fromIdx ? 1 : -1;
    setActiveTab(to); // update highlight + dropdown immediately
    setBottomSlidePair({ from, to, dir });
    bottomSlideX.setValue(0);
    Animated.timing(bottomSlideX, {
      toValue: -dir * Width,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setMountedTab(to);
      setBottomSlidePair(null);
      bottomSlideX.setValue(0);
    });
  };

  useEffect(() => {
    if (activeTab === "Assets" && userData) {
      dispatch(getUserSpotWallet("spot"));
    }
  }, [activeTab, userData, dispatch]);

  const [lastSocketData, setLastSocketData] = useState(null);
  const socket = useAppSelector((state) => state.home.socket);
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(true);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  const socketThrottleTimerRef = useRef(null);
  const socketLastFlushRef = useRef(0);
  const pendingSocketFlushRef = useRef(null);
  const lastFlushedBuyRef = useRef(null);
  const lastFlushedSellRef = useRef(null);
  const SOCKET_UI_THROTTLE_MS = 800;

  const flushSocketToState = useCallback((payload) => {
    if (!payload || !isFocusedRef.current) return;
    setLastSocketData(payload.data);
    if (payload.sellOrders) {
      if (!orderBookDataEqual(lastFlushedSellRef.current, payload.sellOrders)) {
        lastFlushedSellRef.current = payload.sellOrders;
        dispatch(setSellOrders(payload.sellOrders));
      }
    }
    if (payload.buyOrders) {
      if (!orderBookDataEqual(lastFlushedBuyRef.current, payload.buyOrders)) {
        lastFlushedBuyRef.current = payload.buyOrders;
        dispatch(setBuyOrders(payload.buyOrders));
      }
    }
    if (payload.recentTrades) {
      dispatch(setRecentTrades(payload.recentTrades));
    }
  }, [dispatch]);



  useFocusEffect(
    useCallback(() => {
      const p = pairRef.current;
      if (!p?.base_currency_id || !p?.quote_currency_id) {
        dispatch(setBuyOrders([]));
        dispatch(setSellOrders([]));
        dispatch(setRecentTrades([]));
        setLastSocketData(null);
        return undefined;
      }
      /** Idempotent — keeps same exchange stream when stacked above Spot (do not clear Redux on blur). */
      subscribeToExchange?.(p.base_currency_id, p.quote_currency_id);
      return undefined;
    }, [subscribeToExchange, dispatch])
  );

  // useEffect(() => {
  //   if (!socket || !isFocused) return;

  //   const handleMessage = (data) => {
  //     if (!isFocusedRef.current || appStateRef.current !== "active") return;

  //     if (data?.buy_order || data?.sell_order || data?.recent_trades) {
  //       const buyOrders = data?.buy_order ? (data.buy_order || []).map(transformLocalOrder) : null;
  //       const sellOrders = data?.sell_order ? (data.sell_order || []).map(transformLocalOrder) : null;
  //       const payload = {
  //         data,
  //         buyOrders,
  //         sellOrders,
  //         recentTrades: data?.recent_trades || null,
  //       };

  //       pendingSocketFlushRef.current = payload;
  //       const now = Date.now();
  //       const elapsed = now - socketLastFlushRef.current;
  //       if (elapsed >= SOCKET_UI_THROTTLE_MS || socketLastFlushRef.current === 0) {
  //         socketLastFlushRef.current = now;
  //         flushSocketToState(payload);
  //         pendingSocketFlushRef.current = null;
  //         if (socketThrottleTimerRef.current) {
  //           clearTimeout(socketThrottleTimerRef.current);
  //           socketThrottleTimerRef.current = null;
  //         }
  //       } else if (!socketThrottleTimerRef.current) {
  //         socketThrottleTimerRef.current = setTimeout(() => {
  //           socketThrottleTimerRef.current = null;
  //           socketLastFlushRef.current = Date.now();
  //           const pending = pendingSocketFlushRef.current;
  //           pendingSocketFlushRef.current = null;
  //           if (pending) flushSocketToState(pending);
  //         }, SOCKET_UI_THROTTLE_MS - elapsed);
  //       }
  //     }
  //   };

  //   socket.on("message", handleMessage);
  //   socket.on("exchange:update", handleMessage);
  //   return () => {
  //     socket.off("message", handleMessage);
  //     socket.off("exchange:update", handleMessage);
  //     if (socketThrottleTimerRef.current) {
  //       clearTimeout(socketThrottleTimerRef.current);
  //       socketThrottleTimerRef.current = null;
  //     }
  //   };
  // }, [socket, isFocused, transformLocalOrder, flushSocketToState]);

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
      setLastSocketData(null);
    },
    [dispatch]
  );

  const prevChartPairKeyRef = useRef(null);
  useEffect(() => {
    const base = mergedPair?.base_currency_id;
    const quote = mergedPair?.quote_currency_id;
    if (!base || !quote) return;
    const key = `${base}-${quote}`;
    if (prevChartPairKeyRef.current == null) {
      prevChartPairKeyRef.current = key;
      return;
    }
    if (prevChartPairKeyRef.current === key) return;
    prevChartPairKeyRef.current = key;
    dispatch(setBuyOrders([]));
    dispatch(setSellOrders([]));
    dispatch(setRecentTrades([]));
    setLastSocketData(null);
  }, [mergedPair?.base_currency_id, mergedPair?.quote_currency_id, dispatch]);

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

  const bidsAggregated = useMemo(() => {
    if (!buyOrders?.length) return [];
    const agg = aggregateOrderBookRows(buyOrders, orderBookAggStep);
    return agg.sort((a, b) => toFinite(b.price) - toFinite(a.price));
  }, [buyOrders, orderBookAggStep]);

  const asksAggregated = useMemo(() => {
    if (!sellOrders?.length) return [];
    const agg = aggregateOrderBookRows(sellOrders, orderBookAggStep);
    return agg.sort((a, b) => toFinite(a.price) - toFinite(b.price));
  }, [sellOrders, orderBookAggStep]);

  const bidsDisplay = useMemo(() => bidsAggregated.slice(0, ORDER_BOOK_ROWS), [bidsAggregated]);
  const asksDisplay = useMemo(() => asksAggregated.slice(0, ORDER_BOOK_ROWS), [asksAggregated]);

  const maxBidVol = useMemo(
    () => Math.max(1, ...bidsDisplay.map((o) => orderBookRemaining(o))),
    [bidsDisplay]
  );
  const maxAskVol = useMemo(
    () => Math.max(1, ...asksDisplay.map((o) => orderBookRemaining(o))),
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
      const bid = bidsDisplay[i] || null;
      const ask = asksDisplay[i] || null;
      if (orderBookViewMode === "both") {
        rows.push({ bid, ask });
      } else if (orderBookViewMode === "bids") {
        rows.push({ bid, ask: null });
      } else {
        rows.push({ bid: null, ask });
      }
    }
    return rows;
  }, [bidsDisplay, asksDisplay, orderBookViewMode]);

  const bidVolSum = useMemo(
    () => bidsDisplay.reduce((s, o) => s + orderBookRemaining(o), 0),
    [bidsDisplay]
  );
  const askVolSum = useMemo(
    () => asksDisplay.reduce((s, o) => s + orderBookRemaining(o), 0),
    [asksDisplay]
  );
  const totalVolBar = bidVolSum + askVolSum || 1;
  const bidPct = (bidVolSum / totalVolBar) * 100;

  // (openAggMenu/closeAggMenu/selectAggStep removed)

  const goToSpotTradeSide = useCallback(
    (side) => {
      navigation.navigate({
        name: routes.NAVIGATION_BOTTOM_TAB_STACK,
        params: {
          screen: routes.WALLET_SCREEN,
          params: { spotTradeSide: side },
        },
      });
    },
    [navigation]
  );

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />

      <View style={[styles.header, { backgroundColor: bg }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <FastImage
              source={back_ic}
              style={styles.backIcon}
              resizeMode="contain"
              tintColor={themeColors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerPairRow}
            onPress={() => setPairSheetVisible(true)}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppText
              weight={BOLD}
              numberOfLines={1}
              style={[styles.headerTitle, { color: themeColors.text }]}
            >
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
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={toggleFavorite}
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            disabled={favLoading}
          >
            {favLoading ? (
              <ActivityIndicator size="small" color={isFav ? "#FFD700" : themeColors.text} />
            ) : (
              <FastImage
                source={isFav ? starFillIcon : starIcon}
                style={styles.headerIcon}
                resizeMode="contain"
                tintColor={isFav ? "#FFD700" : themeColors.text}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onNotificationPress} style={styles.headerIconBtn} activeOpacity={0.7}>
            <FastImage
              source={bell_ic}
              style={styles.headerIcon}
              resizeMode="contain"
              tintColor={themeColors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        <ScrollView
          style={styles.scrollMain}
          contentContainerStyle={[
            styles.scrollMainContent,
            { paddingBottom: tabScrollBottomPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
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

          {/* Chart — fixed height; skeleton overlays WebView (never stacked) so layout does not jump */}
          <View style={[styles.chartWrap, { backgroundColor: bg, height: CHART_BLOCK_HEIGHT }]}>
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
            {showSkeleton ? (
              <View style={styles.chartSkeletonOverlay} pointerEvents="none">
                <ChartSkeleton height={CHART_BLOCK_HEIGHT} width={Width} />
              </View>
            ) : null}
          </View>

        {/* Order book + tabs — same vertical scroll as chart (full-height scroll) */}
          <View
            style={[
              styles.obTabsRow,
              {
                paddingHorizontal: 12,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: themeColors.themeBorderColor,
              },
            ]}
          >
            <View style={styles.obTabsLeft}>
              {CHART_BOTTOM_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  activeOpacity={0.7}
                  onPress={() => handleTabChange(tab)}
                  style={[
                    styles.obTab,
                    activeTab === tab && [
                      styles.obTabActive,
                      { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : lightTheme.input },
                    ],
                  ]}
                >
                 
                  <AppText
                    type={TEN}
                    weight={activeTab === tab ? SEMI_BOLD : undefined}
                    style={{ color: activeTab === tab ? themeColors.text : themeColors.secondaryText }}
                  >
                    {tab}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
            {/** Agg dropdown removed (design) */}
          </View>

          {/* Slide-in animation on tab press (renders 2 panels only during animation). */}
          {bottomSlidePair ? (
            <View style={{ width: Width, overflow: "hidden" }}>
              <Animated.View
                style={{
                  flexDirection: "row",
                  width: Width * 2,
                  transform: [{ translateX: bottomSlideX }],
                }}
              >
                <View style={{ width: Width }}>
                  {bottomSlidePair.from === "Order Book" ? (
                    <View style={{ width: Width, paddingHorizontal: 12 }}>
              <View style={styles.obRatioRow}>
                <ImageBackground
                  source={buyImage}
                  resizeMode="stretch"
                  style={styles.obRatioPill}
                  imageStyle={{ }}
                >
                  <AppText style={{ color: themeColors.green, fontWeight: "800", fontSize: 12 }}>
                    {Math.round(bidPct)}%
                  </AppText>
                </ImageBackground>
                <ImageBackground
                  source={selImage}
                  resizeMode="stretch"
                  style={styles.obRatioPill}
                  imageStyle={{  }}
                >
                  <AppText style={{ color: themeColors.red, fontWeight: "800", fontSize: 12 }}>
                    {Math.round(100 - bidPct)}%
                  </AppText>
                </ImageBackground>
              </View>

              <View style={styles.obColHeader}>
                <View style={styles.depthBidSide}>
                  <AppText type={TEN} style={[styles.obColH, { color: themeColors.secondaryText }]}>
                    Bid
                  </AppText>
                </View>
                <View style={[styles.depthMidRule, { backgroundColor: "transparent" }]} />
                <View style={styles.depthAskSide}>
                  <AppText type={TEN} style={[styles.obColH, { color: themeColors.secondaryText }]}>
                    Ask
                  </AppText>
                </View>
              </View>

              {lastSocketData || buyOrders?.length > 0 || sellOrders?.length > 0 ? (
                depthRows.map((row, idx) => (
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
                ))
              ) : (
                <OrderBookSkeleton rows={ORDER_BOOK_ROWS} />
              )}
                    </View>
                  ) : bottomSlidePair.from === "Market Trades" ? (
                    <View style={{ width: Width, paddingHorizontal: 12 }}>
              <View style={styles.mtContainer}>
                <View style={styles.mtHeader}>
                  <AppText
                    type={TEN}
                    style={[styles.mtCell, { color: themeColors.secondaryText, textAlign: "left" }]}
                  >
                    Price({pairQuote})
                  </AppText>
                  <AppText
                    type={TEN}
                    style={[styles.mtCell, { color: themeColors.secondaryText, textAlign: "center" }]}
                  >
                    Quantity({pairBase})
                  </AppText>
                  <AppText
                    type={TEN}
                    style={[styles.mtCell, { color: themeColors.secondaryText, textAlign: "right" }]}
                  >
                    Time
                  </AppText>
                </View>
                <View>
                  {recentTrades?.length > 0 ? (
                    recentTrades?.slice(0, 50)?.map((item, index) => (
                      <View key={item?._id || index} style={styles.mtRow}>
                        <AppText
                          type={TEN}
                          style={[
                            styles.mtCell,
                            {
                              color:
                                item?.side === "BUY"
                                  ? themeColors.green || "#00c076"
                                  : themeColors.red || "#ff3b30",
                              textAlign: "left",
                              fontWeight: "600",
                            },
                          ]}
                        >
                          {String(item?.price || 0)}
                        </AppText>
                        <AppText
                          type={TEN}
                          style={[styles.mtCell, { color: themeColors.text || "#000", textAlign: "center" }]}
                        >
                          {String(item?.quantity || 0)}
                        </AppText>
                        <AppText
                          type={TEN}
                          style={[
                            styles.mtCell,
                            { color: themeColors.secondaryText || "#888", textAlign: "right" },
                          ]}
                        >
                          {formatRecentTradeTime(item)}
                        </AppText>
                      </View>
                    ))
                  ) : (
                    <View style={styles.noDataContainer}>
                      <AppText type={TEN} style={{ color: themeColors.secondaryText }}>
                        No market trades yet
                      </AppText>
                    </View>
                  )}
                </View>
              </View>
                    </View>
                  ) : (
                    <View style={{ width: Width, paddingHorizontal: 12 }}>
              <View style={styles.assetsContainer}>
                {!userData ? (
                  <View style={styles.noDataContainer}>
                    <AppText
                      type={TEN}
                      style={{ color: themeColors.secondaryText, marginBottom: 10 }}
                    >
                      Please login to view your wallets
                    </AppText>
                    <TouchableOpacity
                      style={styles.loginBtn}
                      onPress={() => NavigationService.navigate(routes.LOGIN_SCREEN)}
                    >
                      <AppText type={TEN} weight={SEMI_BOLD} style={{ color: "#fff" }}>
                        Login
                      </AppText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.assetsHeader}>
                      <View style={styles.assetsHeaderTitleRow}>
                        <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                          Spot Wallets
                        </AppText>
                        <TouchableOpacity onPress={() => dispatch(getUserSpotWallet("spot"))}>
                          <FastImage
                            source={Refresh}
                            style={{ width: 14, height: 14 }}
                            resizeMode="contain"
                            tintColor={themeColors.text}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.assetsActionRow}>
                      <TouchableOpacity
                        style={[styles.assetActionBtn, { backgroundColor: themeColors.green }]}
                        onPress={() => NavigationService.navigate(routes.DEPOSIT_COIN_SCREEN)}
                      >
                        <AppText type={TEN} weight={SEMI_BOLD} style={{ color: "#fff" }}>
                          Deposit
                        </AppText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.assetActionBtn, { backgroundColor: themeColors.red }]}
                        onPress={() => NavigationService.navigate(routes.WITHDRAW_Coin_SCREEN)}
                      >
                        <AppText type={TEN} weight={SEMI_BOLD} style={{ color: "#fff" }}>
                          Withdraw
                        </AppText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.assetActionBtn, { backgroundColor: themeColors.button }]}
                        onPress={() => NavigationService.navigate(routes.TRANSFER_SCREEN)}
                      >
                        <AppText type={TEN} weight={SEMI_BOLD} style={{ color: "#fff" }}>
                          Transfer
                        </AppText>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.assetsListHeader}>
                      <AppText type={TEN} style={[styles.mtCell, { color: themeColors.secondaryText }]}>
                        Asset
                      </AppText>
                      <AppText
                        type={TEN}
                        style={[
                          styles.mtCell,
                          { color: themeColors.secondaryText, textAlign: "right" },
                        ]}
                      >
                        Balance
                      </AppText>
                    </View>

                    {filteredWallets.length > 0 ? (
                      filteredWallets.map((wallet, index) => (
                        <View key={wallet?._id || index} style={styles.assetRow}>
                          <View style={styles.assetInfo}>
                            <FastImage
                              source={{ uri: `${IMAGE_BASE_URL}${wallet?.icon_path}` }}
                              style={styles.assetIcon}
                              resizeMode="contain"
                            />
                            <AppText
                              type={TEN}
                              weight={SEMI_BOLD}
                              style={{ color: themeColors.text }}
                            >
                              {wallet?.short_name}
                            </AppText>
                          </View>
                          <AppText
                            type={TEN}
                            weight={SEMI_BOLD}
                            style={{ color: themeColors.text, textAlign: "right" }}
                          >
                            {parseFloat(Number(wallet?.balance || 0).toFixed(8))}
                          </AppText>
                        </View>
                      ))
                    ) : (
                      <View style={styles.noDataContainer}>
                        <AppText type={TEN} style={{ color: themeColors.secondaryText }}>
                          No assets in spot wallet
                        </AppText>
                      </View>
                    )}
                  </>
                )}
              </View>
                    </View>
                  )}
                </View>

                <View style={{ width: Width }}>
                  {bottomSlidePair.to === "Order Book" ? (
                    <View style={{ width: Width, paddingHorizontal: 12 }}>
                      <View style={styles.obRatioRow}>
                        <ImageBackground
                          source={buyImage}
                          resizeMode="stretch"
                          style={styles.obRatioPill}
                          imageStyle={{ borderRadius: 10 }}
                        >
                          <AppText style={{ color: themeColors.green, fontWeight: "800", fontSize: 12 }}>
                            {Math.round(bidPct)}%
                          </AppText>
                        </ImageBackground>
                        <ImageBackground
                          source={selImage}
                          resizeMode="stretch"
                          style={styles.obRatioPill}
                          imageStyle={{ borderRadius: 10 }}
                        >
                          <AppText style={{ color: themeColors.red, fontWeight: "800", fontSize: 12 }}>
                            {Math.round(100 - bidPct)}%
                          </AppText>
                        </ImageBackground>
                      </View>
                      <View style={styles.obColHeader}>
                        <View style={styles.depthBidSide}>
                          <AppText type={TEN} style={[styles.obColH, { color: themeColors.secondaryText }]}>
                            Bid
                          </AppText>
                        </View>
                        <View style={[styles.depthMidRule, { backgroundColor: "transparent" }]} />
                        <View style={styles.depthAskSide}>
                          <AppText type={TEN} style={[styles.obColH, { color: themeColors.secondaryText }]}>
                            Ask
                          </AppText>
                        </View>
                      </View>
                      {lastSocketData || buyOrders?.length > 0 || sellOrders?.length > 0 ? (
                        depthRows.map((row, idx) => (
                          <DepthRow
                            key={`d2_${idx}`}
                            bid={row.bid}
                            ask={row.ask}
                            maxBidVol={maxBidVol}
                            maxAskVol={maxAskVol}
                            themeColors={themeColors}
                            isDark={isDark}
                            formatPrice={formatPrice}
                            formatQty={formatQty}
                          />
                        ))
                      ) : (
                        <OrderBookSkeleton rows={ORDER_BOOK_ROWS} />
                      )}
                    </View>
                  ) : bottomSlidePair.to === "Market Trades" ? (
                    <View style={{ width: Width, paddingHorizontal: 12 }}>
                      <View style={styles.mtContainer}>
                        <View style={styles.mtHeader}>
                          <AppText type={TEN} style={[styles.mtCell, { color: themeColors.secondaryText, textAlign: "left" }]}>
                            Price({pairQuote})
                          </AppText>
                          <AppText type={TEN} style={[styles.mtCell, { color: themeColors.secondaryText, textAlign: "center" }]}>
                            Quantity({pairBase})
                          </AppText>
                          <AppText type={TEN} style={[styles.mtCell, { color: themeColors.secondaryText, textAlign: "right" }]}>
                            Time
                          </AppText>
                        </View>
                        <View>
                          {recentTrades?.length > 0 ? (
                            recentTrades?.slice(0, 50)?.map((item, index) => (
                              <View key={item?._id || index} style={styles.mtRow}>
                                <AppText
                                  type={TEN}
                                  style={[
                                    styles.mtCell,
                                    {
                                      color:
                                        item?.side === "BUY"
                                          ? themeColors.green || "#00c076"
                                          : themeColors.red || "#ff3b30",
                                      textAlign: "left",
                                      fontWeight: "600",
                                    },
                                  ]}
                                >
                                  {String(item?.price || 0)}
                                </AppText>
                                <AppText type={TEN} style={[styles.mtCell, { color: themeColors.text || "#000", textAlign: "center" }]}>
                                  {String(item?.quantity || 0)}
                                </AppText>
                                <AppText
                                  type={TEN}
                                  style={[styles.mtCell, { color: themeColors.secondaryText || "#888", textAlign: "right" }]}
                                >
                                  {formatRecentTradeTime(item)}
                                </AppText>
                              </View>
                            ))
                          ) : (
                            <View style={styles.noDataContainer}>
                              <AppText type={TEN} style={{ color: themeColors.secondaryText }}>
                                No market trades yet
                              </AppText>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={{ width: Width, paddingHorizontal: 12 }}>
                      <View style={styles.assetsContainer}>
                        {!userData ? (
                          <View style={styles.noDataContainer}>
                            <AppText type={TEN} style={{ color: themeColors.secondaryText, marginBottom: 10 }}>
                              Please login to view your wallets
                            </AppText>
                            <TouchableOpacity style={styles.loginBtn} onPress={() => NavigationService.navigate(routes.LOGIN_SCREEN)}>
                              <AppText type={TEN} weight={SEMI_BOLD} style={{ color: "#fff" }}>
                                Login
                              </AppText>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <>
                            <View style={styles.assetsHeader}>
                              <View style={styles.assetsHeaderTitleRow}>
                                <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                                  Spot Wallets
                                </AppText>
                                <TouchableOpacity onPress={() => dispatch(getUserSpotWallet("spot"))}>
                                  <FastImage
                                    source={Refresh}
                                    style={{ width: 14, height: 14 }}
                                    resizeMode="contain"
                                    tintColor={themeColors.text}
                                  />
                                </TouchableOpacity>
                              </View>
                            </View>
                            <View style={styles.assetsActionRow}>
                              <TouchableOpacity
                                style={[styles.assetActionBtn, { backgroundColor: themeColors.green }]}
                                onPress={() => NavigationService.navigate(routes.DEPOSIT_COIN_SCREEN)}
                              >
                                <AppText type={TEN} weight={SEMI_BOLD} style={{ color: "#fff" }}>
                                  Deposit
                                </AppText>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.assetActionBtn, { backgroundColor: themeColors.red }]}
                                onPress={() => NavigationService.navigate(routes.WITHDRAW_Coin_SCREEN)}
                              >
                                <AppText type={TEN} weight={SEMI_BOLD} style={{ color: "#fff" }}>
                                  Withdraw
                                </AppText>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.assetActionBtn, { backgroundColor: themeColors.button }]}
                                onPress={() => NavigationService.navigate(routes.TRANSFER_SCREEN)}
                              >
                                <AppText type={TEN} weight={SEMI_BOLD} style={{ color: "#fff" }}>
                                  Transfer
                                </AppText>
                              </TouchableOpacity>
                            </View>
                            <View style={styles.assetsListHeader}>
                              <AppText type={TEN} style={[styles.mtCell, { color: themeColors.secondaryText }]}>
                                Asset
                              </AppText>
                              <AppText type={TEN} style={[styles.mtCell, { color: themeColors.secondaryText, textAlign: "right" }]}>
                                Balance
                              </AppText>
                            </View>
                            {filteredWallets.length > 0 ? (
                              filteredWallets.map((wallet, index) => (
                                <View key={wallet?._id || index} style={styles.assetRow}>
                                  <View style={styles.assetInfo}>
                                    <FastImage
                                      source={{ uri: `${IMAGE_BASE_URL}${wallet?.icon_path}` }}
                                      style={styles.assetIcon}
                                      resizeMode="contain"
                                    />
                                    <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                                      {wallet?.short_name}
                                    </AppText>
                                  </View>
                                  <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text, textAlign: "right" }}>
                                    {parseFloat(Number(wallet?.balance || 0).toFixed(8))}
                                  </AppText>
                                </View>
                              ))
                            ) : (
                              <View style={styles.noDataContainer}>
                                <AppText type={TEN} style={{ color: themeColors.secondaryText }}>
                                  No assets in spot wallet
                                </AppText>
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </Animated.View>
            </View>
          ) : (
            /* One panel mounted at a time — avoids tallest-tab stretching. */
            <View style={styles.chartBottomTabBody}>
              {mountedTab === "Order Book" ? (
                <View style={{ width: Width, paddingHorizontal: 12 }}>
                  <View style={[styles.obRatioRow,{gap:0}]}>
                    <ImageBackground
                      source={buyImage}
                      resizeMode="stretch"
                      style={styles.obRatioPill}
                      imageStyle={{ borderRadius: 10 }}
                    >
                      <AppText style={{ color: themeColors.green, fontWeight: "800", fontSize: 12 }}>
                        {Math.round(bidPct)}%
                      </AppText>
                    </ImageBackground>
                    <ImageBackground
                      source={selImage}
                      resizeMode="stretch"
                      style={styles.obRatioPill}
                      imageStyle={{ borderRadius: 10 }}
                    >
                      <AppText style={{ color: themeColors.red, fontWeight: "800", fontSize: 12 }}>
                        {Math.round(100 - bidPct)}%
                      </AppText>
                    </ImageBackground>
                  </View>
                  <View style={styles.obColHeader}>
                    <View style={styles.depthBidSide}>
                      <AppText type={TEN} style={[styles.obColH, { color: themeColors.secondaryText }]}>
                        Bid
                      </AppText>
                    </View>
                    <View style={[styles.depthMidRule, { backgroundColor: "transparent" }]} />
                    <View style={styles.depthAskSide}>
                      <AppText type={TEN} style={[styles.obColH, { color: themeColors.secondaryText }]}>
                        Ask
                      </AppText>
                    </View>
                  </View>
                  {lastSocketData || buyOrders?.length > 0 || sellOrders?.length > 0 ? (
                    depthRows.map((row, idx) => (
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
                    ))
                  ) : (
                    <OrderBookSkeleton rows={ORDER_BOOK_ROWS} />
                  )}
                </View>
              ) : null}
              {mountedTab === "Market Trades" ? (
                <View style={{ width: Width, paddingHorizontal: 12 }}>
                  <View style={styles.mtContainer}>
                    <View style={styles.mtHeader}>
                      <AppText type={TEN} style={[styles.mtCell, { color: themeColors.secondaryText, textAlign: "left" }]}>
                        Price({pairQuote})
                      </AppText>
                      <AppText type={TEN} style={[styles.mtCell, { color: themeColors.secondaryText, textAlign: "center" }]}>
                        Quantity({pairBase})
                      </AppText>
                      <AppText type={TEN} style={[styles.mtCell, { color: themeColors.secondaryText, textAlign: "right" }]}>
                        Time
                      </AppText>
                    </View>
                    <View>
                      {recentTrades?.length > 0 ? (
                        recentTrades?.slice(0, 50)?.map((item, index) => (
                          <View key={item?._id || index} style={styles.mtRow}>
                            <AppText
                              type={TEN}
                              style={[
                                styles.mtCell,
                                {
                                  color:
                                    item?.side === "BUY"
                                      ? themeColors.green || "#00c076"
                                      : themeColors.red || "#ff3b30",
                                  textAlign: "left",
                                  fontWeight: "600",
                                },
                              ]}
                            >
                              {String(item?.price || 0)}
                            </AppText>
                            <AppText type={TEN} style={[styles.mtCell, { color: themeColors.text || "#000", textAlign: "center" }]}>
                              {String(item?.quantity || 0)}
                            </AppText>
                            <AppText
                              type={TEN}
                              style={[styles.mtCell, { color: themeColors.secondaryText || "#888", textAlign: "right" }]}
                            >
                              {formatRecentTradeTime(item)}
                            </AppText>
                          </View>
                        ))
                      ) : (
                        <View style={styles.noDataContainer}>
                          <AppText type={TEN} style={{ color: themeColors.secondaryText }}>
                            No market trades yet
                          </AppText>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ) : null}
              {mountedTab === "Assets" ? (
                <View style={{ width: Width, paddingHorizontal: 12 }}>
                  <View style={styles.assetsContainer}>
                    {!userData ? (
                      <View style={styles.noDataContainer}>
                        <AppText type={TEN} style={{ color: themeColors.secondaryText, marginBottom: 10 }}>
                          Please login to view your wallets
                        </AppText>
                        <TouchableOpacity style={styles.loginBtn} onPress={() => NavigationService.navigate(routes.LOGIN_SCREEN)}>
                          <AppText type={TEN} weight={SEMI_BOLD} style={{ color: "#fff" }}>
                            Login
                          </AppText>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <View style={styles.assetsHeader}>
                          <View style={styles.assetsHeaderTitleRow}>
                            <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                              Spot Wallets
                            </AppText>
                            <TouchableOpacity onPress={() => dispatch(getUserSpotWallet("spot"))}>
                              <FastImage
                                source={Refresh}
                                style={{ width: 14, height: 14 }}
                                resizeMode="contain"
                                tintColor={themeColors.text}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <View style={styles.assetsActionRow}>
                          <TouchableOpacity
                            style={[styles.assetActionBtn, { backgroundColor: themeColors.green }]}
                            onPress={() => NavigationService.navigate(routes.DEPOSIT_COIN_SCREEN)}
                          >
                            <AppText type={TEN} weight={SEMI_BOLD} style={{ color: "#fff" }}>
                              Deposit
                            </AppText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.assetActionBtn, { backgroundColor: themeColors.red }]}
                            onPress={() => NavigationService.navigate(routes.WITHDRAW_Coin_SCREEN)}
                          >
                            <AppText type={TEN} weight={SEMI_BOLD} style={{ color: "#fff" }}>
                              Withdraw
                            </AppText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.assetActionBtn, { backgroundColor: themeColors.button }]}
                            onPress={() => NavigationService.navigate(routes.TRANSFER_SCREEN)}
                          >
                            <AppText type={TEN} weight={SEMI_BOLD} style={{ color: "#fff" }}>
                              Transfer
                            </AppText>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.assetsListHeader}>
                          <AppText type={TEN} style={[styles.mtCell, { color: themeColors.secondaryText }]}>
                            Asset
                          </AppText>
                          <AppText type={TEN} style={[styles.mtCell, { color: themeColors.secondaryText, textAlign: "right" }]}>
                            Balance
                          </AppText>
                        </View>
                        {filteredWallets.length > 0 ? (
                          filteredWallets.map((wallet, index) => (
                            <View key={wallet?._id || index} style={styles.assetRow}>
                              <View style={styles.assetInfo}>
                                <FastImage
                                  source={{ uri: `${IMAGE_BASE_URL}${wallet?.icon_path}` }}
                                  style={styles.assetIcon}
                                  resizeMode="contain"
                                />
                                <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                                  {wallet?.short_name}
                                </AppText>
                              </View>
                              <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text, textAlign: "right" }}>
                                {parseFloat(Number(wallet?.balance || 0).toFixed(8))}
                              </AppText>
                            </View>
                          ))
                        ) : (
                          <View style={styles.noDataContainer}>
                            <AppText type={TEN} style={{ color: themeColors.secondaryText }}>
                              No assets in spot wallet
                            </AppText>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </View>

      <View
        style={[
          styles.chartBottomBar,
          {
            backgroundColor: colors.white,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        <View style={styles.chartBottomLeftIcons}>
          {[
            { id: "margin", label: "Margin", icon: margin_ic },
            { id: "futures", label: "Futures", icon: future_ic },
            { id: "bots", label: "Bots", icon: bots_ic },
          ].map((it) => (
            <TouchableOpacity
              key={it.id}
              activeOpacity={0.8}
              onPress={() => {}}
              style={styles.chartBottomIconItem}
              accessibilityLabel={it.label}
            >
              <FastImage
                source={it.icon}
                style={styles.chartBottomIcon}
                resizeMode="contain"
                tintColor={themeColors.text}
              />
              <AppText style={[styles.chartBottomIconLabel, { color: themeColors.text }]}>
                {it.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.chartBottomBtnsWrap}>
          <TouchableOpacity
            style={[
              styles.chartBottomBtn,
              { backgroundColor: themeColors.spotTradeBuy ?? themeColors.green },
              { flex: 1.1 },
            ]}
            onPress={() => goToSpotTradeSide("BUY")}
            activeOpacity={0.88}
          >
            <AppText weight={SEMI_BOLD} style={{ color: themePalette.white }}>
              Buy
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.chartBottomBtn,
              { backgroundColor: themeColors.spotTradeSell ?? themeColors.red },
              { flex: 1.1 },
            ]}
            onPress={() => goToSpotTradeSide("SELL")}
            activeOpacity={0.88}
          >
            <AppText weight={SEMI_BOLD} style={{ color: themePalette.white }}>
              Sell
            </AppText>
          </TouchableOpacity>
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
  chartBottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingTop: 12,
  },
  chartBottomLeftIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 10,
  },
  chartBottomIconItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 46,
  },
  chartBottomIcon: {
    width: 22,
    height: 22,
  },
  chartBottomIconLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
  },
  chartBottomBtnsWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chartBottomBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 999,
  },
  scrollMain: {
    flex: 1,
  },
  scrollMainContent: {
    flexGrow: 1,
  },
  chartBottomTabBody: {
    width: Width,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 52 : 18,
    paddingBottom: 10,
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
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: 0,
    paddingRight: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    width: 20,
    height: 20,
  },
  headerPairRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    marginLeft: 2,
    paddingRight: 4,
  },
  headerTitle: {
    fontSize: 14,
    letterSpacing: 0.15,
    flexShrink: 1,
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
    fontSize: 16,
  fontFamily:SEMI_BOLD
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
  chartSkeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  chartWebWrap: {
    width: Width,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  obTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingVertical: 8,
  },
  obTabsLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginRight: 8,
  },
  obAggTrigger: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    flexShrink: 0,
  },
  obAggCaret: {
    width: 10,
    height: 10,
  },
  aggModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  aggMenuPopover: {
    position: "absolute",
    width: 160,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  aggMenuRow: {
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  obTab: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    minWidth: 64,
    borderRadius: 10,
  },
  obTabActive: {
    // backgroundColor overridden inline to match theme
  },
  obRatioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  obRatioPill: {
    flex: 1,
    height: 24,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  obColHeader: {
    flexDirection: "row",
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  obColH: {
    fontWeight: "600",
    

  },
  precisionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",

    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  precisionIcon: {
    width: 7,
    height: 7,
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
  mtContainer: {
    marginTop: 4,
  },
  mtHeader: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.1)",
    marginBottom: 4,
  },
  mtRow: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  mtCell: {
    flex: 1,
  },
  noDataContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  assetsContainer: {
    marginTop: 4,
  },
  assetsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  assetsHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transferBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0,192,118,0.3)",
  },
  assetsActionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  assetActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  assetsListHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.1)",
    marginBottom: 8,
  },
  assetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  assetInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  assetIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  loginBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
});

export default SpotChartScreen;
