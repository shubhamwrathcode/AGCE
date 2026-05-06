import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Dimensions,
  AppState,
  Animated,
  ImageBackground,
  ActivityIndicator,
  Platform,
  UIManager,
  Alert,
  Modal,
  Pressable,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  memo,
} from "react";

import SpotHeader from "../../shared/components/spotHeader/SpotHeader";
import FastImage from "react-native-fast-image";
import {
  candle,
  checkIc,
  checkIcon,
  confirmOrderIcon,
  downIcon,
  folder,
  INFO,
  limitTrade,
  linkIcon,
  market_ic,
  NO_NOTIFICATION_ICON,
  NO_NOTIFICATION_ICON_LIGHT,
  order_1,
  order_2,
  order_3,
  Refresh,
  REMOVE,
  right_ic,
  buyImage,
  selImage,
  spotLimitTrade,
  spotMarket,
  tick,
  trade_btn,
  upDownIc,
  upIcon,
} from "../../helper/ImageAssets";
import { useAppSelector } from "../../store/hooks";
import {
  multiply,
  percentCalculation,
  toFixedEight,
  toFixedFive,
  toFixedSix,
  toFixedThree,
  twoFixedTwo,
  spotOpenOrderMarketLabel,
  tradeHistoryBaseAsset,
} from "../../helper/utility";
import { colors, lightTheme } from "../../theme/colors";
import CustomDropdown from "../../shared/components/CustomDropdown";
import RBSheet from "react-native-raw-bottom-sheet";
import { universalPaddingHorizontal, borderWidth } from "../../theme/dimens";

/** Same vertical space between Buy/Sell column sections (tabs → fields → slider → IOC → assets → CTA → footer). */
const SPOT_ORDER_V_GAP = 8;
import {
  AppText,
  BOLD,
  Button,
  CommonModal,
  Input,
  MEDIUM,
  SEMI_BOLD,
  TEN,
  THIRTEEN,
} from "../../shared";
import PercentQuickSelect from "../../shared/components/PercentQuickSelect";
import ReactNativeModal from "react-native-modal";
import { getPastOrders } from "../../actions/homeActions";
import { getTradeHistory } from "../../actions/walletActions";
import {
  setBuyOrders,
  setCoinData,
  setOpenOrders,
  setPastOrders,
  setRandom, setRecentTrades,
  setSellOrders,
  setSocket,
  setSpotSelectedPair,
} from "../../slices/homeSlice";
import { clearTradeHistory } from "../../slices/walletSlice";
import { setLoading } from "../../slices/authSlice";
import { useFocusEffect, useIsFocused, useRoute, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import LinearGradient from "react-native-linear-gradient";
import {
  ACCOUNT_SCREEN,
  DEPOSIT_COIN_SCREEN,
  DEPOSIT_WALLET_SCREEN,
  KYC_STATUS_SCREEN,
  MARKET_SCREEN,
  OPEN_ORDER_SCREEN,
  SPOT_ORDER_HISTORY_DETAIL,
  SPOT_CHART_SCREEN,
  TRANSFER_SCREEN,
  WALLET_WITHDRAW_SCREEN,
  WITHDRAW_Coin_SCREEN,
} from "../../navigation/routes";
import { cancelOrder, placeOrder } from "../../actions/homeActions";
import { addToFavorites, getFavoriteArray } from "../../actions/homeActions";
import NavigationService from "../../navigation/NavigationService";
import moment from "moment";
import { useTheme } from "../../hooks/useTheme";
import { SocketContext } from "../../SocketProvider";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { showError } from "../../helper/logger";

const { width: Width, height: WindowHeight } = Dimensions.get("window");

export const DataLimit = [
  { id: "0.1", name: "Limit" },
  { id: "0.1", name: "Market" },
  { id: "0.1", name: "Spot Limit" },
  { id: "0.1", name: "Spot Market" },
];

/** Bottom sheet: Basic + Advanced (no separate “Conditional” step — Spot types listed here). */
const ORDER_TYPE_SHEET_BASIC = [
  {
    name: "Limit",
    description: "Buy or sell at your chosen price or better.",
    icon: limitTrade,
  },
  {
    name: "Market",
    description: "Instantly trade at the current market price.",
    icon: market_ic,
  },
];
const ORDER_TYPE_SHEET_ADVANCED = [
  {
    name: "Spot Limit",
    description: "Once the stop price is reached, a limit order is set at your selected price.",
    icon: spotLimitTrade,
  },
  {
    name: "Spot Market",
    description: "Once the stop price is reached, a market order is executed at the best price.",
    icon: spotMarket,
  },
];

/** Open orders filter chips (aligned with web TradeHistorySection / TradePage). */
const SPOT_OPEN_ORDER_KINDS = [
  { id: "all", label: "All" },
  { id: "limit", label: "Limit" },
  { id: "market", label: "Market" },
  { id: "stop_limit", label: "Spot Limit" },
  { id: "stop_market", label: "Spot Market" },
];

/** Web TradeHistorySection side filter: All Sides / Buy / Sell (native select labels). */
const SPOT_SIDE_DROPDOWN_LABELS = ["All Sides", "Buy", "Sell"];

function spotSideFilterFromDropdownLabel(label) {
  if (label === "Buy") return "BUY";
  if (label === "Sell") return "SELL";
  return "All";
}

function spotDropdownLabelFromSideFilter(filterVal) {
  if (filterVal === "BUY") return "Buy";
  if (filterVal === "SELL") return "Sell";
  return "All Sides";
}

function matchesOpenOrderKind(item, kind) {
  if (kind === "all") return true;
  const t = String(item?.type || item?.order_type || "").toUpperCase();
  if (kind === "limit") return t === "LIMIT";
  if (kind === "market") return t === "MARKET";
  if (kind === "stop_limit") return t === "STOP_LIMIT";
  if (kind === "stop_market") return t === "STOP_MARKET";
  return true;
}

function tradeHistoryMarketLabel(item, selectedBase, selectedQuote) {
  return spotOpenOrderMarketLabel(item, selectedBase, selectedQuote);
}

function tradeHistoryQuoteAsset(item, selectedBase, selectedQuote) {
  const parts = spotOpenOrderMarketLabel(item, selectedBase, selectedQuote).split("/");
  return parts.length === 2 ? parts[1] : "";
}

/**
 * Redux `pastOrders` may include orders from other pairs (e.g. History screen without pair filter).
 * Spot Order History tab must only render rows for the selected spot pair — avoids wrong list flash.
 */
function spotPastOrderMatchesScreenPair(order, baseSym, quoteSym) {
  if (!order || baseSym == null || quoteSym == null) return false;
  const b = String(baseSym).trim().toUpperCase();
  const q = String(quoteSym).trim().toUpperCase();
  if (!b || !q) return false;

  const ask = String(order?.ask_currency ?? "").trim().toUpperCase();
  const pay = String(order?.pay_currency ?? "").trim().toUpperCase();
  const ob = String(order?.base_currency ?? "").trim().toUpperCase();
  const oq = String(order?.quote_currency ?? "").trim().toUpperCase();
  if ((ask && pay && ask === b && pay === q) || (ob && oq && ob === b && oq === q)) return true;

  const raw = String(order?.pair ?? order?.symbol ?? order?.market ?? "")
    .trim()
    .toUpperCase()
    .replace(/\//g, "");
  const needle = `${b}${q}`;
  if (!raw) return false;
  if (raw === needle) return true;
  if (raw.endsWith(q)) {
    const prefix = raw.slice(0, raw.length - q.length);
    if (prefix === b) return true;
  }
  return false;
}

export const Data = [
  { label: "0.1", value: "0.1" },
  { label: "0.01", value: "0.01" },
  { label: "0.001", value: "0.001" },
  { label: "0.0001", value: "0.0001" },
  { label: "0.00001", value: "0.00001" },
  { label: "0.000001", value: "0.000001" },
];

// Compare order book rows by price and remaining to avoid re-renders when data unchanged
const orderBookDataEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (String(x?.price) !== String(y?.price) || String(x?.remaining) !== String(y?.remaining)) return false;
  }
  return true;
};

const toFiniteOB = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const clamp01OB = (v) => Math.max(0, Math.min(1, v));

const SPOT_ORDER_BOOK_AGG_DEFAULTS = [0.1, 0.5, 1, 10, 100];

function getSpotOrderBookAggOptionsForPair(tickSize) {
  const tick = Number(tickSize);
  if (!Number.isFinite(tick) || tick <= 0) {
    return SPOT_ORDER_BOOK_AGG_DEFAULTS.slice();
  }
  const mults = [1, 10, 100, 1000, 10000];
  const out = [];
  for (const m of mults) {
    const v = tick * m;
    if (!Number.isFinite(v) || v <= 0) continue;
    out.push(parseFloat(Number(v).toPrecision(12)));
  }
  const unique = Array.from(new Set(out)).sort((a, b) => a - b);
  return unique.length ? unique : SPOT_ORDER_BOOK_AGG_DEFAULTS.slice();
}

function roundSpotPriceToAgg(price, agg) {
  const n = Number(price);
  const a = Number(agg);
  if (!Number.isFinite(n) || !Number.isFinite(a) || a <= 0) return n;
  return Math.round(n / a) * a;
}

const safeToFixed8 = (value, fallback = "0") => {
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  const s = parsed.toFixed(8).replace(/\.?0+$/, "");
  return s === "" ? "0" : s;
};

function aggregateSpotOrderBookRows(orders, agg) {
  if (!orders?.length) return [];
  const map = new Map();
  for (const o of orders) {
    const bucket = roundSpotPriceToAgg(o.price, agg);
    const prev = map.get(bucket);
    if (prev) {
      prev.quantity = (Number(prev.quantity) || 0) + (Number(o.quantity) || 0);
      prev.remaining = (Number(prev.remaining) || 0) + (Number(o.remaining) || 0);
    } else {
      map.set(bucket, { ...o, price: bucket });
    }
  }
  return Array.from(map.values());
}

/** Numeric step only (no quote suffix in UI). */
function formatSpotAggStepLabel(step) {
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

const SPOT_OB_VIEW_ICONS = [order_1, order_2, order_3];

const orderBookSellRowAreEqual = (prev, next) =>
  prev.theme === next.theme &&
  prev.maxVolume === next.maxVolume &&
  String(prev.item?.price) === String(next.item?.price) &&
  String(prev.item?.remaining) === String(next.item?.remaining);

const OrderBookSellRow = memo(({ item, maxVolume, onPress, formatPrice, formatQuantity, styles }) => {
  const { colors: themeColors, isDark } = useTheme();
  const remaining = toFiniteOB(item?.remaining);
  const denom = maxVolume > 0 ? maxVolume : 1;
  const ratio = clamp01OB(remaining / denom);
  const handlePress = useCallback(() => { onPress(item?.price, item?.remaining); }, [onPress, item?.price, item?.remaining]);

  // Depth bar color (web-like). Use low opacity so text stays readable.
  // Slightly stronger than web so it's visible on mobile screens.
  const depthRed = isDark ? "rgba(232, 97, 97, 0.32)" : "rgba(255, 77, 79, 0.22)";

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={[styles.orderRow, { position: "relative", overflow: "hidden" }]}>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: `${ratio > 0 ? Math.max(2, ratio * 100) : 0}%`,
            backgroundColor: depthRed,
          }}
        />
        <AppText style={[styles.orderPrice, { color: themeColors.red }]}>{formatPrice(item?.price)}</AppText>
        <AppText style={[styles.orderSize, { color: themeColors.text }]}>{formatQuantity(item?.remaining)}</AppText>
      </View>
    </TouchableOpacity>
  );
}, orderBookSellRowAreEqual);
OrderBookSellRow.displayName = "OrderBookSellRow";

const orderBookBuyRowAreEqual = (prev, next) =>
  prev.theme === next.theme &&
  prev.maxVolume === next.maxVolume &&
  String(prev.item?.price) === String(next.item?.price) &&
  String(prev.item?.remaining) === String(next.item?.remaining);

const OrderBookBuyRow = memo(({ item, maxVolume, onPress, formatPrice, formatQuantity, styles }) => {
  const { colors: themeColors, isDark } = useTheme();
  const remaining = toFiniteOB(item?.remaining);
  const denom = maxVolume > 0 ? maxVolume : 1;
  const ratio = clamp01OB(remaining / denom);
  const handlePress = useCallback(() => { onPress(item?.price, item?.remaining); }, [onPress, item?.price, item?.remaining]);

  const depthGreen = isDark ? "rgba(0, 192, 118, 0.28)" : "rgba(0, 192, 118, 0.18)";

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={[styles.orderRow, { position: "relative", overflow: "hidden" }]}>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: `${ratio > 0 ? Math.max(2, ratio * 100) : 0}%`,
            backgroundColor: depthGreen,
          }}
        />
        <AppText style={[styles.orderPrice, { color: themeColors.green }]}>{formatPrice(item?.price)}</AppText>
        <AppText style={[styles.orderSize, { color: themeColors.text }]}>{formatQuantity(item?.remaining)}</AppText>
      </View>
    </TouchableOpacity>
  );
}, orderBookBuyRowAreEqual);
OrderBookBuyRow.displayName = "OrderBookBuyRow";

const orderBookPanelAreEqual = (prev, next) =>
  prev.theme === next.theme &&
  prev.buy_price === next.buy_price &&
  prev.change_percentage === next.change_percentage &&
  prev.quote_currency === next.quote_currency &&
  prev.base_currency === next.base_currency &&
  prev.orderBookReady === next.orderBookReady &&
  prev.showOrderBookSkeleton === next.showOrderBookSkeleton &&
  prev.showAskSide === next.showAskSide &&
  prev.showBidSide === next.showBidSide &&
  orderBookDataEqual(prev.sellData, next.sellData) &&
  orderBookDataEqual(prev.buyData, next.buyData);

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
  /** Match Spot order inputs (`theme.input`) so skeleton reads as the same surface; shimmer sits on top. */
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
        toValue: shimmerToValue !== undefined ? shimmerToValue : (Width + stripW),
        duration: shimmerDuration,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) run();
      });
    };
    run();
    return () => shimmerX.stopAnimation();
  }, [shimmerX, stripW, isDark]);
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

/** ~7 visible rows per list; user scrolls for more. */
const ORDER_BOOK_VISIBLE_ROWS = 7;
const ORDER_BOOK_ROW_LAYOUT_HEIGHT = 24;
const ORDER_BOOK_LIST_MAX_HEIGHT =
  ORDER_BOOK_VISIBLE_ROWS * ORDER_BOOK_ROW_LAYOUT_HEIGHT - 5;
/** Use fixed height (not maxHeight) so switching view modes never collapses the panel. */
const ORDER_BOOK_LIST_STYLE = { height: ORDER_BOOK_LIST_MAX_HEIGHT, flexGrow: 0 };
/** Tail inset after last row; inverted asks use paddingTop for the scroll end. */
const ORDER_BOOK_LIST_END_PAD = 10;
const ORDER_BOOK_HEADER_ROW_STYLE = { flexDirection: "row", justifyContent: "space-between" };
const ORDER_BOOK_HEADER_LABEL_STYLE = { color: "#9D9D9D" };
/** Keep order book area stable when toggling view (both/bids/asks). */
const ORDER_BOOK_PANEL_FIXED_HEIGHT = ORDER_BOOK_LIST_MAX_HEIGHT * 2 + 92;
const ORDER_BOOK_SHIMMER_STRIP_WIDTH = 240;

const OrderBookSkeleton = () => {
  const { colors: themeColors, isDark } = useTheme();
  const ROWS = ORDER_BOOK_VISIBLE_ROWS;
  const ROW_HEIGHT = 22;
  const BONE_HEIGHT = 15;
  const BONE_RADIUS = 6;
  return (
    <View style={{ flex: 1, paddingVertical: 6, paddingHorizontal: 8, gap: 2 }}>
      {[...Array(ROWS)].map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            height: ROW_HEIGHT,
            paddingHorizontal: 4,
          }}
        >
          <ShimmerBox width="52%" height={BONE_HEIGHT} borderRadius={BONE_RADIUS} />
          <ShimmerBox width="52%" height={BONE_HEIGHT} borderRadius={BONE_RADIUS} style={{ marginLeft: 3 }} />
        </View>
      ))}
    </View>
  );
};

const OrderBookPanel = memo(({
  sellData,
  buyData,
  buy_price,
  change_percentage,
  quote_currency,
  base_currency,
  orderBookReady,
  showOrderBookSkeleton,
  showAskSide = true,
  showBidSide = true,
  styles,
  renderSellOrderItem,
  renderBuyOrderItem,
  sellKeyExtractor,
  buyKeyExtractor,
  getOrderItemLayout,
}) => {
  const { colors: themeColors, theme, isDark } = useTheme();
  const isSingleSide = !(showAskSide && showBidSide);
  const singleSideListStyle = useMemo(
    () => ({ height: ORDER_BOOK_LIST_MAX_HEIGHT * 2 + 10, flexGrow: 0 }),
    []
  );
  const sellListStyle = isSingleSide ? singleSideListStyle : ORDER_BOOK_LIST_STYLE;
  const buyListStyle = isSingleSide ? singleSideListStyle : ORDER_BOOK_LIST_STYLE;
  const listEmptySell = useMemo(
    () => (
      <View style={styles.emptyOrderBook}>
        {showOrderBookSkeleton ? (
          <OrderBookSkeleton />
        ) : (
          <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText }}>No ask data</AppText>
        )}
      </View>
    ),
    [showOrderBookSkeleton, themeColors.secondaryText, styles.emptyOrderBook, theme]
  );
  const listEmptyBuy = useMemo(
    () => (
      <View style={styles.emptyOrderBook}>
        {showOrderBookSkeleton ? (
          <OrderBookSkeleton />
        ) : (
          <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText }}>No bid data</AppText>
        )}
      </View>
    ),
    [showOrderBookSkeleton, themeColors.secondaryText, styles.emptyOrderBook, theme, isDark]
  );
  const currentPriceColor = change_percentage < 0 ? themeColors.red : themeColors.green;
  const renderCurrentPrice = () => (
    <View style={styles.currentPriceBox}>
      {showOrderBookSkeleton ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <ShimmerBox width="52%" height={20} borderRadius={4} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} />
          <ShimmerBox width="50%" height={16} borderRadius={4} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} style={{ marginLeft: 3 }} />
        </View>
      ) : (
        <>
          <AppText style={[styles.currentPrice, { color: currentPriceColor }]}>{buy_price}</AppText>
          <AppText style={[styles.currentPriceUSD, { color: currentPriceColor }]}>
            {change_percentage}
          </AppText>
        </>
      )}
    </View>
  );
  return (
    <View style={{ height: ORDER_BOOK_PANEL_FIXED_HEIGHT, flexGrow: 0 }}>
      <View style={ORDER_BOOK_HEADER_ROW_STYLE}>
        <View>
          <AppText style={ORDER_BOOK_HEADER_LABEL_STYLE}>Price</AppText>
          <AppText style={ORDER_BOOK_HEADER_LABEL_STYLE}>({quote_currency})</AppText>
        </View>
        <View>
          <AppText style={ORDER_BOOK_HEADER_LABEL_STYLE}>Quantity</AppText>
          <AppText style={ORDER_BOOK_HEADER_LABEL_STYLE}>({base_currency})</AppText>
        </View>
      </View>
      {/* Binance-like behavior: in single-side mode the visible list consumes full height. */}
      {showAskSide && showBidSide ? (
        <>
          <FlatList
            data={sellData}
            keyExtractor={sellKeyExtractor}
            renderItem={renderSellOrderItem}
            getItemLayout={getOrderItemLayout}
            removeClippedSubviews={true}
            initialNumToRender={ORDER_BOOK_VISIBLE_ROWS + 2}
            maxToRenderPerBatch={ORDER_BOOK_VISIBLE_ROWS + 2}
            windowSize={5}
            updateCellsBatchingPeriod={100}
            inverted={true}
            style={sellListStyle}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              sellData?.length === 0
                ? styles.orderBookEmptyList
                : styles.orderBookListContentAsks
            }
            ListEmptyComponent={listEmptySell}
          />
          {renderCurrentPrice()}
          <FlatList
            data={buyData}
            keyExtractor={buyKeyExtractor}
            renderItem={renderBuyOrderItem}
            inverted={false}
            getItemLayout={getOrderItemLayout}
            removeClippedSubviews={true}
            initialNumToRender={ORDER_BOOK_VISIBLE_ROWS + 2}
            maxToRenderPerBatch={ORDER_BOOK_VISIBLE_ROWS + 2}
            windowSize={5}
            updateCellsBatchingPeriod={100}
            style={buyListStyle}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              buyData?.length === 0
                ? styles.orderBookEmptyList
                : styles.orderBookListContentBids
            }
            ListEmptyComponent={listEmptyBuy}
          />
        </>
      ) : showBidSide ? (
        <>
          {renderCurrentPrice()}
          <FlatList
            data={buyData}
            keyExtractor={buyKeyExtractor}
            renderItem={renderBuyOrderItem}
            inverted={false}
            getItemLayout={getOrderItemLayout}
            removeClippedSubviews={true}
            initialNumToRender={ORDER_BOOK_VISIBLE_ROWS + 4}
            maxToRenderPerBatch={ORDER_BOOK_VISIBLE_ROWS + 4}
            windowSize={7}
            updateCellsBatchingPeriod={80}
            style={buyListStyle}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              buyData?.length === 0
                ? styles.orderBookEmptyList
                : styles.orderBookListContentBids
            }
            ListEmptyComponent={listEmptyBuy}
          />
        </>
      ) : (
        <>
          <FlatList
            data={sellData}
            keyExtractor={sellKeyExtractor}
            renderItem={renderSellOrderItem}
            getItemLayout={getOrderItemLayout}
            removeClippedSubviews={true}
            initialNumToRender={ORDER_BOOK_VISIBLE_ROWS + 4}
            maxToRenderPerBatch={ORDER_BOOK_VISIBLE_ROWS + 4}
            windowSize={7}
            updateCellsBatchingPeriod={80}
            inverted={true}
            style={sellListStyle}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              sellData?.length === 0
                ? styles.orderBookEmptyList
                : styles.orderBookListContentAsks
            }
            ListEmptyComponent={listEmptySell}
          />
          {renderCurrentPrice()}
        </>
      )}
    </View>
  );
}, orderBookPanelAreEqual);
OrderBookPanel.displayName = "OrderBookPanel";

const OrderBookSection = memo(({
  styles: sty,
  buy_price,
  change_percentage,
  quote_currency,
  base_currency,
  orderBookReady,
  showOrderBookSkeleton,
  onOrderBookPress,
  formatPrice,
  formatQuantity,
  tickSize,
  pairResetKey,
}) => {
  const { theme, colors: themeColors, isDark } = useTheme();
  const buyOrders = useAppSelector((state) => state.home.buyOrders);
  const sellOrders = useAppSelector((state) => state.home.sellOrders);

  const orderBookAggOptions = useMemo(() => getSpotOrderBookAggOptionsForPair(tickSize), [tickSize]);
  const [orderBookAggStep, setOrderBookAggStep] = useState(SPOT_ORDER_BOOK_AGG_DEFAULTS[0]);
  const [orderBookAggOpen, setOrderBookAggOpen] = useState(false);
  const [aggMenuLayout, setAggMenuLayout] = useState(null);
  const aggTriggerRef = useRef(null);
  const [viewModeIndex, setViewModeIndex] = useState(0);
  const orderBookViewMode = viewModeIndex === 0 ? "both" : viewModeIndex === 1 ? "bids" : "asks";

  useEffect(() => {
    if (!orderBookAggOptions.length) return;
    setOrderBookAggStep(orderBookAggOptions[0]);
  }, [orderBookAggOptions, pairResetKey]);

  const openAggMenu = useCallback(() => {
    requestAnimationFrame(() => {
      aggTriggerRef.current?.measureInWindow((x, y, w, h) => {
        setAggMenuLayout({ x, y, w, h });
        setOrderBookAggOpen(true);
      });
    });
  }, []);

  const closeAggMenu = useCallback(() => {
    setOrderBookAggOpen(false);
    setAggMenuLayout(null);
  }, []);

  const selectAggStep = useCallback(
    (opt) => {
      setOrderBookAggStep(opt);
      closeAggMenu();
    },
    [closeAggMenu]
  );

  const cycleViewMode = useCallback(() => {
    setViewModeIndex((i) => (i + 1) % 3);
  }, []);

  const asksAggregated = useMemo(() => {
    if (!sellOrders?.length) return [];
    const agg = aggregateSpotOrderBookRows(sellOrders, orderBookAggStep);
    return [...agg].sort((a, b) => toFiniteOB(a.price) - toFiniteOB(b.price));
  }, [sellOrders, orderBookAggStep]);

  const bidsAggregated = useMemo(() => {
    if (!buyOrders?.length) return [];
    const agg = aggregateSpotOrderBookRows(buyOrders, orderBookAggStep);
    return [...agg].sort((a, b) => toFiniteOB(b.price) - toFiniteOB(a.price));
  }, [buyOrders, orderBookAggStep]);

  const showAskSide = orderBookViewMode !== "bids";
  const showBidSide = orderBookViewMode !== "asks";

  const sellOrdersForDisplay = useMemo(
    () => (showOrderBookSkeleton ? [] : (orderBookReady && showAskSide ? asksAggregated : [])),
    [showOrderBookSkeleton, orderBookReady, showAskSide, asksAggregated]
  );
  const buyOrdersForDisplay = useMemo(
    () => (showOrderBookSkeleton ? [] : (orderBookReady && showBidSide ? bidsAggregated : [])),
    [showOrderBookSkeleton, orderBookReady, showBidSide, bidsAggregated]
  );

  const maxBuyVolume = useMemo(
    () => {
      // Match web/mobile perception: scale depth by *visible* rows, so one huge order deep in book
      // doesn't make all shown bars look tiny.
      const vis = bidsAggregated.slice(0, ORDER_BOOK_VISIBLE_ROWS);
      // Do not force >= 1 (many pairs have < 1 quantities). Denom fallback handled in row component.
      return Math.max(0, ...vis.map((o) => toFiniteOB(o?.remaining)).filter(Number.isFinite));
    },
    [bidsAggregated]
  );
  const maxSellVolume = useMemo(
    () => {
      const vis = asksAggregated.slice(0, ORDER_BOOK_VISIBLE_ROWS);
      return Math.max(0, ...vis.map((o) => toFiniteOB(o?.remaining)).filter(Number.isFinite));
    },
    [asksAggregated]
  );

  /** Binance-like OB ratio bar uses visible rows volume sum. */
  const obRatio = useMemo(() => {
    const takeN = ORDER_BOOK_VISIBLE_ROWS;
    const bidSum = bidsAggregated.slice(0, takeN).reduce((s, o) => s + (toFiniteOB(o?.remaining) || 0), 0);
    const askSum = asksAggregated.slice(0, takeN).reduce((s, o) => s + (toFiniteOB(o?.remaining) || 0), 0);
    const total = bidSum + askSum;
    if (!total || !Number.isFinite(total)) return { bidPct: 50, askPct: 50 };
    const bidPct = Math.round((bidSum / total) * 100);
    return { bidPct, askPct: 100 - bidPct };
  }, [bidsAggregated, asksAggregated]);

  const renderSellOrderItem = useCallback(
    ({ item }) => (
      <OrderBookSellRow
        item={item}
        maxVolume={maxSellVolume}
        theme={theme}
        onPress={onOrderBookPress}
        formatPrice={formatPrice}
        formatQuantity={formatQuantity}
        styles={sty}
      />
    ),
    [maxSellVolume, theme, onOrderBookPress, formatPrice, formatQuantity, sty]
  );
  const renderBuyOrderItem = useCallback(
    ({ item }) => (
      <OrderBookBuyRow
        item={item}
        maxVolume={maxBuyVolume}
        theme={theme}
        onPress={onOrderBookPress}
        formatPrice={formatPrice}
        formatQuantity={formatQuantity}
        styles={sty}
      />
    ),
    [maxBuyVolume, theme, onOrderBookPress, formatPrice, formatQuantity, sty]
  );

  const sellKeyExtractor = useCallback((item) => {
    const p = item?.price != null ? String(Number(item.price)) : "";
    return `sell_${p}`;
  }, []);
  const buyKeyExtractor = useCallback((item) => {
    const p = item?.price != null ? String(Number(item.price)) : "";
    return `buy_${p}`;
  }, []);
  const getOrderItemLayout = useCallback((_, index) => ({
    length: ORDER_BOOK_ROW_LAYOUT_HEIGHT,
    offset: ORDER_BOOK_ROW_LAYOUT_HEIGHT * index,
    index,
  }), []);

  return (
    <View style={sty.rightPanel}>
      <OrderBookPanel
        sellData={sellOrdersForDisplay}
        buyData={buyOrdersForDisplay}
        buy_price={buy_price}
        change_percentage={change_percentage}
        quote_currency={quote_currency}
        base_currency={base_currency}
        orderBookReady={orderBookReady}
        showOrderBookSkeleton={showOrderBookSkeleton}
        showAskSide={showAskSide}
        showBidSide={showBidSide}
        styles={sty}
        renderSellOrderItem={renderSellOrderItem}
        renderBuyOrderItem={renderBuyOrderItem}
        sellKeyExtractor={sellKeyExtractor}
        buyKeyExtractor={buyKeyExtractor}
        getOrderItemLayout={getOrderItemLayout}
      />

      <View style={[sty.spotObRatioRow, { bottom: 10 }]}>
        <ImageBackground
          source={buyImage}
          resizeMode="stretch"
          style={sty.spotObRatioPill}
          imageStyle={{}}
        >
          <AppText style={{ fontSize: 11, fontWeight: "600", color: themeColors.green }}>
            {obRatio.bidPct}%
          </AppText>
        </ImageBackground>
        <ImageBackground
          source={selImage}
          resizeMode="stretch"
          style={sty.spotObRatioPill}
          imageStyle={{}}
        >
          <AppText style={{ fontSize: 11, fontWeight: "600", color: themeColors.red }}>
            {obRatio.askPct}%
          </AppText>
        </ImageBackground>
      </View>

      <View style={sty.spotObToolbarRow}>
        <TouchableOpacity
          ref={aggTriggerRef}
          activeOpacity={0.75}
          onPress={openAggMenu}
          style={[
            sty.spotObAggTrigger,
            {
              backgroundColor: themeColors.input,
              borderColor: themeColors.themeBorderColor,
              borderRadius: 5
            },
          ]}
        >
          <AppText
            type={TEN}
            weight={SEMI_BOLD}
            style={{ color: themeColors.text, fontSize: 11, lineHeight: 14 }}
          >
            {formatSpotAggStepLabel(orderBookAggStep)}
          </AppText>
          <FastImage source={downIcon} style={sty.spotObAggCaret} resizeMode="contain" tintColor={themeColors.secondaryText} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={cycleViewMode}
          activeOpacity={0.75}
          style={[
            sty.spotObViewCycleBtn,
            {
              backgroundColor: themeColors.input,
              borderColor: themeColors.themeBorderColor,
            },
          ]}
          accessibilityLabel="Order book layout"
        >
          <FastImage source={SPOT_OB_VIEW_ICONS[viewModeIndex]} style={sty.spotObViewCycleIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <Modal visible={orderBookAggOpen} transparent animationType="fade" onRequestClose={closeAggMenu}>
        <Pressable style={sty.spotObAggBackdrop} onPress={closeAggMenu} />
        {aggMenuLayout ? (
          <View
            style={[
              sty.spotObAggPopover,
              {
                top: aggMenuLayout.y + aggMenuLayout.h + 4,
                left: Math.max(8, Math.min(aggMenuLayout.x + aggMenuLayout.w - 144, Width - 8 - 144)),
                backgroundColor: themeColors.card,
                borderColor: themeColors.themeBorderColor,
              },
            ]}
          >
            {orderBookAggOptions.map((opt) => {
              const selected = Number(orderBookAggStep) === Number(opt);
              return (
                <TouchableOpacity
                  key={String(opt)}
                  style={[
                    sty.spotObAggRow,
                    selected && { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => selectAggStep(opt)}
                >
                  <AppText
                    type={TEN}
                    weight={selected ? SEMI_BOLD : undefined}
                    style={{ color: themeColors.text, fontSize: 11, lineHeight: 14 }}
                  >
                    {formatSpotAggStepLabel(opt)}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </Modal>
    </View>
  );
});
OrderBookSection.displayName = "OrderBookSection";

/**
 * - Pair: persisted in Redux (spotSelectedPair).
 * - Order book: always in Redux (buyOrders/sellOrders). Socket flush updates Redux; never cleared on tab blur so return shows cached data instantly (no reload/skeleton).
 * - Chart: opened from header candle on SpotChartScreen (no WebView on this screen).
 * - Skeletons: order book only when no data (!orderBookReady).
 * - Focus: subscribe to exchange on focus; on blur unsubscribe but keep Redux cache. No getSpotOpenOrders on focus unless added elsewhere.
 */
const Spot = () => {
  const { colors: themeColors, theme, isDark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { subscribeToExchange, unsubscribeFromExchange, unsubscribeFromMarket, unsubscribeFromFutures } = useContext(SocketContext);
  const dispatch = useDispatch();

  const coinData = useAppSelector((state) => state.home.coinData);
  const spotSelectedPair = useAppSelector((state) => state.home.spotSelectedPair);
  const coinBalance = useAppSelector((state) => state.home.coinBalance);
  const userData = useAppSelector((state) => state.auth.userData);
  const socket = useAppSelector((state) => state.home.socket);
  const openOrders = useAppSelector((state) => state.home.spotOpenOrders);
  const pastOrders = useAppSelector((state) => state.home.pastOrders);
  // Keep terminal readable: avoid logging whole arrays continuously
  // (use the rate-limited lens logs inside the socket handler instead)

  const buyOrders = useAppSelector((state) => state.home.buyOrders);
  const sellOrders = useAppSelector((state) => state.home.sellOrders);
  const favoriteArray = useAppSelector((state) => state.home.favoriteArray);
  const favoriteArrayLoaded = useAppSelector((state) => state.home.favoriteArrayLoaded);

  const [currency, setCurrency] = useState(null);
  const [currencyData, setCurrencyData] = useState(null);
  const [LocalBuyOrders, setLocalBuyOrders] = useState([]);
  const [LocalSellOrders, setLocalSellOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState("All");
  const [pastOrderFilter, setPastOrderFilter] = useState("All");
  const [expandedRowIndex, setExpandedRowIndex] = useState(null);
  const [showExecutedTrades, setShowExecutedTrades] = useState({});
  const [lastSocketData, setLastSocketData] = useState(null);
  /** Web parity: flip true once socket sends `buy_order`/`sell_order` key (empty array still counts). */
  const [orderBookSocketReady, setOrderBookSocketReady] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const isSpotFocused = useIsFocused();
  const recentTrades = useAppSelector((state) => state.home.recentTrades);
  
  const [isPriceFocused, setIsPriceFocused] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isStopFocused, setIsStopFocused] = useState(false);

  const priceAnim = useRef(new Animated.Value(0)).current;
  const amountAnim = useRef(new Animated.Value(0)).current;
  const stopAnim = useRef(new Animated.Value(0)).current;
  const amountInputRef = useRef(null);

  /** Must run before setAmount so next render’s Animated styles already see 1 (fixes +/− without focus overlap). */
  const syncAmountAnimForQuantityString = useCallback((qtyStr) => {
    if (String(qtyStr ?? "").trim() !== "") {
      amountAnim.setValue(1);
    }
  }, []);

  const syncStopAnimForPriceString = useCallback((priceStr) => {
    if (String(priceStr ?? "").trim() !== "") {
      stopAnim.setValue(1);
    }
  }, []);

  useEffect(() => {
    const priceFilled = String(price ?? "").trim() !== "";
    const buyFilled = buy_price != null && String(buy_price).trim() !== "";
    Animated.timing(priceAnim, {
      toValue: isPriceFocused || priceFilled || buyFilled ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isPriceFocused, price, buy_price]);

  useLayoutEffect(() => {
    const hasAmt = String(amount ?? "").trim() !== "";
    if (hasAmt) {
      amountAnim.setValue(1);
      return;
    }
    if (isAmountFocused) {
      Animated.timing(amountAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      return;
    }
    Animated.timing(amountAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [amount, isAmountFocused]);

  useLayoutEffect(() => {
    const hasStop = String(stopPrice ?? "").trim() !== "";
    if (hasStop) {
      stopAnim.setValue(1);
      return;
    }
    if (isStopFocused) {
      Animated.timing(stopAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      return;
    }
    Animated.timing(stopAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [stopPrice, isStopFocused]);

  // DEV helper: render only History tabs + lists (skip heavy orderbook/form)
  const historyOnly = __DEV__ && route?.params?.historyOnly === true;

  const rbSheetNumber = useRef();
  const rbSheetlimit = useRef();
  const appStateRef = useRef(AppState.currentState);
  const latestSocketDataRef = useRef(null);
  const latestLocalBuyOrdersRef = useRef([]);
  const latestLocalSellOrdersRef = useRef([]);
  const currentCurrencyRef = useRef(null);
  const SOCKET_UI_THROTTLE_MS = 500;
  /** Match web `TradePage`: poll spot history while the matching tab is visible (`SPOT_HIST_POLL_MS`). */
  const SPOT_HIST_POLL_MS = 3000;
  const socketThrottleTimerRef = useRef(null);
  const socketLastFlushRef = useRef(0);
  const pendingSocketFlushRef = useRef(null);
  const isSpotFocusedRef = useRef(true);
  const lastSubscribedExchangeRef = useRef(null);
  const lastSubscribedPairRef = useRef(null);
  const lastFlushedBuyRef = useRef(null);
  const lastFlushedSellRef = useRef(null);
  const pendingOrderBookOnBlurRef = useRef(null);
  const flushSocketToStateRef = useRef(null);
  const activeTabRef = useRef(1);

  // Get decimal places from step_size or tick_size
  const getDecimalPlaces = (value) => {
    if (!value || value >= 1) return 0;
    const str = value.toString();
    if (str.includes("e-")) return parseInt(str.split("e-")[1], 10);
    const decimalPart = str.split(".")[1];
    return decimalPart ? decimalPart.length : 0;
  };

  const getPricePrecision = () => {
    const tickSize = currencyData?.tick_size;
    if (tickSize === undefined || tickSize === null) return 8;
    return getDecimalPlaces(tickSize);
  };

  const getQuantityPrecision = () => {
    const stepSize = currencyData?.step_size;
    if (stepSize === undefined || stepSize === null) return 8;
    return getDecimalPlaces(stepSize);
  };

  const pricePrecision = useMemo(() => getPricePrecision(), [currencyData?.tick_size]);
  const quantityPrecision = useMemo(() => getQuantityPrecision(), [currencyData?.step_size]);

  const formatPrice = useCallback(
    (price) => {
      if (price === undefined || price === null || isNaN(price)) return "0";
      return parseFloat(Number(price).toFixed(pricePrecision));
    },
    [pricePrecision]
  );

  const formatQuantity = useCallback(
    (qty) => {
      if (qty === undefined || qty === null || isNaN(qty)) return "0";
      return parseFloat(Number(qty).toFixed(quantityPrecision));
    },
    [quantityPrecision]
  );

  // effectiveCurrency: Redux first, then local, then route param, then coinData[0]
  const effectiveCurrency = spotSelectedPair ?? currency ?? route?.params?.coinDetail ?? coinData?.[0];

  // Scenario 1: Default to coinData[0] when nothing selected
  useEffect(() => {
    if (!spotSelectedPair && !route?.params?.coinDetail && coinData?.[0]) {
      dispatch(setSpotSelectedPair(coinData[0]));
    }
  }, [coinData, spotSelectedPair, route?.params?.coinDetail, dispatch]);

  // Scenario 2: Nav from Home with coinDetail
  useEffect(() => {
    const navCoin = route?.params?.coinDetail;
    if (navCoin) {
      const key = `${navCoin.base_currency}_${navCoin.quote_currency}`;
      const currentKey = spotSelectedPair ? `${spotSelectedPair.base_currency}_${spotSelectedPair.quote_currency}` : null;
      if (key !== currentKey) dispatch(setSpotSelectedPair(navCoin));
      navigation.setParams({ coinDetail: undefined });
    }
  }, [route?.params?.coinDetail, dispatch, navigation, spotSelectedPair]);

  /** SpotChartScreen bottom Buy/Sell → navigate here with `spotTradeSide` */
  useEffect(() => {
    const raw = route?.params?.spotTradeSide;
    if (raw == null || raw === "") return;
    const u = String(raw).toUpperCase();
    if (u === "BUY") {
      setTab("Buy");
      setIsBuy(true);
    } else if (u === "SELL") {
      setTab("Sell");
      setIsBuy(false);
    }
    navigation.setParams({ spotTradeSide: undefined });
  }, [route?.params?.spotTradeSide, navigation]);

  // Removed automatic restoration from Redux cache to ensure only fresh socket data is shown.
  // This satisfies the requirement: "if data comes from backend, show; otherwise don't".


  // When spotSelectedPair changes: sync local form + clear order book until new pair socket data arrives.
  useEffect(() => {
    if (!spotSelectedPair) return;

    if (currentCurrencyRef.current?.base_currency !== spotSelectedPair.base_currency ||
      currentCurrencyRef.current?.quote_currency !== spotSelectedPair.quote_currency) {
      setCurrency(spotSelectedPair);
      currentCurrencyRef.current = spotSelectedPair;
      setPrice(formatPrice(spotSelectedPair.buy_price).toString());
      setActivePercentage("");
      setLastSocketData(null);
      setLocalBuyOrders([]);
      setLocalSellOrders([]);
      dispatch(setBuyOrders([]));
      dispatch(setSellOrders([]));
      dispatch(setRecentTrades([]));
      dispatch(setPastOrders([]));
      dispatch(clearTradeHistory());
      setSpotMyTrades([]);
      setOrderBookSocketReady(false);
      setStopPrice("");
      setTradeHistorySideFilter("All");
    }
  }, [spotSelectedPair?.base_currency, spotSelectedPair?.quote_currency, dispatch, formatPrice]);

  // Manual change (TradingDataModal): dispatch to Redux - sync effect will handle rest
  // Clear order book so we don't show previous pair's data; new data will replace when socket responds
  const handleCurrencyChange = (coin) => {
    dispatch(setSpotSelectedPair(coin));
    setLastSocketData(null);
    setLocalBuyOrders([]);
    setLocalSellOrders([]);
    dispatch(setBuyOrders([]));
    dispatch(setSellOrders([]));
    setOpenOrderKindTab("all");
    setOrderFilter("All");
  };

  // --- Keep selected currency updated with socket ---
  useEffect(() => {
    const curr = effectiveCurrency ?? currency;
    if (!curr || !coinData) return;

    currentCurrencyRef.current = curr;

    const updated = coinData.find(
      (c) => c.base_currency === curr.base_currency
    );

    if (updated) {
      setCurrencyData(updated);
    }
  }, [coinData, currency, effectiveCurrency]);

  // --- Safe destructuring ---
  const {
    base_currency,
    base_currency_id,
    quote_currency,
    quote_currency_id,
    change_percentage,
    _id,
    buy_price,
    high,
    low,
    volume,
  } = currencyData ?? {};
  const { skip_buy_sell, id, kycVerified } = userData ?? "";

  /** Chart opens immediately — do not wait for order book / socket; resolve symbols from pair, coin list, or row metadata. */
  const handleCandlePress = useCallback(() => {
    const pair = spotSelectedPair ?? currency ?? effectiveCurrency;
    if (!pair) return;
    const fromList =
      Array.isArray(coinData) && coinData.length > 0
        ? coinData.find(
          (c) =>
            (pair.base_currency_id != null &&
              pair.quote_currency_id != null &&
              c.base_currency_id === pair.base_currency_id &&
              c.quote_currency_id === pair.quote_currency_id) ||
            (pair.base_currency &&
              pair.quote_currency &&
              c.base_currency === pair.base_currency &&
              c.quote_currency === pair.quote_currency)
        )
        : null;
    const baseSym =
      pair.base_currency ??
      pair.base_currency_short_name ??
      fromList?.base_currency ??
      base_currency ??
      currencyData?.base_currency;
    const quoteSym =
      pair.quote_currency ??
      pair.quote_currency_short_name ??
      fromList?.quote_currency ??
      quote_currency ??
      currencyData?.quote_currency;
    if (!baseSym || !quoteSym) return;
    NavigationService.navigate(SPOT_CHART_SCREEN, {
      base_currency: baseSym,
      quote_currency: quoteSym,
      change_percentage: pair.change_percentage ?? change_percentage ?? 0,
      buy_price: pair.buy_price ?? buy_price,
      high: pair.high ?? high,
      low: pair.low ?? low,
      volume: pair.volume ?? volume,
    });
  }, [
    spotSelectedPair,
    currency,
    effectiveCurrency,
    coinData,
    base_currency,
    quote_currency,
    change_percentage,
    buy_price,
    high,
    low,
    volume,
    currencyData,
  ]);

  /** Web TradePage: Maker / Taker % under CTA; fall back 0.2 when pair has no fee fields yet */
  const spotFooterMakerTakerPct = useMemo(() => {
    const parseFee = (v, fallback = 0.2) => {
      if (v === null || v === undefined || v === "") return fallback;
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };
    return {
      maker: parseFee(currencyData?.maker_fee),
      taker: parseFee(currencyData?.taker_fee),
    };
  }, [currencyData?.maker_fee, currencyData?.taker_fee]);



  /** `activeTab` + `mountedOrdersTab` stay in sync — single panel only (web-style API lists; no duplicate slide UI). */
  const [activeTab, setActiveTab] = useState(1);
  const [mountedOrdersTab, setMountedOrdersTab] = useState(1);
  activeTabRef.current = activeTab;

  // Swipe animation for bottom tabs content (1 ↔ 2 ↔ 3)
  const ordersTabsPrevRef = useRef(activeTab);
  const ordersTabsAnimX = useRef(new Animated.Value(0)).current;
  const animateOrdersTabsSwitch = useCallback(
    (nextTabId) => {
      const prev = ordersTabsPrevRef.current;
      ordersTabsPrevRef.current = nextTabId;
      const dir = nextTabId > prev ? 1 : -1;
      ordersTabsAnimX.setValue(dir * (Width * 0.25));
      Animated.timing(ordersTabsAnimX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    },
    [ordersTabsAnimX],
  );

  /** Bottom tabs row: scroll so left tabs align left, right tab aligns right (narrow screens). */
  const ordersBottomTabScrollRef = useRef(null);
  const ordersBottomTabBarWidthRef = useRef(0);
  const ordersBottomTabItemLayoutRef = useRef({});

  const scrollOrdersBottomTabBarIntoView = useCallback((tabId) => {
    const sv = ordersBottomTabScrollRef.current;
    if (!sv) return;
    const barW = ordersBottomTabBarWidthRef.current;
    const lay = ordersBottomTabItemLayoutRef.current[tabId];
    const pad = 10;
    if (!lay?.width || barW <= 0) {
      if (tabId === 1) sv.scrollTo({ x: 0, animated: true });
      else if (tabId === 3) sv.scrollToEnd({ animated: true });
      return;
    }
    let x = 0;
    if (tabId === 1) {
      x = Math.max(0, lay.x - pad);
    } else if (tabId === 3) {
      x = Math.max(0, lay.x + lay.width - barW + pad);
    } else {
      x = Math.max(0, lay.x + lay.width / 2 - barW / 2);
    }
    sv.scrollTo({ x, animated: true });
  }, []);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollOrdersBottomTabBarIntoView(mountedOrdersTab);
    });
    return () => cancelAnimationFrame(id);
  }, [mountedOrdersTab, scrollOrdersBottomTabBarIntoView]);

  const handleSpotOrdersPrimaryTab = useCallback(
    (tabId) => {
      if (tabId < 1 || tabId > 3) return;
      if (activeTab === tabId) return;
      setExpandedRowIndex(null);
      animateOrdersTabsSwitch(tabId);
      activeTabRef.current = tabId;
      setActiveTab(tabId);
      setMountedOrdersTab(tabId);
    },
    [activeTab, animateOrdersTabsSwitch],
  );

  const [tab, setTab] = useState("Buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [limitIoc, setLimitIoc] = useState(false);
  const [limitFok, setLimitFok] = useState(false);
  const [slippageEnabled, setSlippageEnabled] = useState(false);
  const [slippagePct, setSlippagePct] = useState("");
  const [isSlippageInputFocused, setIsSlippageInputFocused] = useState(false);
  const inputSelectionColor = "#000";
  const [isBuy, setIsBuy] = useState(true);
  const [total, setTotal] = useState("");
  // const [chartLoading, setChartLoading] = useState(true);
  // const [preloadedUrl, setPreloadedUrl] = useState(null);
  // const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [numberSelectLimit, setNumberLimit] = useState("Limit");
  const spotOrderType = useMemo(() => {
    switch (numberSelectLimit) {
      case "Market":
        return "MARKET";
      case "Spot Limit":
        return "STOP_LIMIT";
      case "Spot Market":
        return "STOP_MARKET";
      default:
        return "LIMIT";
    }
  }, [numberSelectLimit]);
  // Web parity flags (see `arab_global_exchange/src/ui/Pages/TradePage/index.js`)
  const isStopOrder = spotOrderType === "STOP_LIMIT" || spotOrderType === "STOP_MARKET";
  const isLimit = spotOrderType === "LIMIT" || spotOrderType === "STOP_LIMIT";
  const isMarketLikeOrder = spotOrderType === "MARKET" || spotOrderType === "STOP_MARKET";
  const showStopPriceField = isStopOrder;
  const showAmtDenomSelect =
    spotOrderType === "MARKET" || spotOrderType === "STOP_MARKET" || spotOrderType === "STOP_LIMIT";
  const showSpotOrderFooter =
    spotOrderType === "LIMIT" || spotOrderType === "MARKET" || spotOrderType === "STOP_LIMIT" || spotOrderType === "STOP_MARKET";

  const slippageBounds = useMemo(() => {
    const minRaw = Number(currencyData?.min_slippage_percent);
    const maxRaw = Number(currencyData?.max_slippage_percent);
    const min = Number.isFinite(minRaw) && minRaw > 0 ? minRaw : 0.1;
    const max = Number.isFinite(maxRaw) && maxRaw >= min ? maxRaw : Math.max(1, min);
    return { min, max };
  }, [currencyData?.min_slippage_percent, currencyData?.max_slippage_percent]);

  const slippagePlaceholder = useMemo(
    () => `Allowed ${slippageBounds.min}% - ${slippageBounds.max}%`,
    [slippageBounds.max, slippageBounds.min]
  );

  const slippageError = useMemo(() => {
    if (!slippageEnabled) return "";
    const text = String(slippagePct ?? "").trim();
    if (text === "") return "";
    const n = Number(text);
    if (!Number.isFinite(n)) return "Enter a valid slippage percent.";
    if (n < slippageBounds.min || n > slippageBounds.max) {
      return `Slippage must be between ${slippageBounds.min}% and ${slippageBounds.max}%.`;
    }
    return "";
  }, [slippageBounds.max, slippageBounds.min, slippageEnabled, slippagePct]);

  useEffect(() => {
    if (!slippageEnabled) setIsSlippageInputFocused(false);
  }, [slippageEnabled]);

  const [openOrderKindTab, setOpenOrderKindTab] = useState("all");
  // const [orderBookReady, setOrderBookReady] = useState(false);
  // const [showOrderBookSkeleton, setShowOrderBookSkeleton] = useState(true);
  const [spotMyTrades, setSpotMyTrades] = useState([]);
  /** Skip local state updates when REST poll returns identical rows (less re-render / jank). */
  const spotMyTradesDataSigRef = useRef("");
  const [tradeHistorySideFilter, setTradeHistorySideFilter] = useState("All");
  const [activePercentage, setActivePercentage] = useState(0);
  const [balance, setBalance] = useState(0);
  const [_balance, _setBalance] = useState(0);
  const [numberSelect, setNumberSelect] = useState("0.0001");
  const [isConfirm, setIsConfirm] = useState(false);
  const [visible, setVisible] = useState(false);
  const [focusSettling, setFocusSettling] = useState(false);
  const focusSettlingTimeoutRef = useRef(null);

  const orderBookReady = orderBookSocketReady;
  const showOrderBookSkeleton = !orderBookSocketReady;
  /** Header shows skeleton until `coinData` row exists for the pair (LOCAL pairs skip list lookup). */
  const pairMetaReady =
    currencyData != null || effectiveCurrency?.available === "LOCAL";
  const pairHeaderLoading = !pairMetaReady;

  const pairIdForFav = useMemo(() => currencyData?._id ?? effectiveCurrency?._id ?? spotSelectedPair?._id, [currencyData?._id, effectiveCurrency?._id, spotSelectedPair?._id]);
  const isFav = useMemo(() => {
    if (!favoriteArray || !pairIdForFav) return false;
    return favoriteArray.includes(pairIdForFav);
  }, [favoriteArray, pairIdForFav]);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (userData && !favoriteArrayLoaded) {
      dispatch(getFavoriteArray());
    }
  }, [userData, favoriteArrayLoaded, dispatch]);

  const toggleFavorite = useCallback(async () => {
    if (!pairIdForFav || favLoading) return;
    setFavLoading(true);
    try {
      await dispatch(addToFavorites({ pair_id: pairIdForFav }));
    } catch (e) {
      console.log("Favorite toggle error", e);
    } finally {
      setFavLoading(false);
    }
  }, [dispatch, pairIdForFav, favLoading]);


  // Lifecycle: on focus subscribe and show content; on blur clear global loader first (no overlay), then all timers and unsubscribe
  useFocusEffect(
    useCallback(() => {
      unsubscribeFromMarket();
      unsubscribeFromFutures();
      dispatch(setLoading(false));
      isSpotFocusedRef.current = true;
      setFocusSettling(true);
      if (focusSettlingTimeoutRef.current) clearTimeout(focusSettlingTimeoutRef.current);
      focusSettlingTimeoutRef.current = setTimeout(() => {
        focusSettlingTimeoutRef.current = null;
        setFocusSettling(false);
      }, 550);
      const pending = pendingOrderBookOnBlurRef.current;
      if (pending) {
        pendingOrderBookOnBlurRef.current = null;
        flushSocketToStateRef.current?.(pending);
      }
      const currentPair = currentCurrencyRef.current || currency;
      if (currentPair?.base_currency_id && currentPair?.quote_currency_id) {
        const newKey = `${currentPair.base_currency_id}-${currentPair.quote_currency_id}`;
        const lastExchange = lastSubscribedExchangeRef.current;
        const alreadySubscribed =
          !!lastExchange &&
          `${lastExchange.base_currency_id}-${lastExchange.quote_currency_id}` === newKey;
        /** Only clear + resubscribe when the exchange pair actually changed (or first load).
         *  Returning from SpotChartScreen keeps `lastSubscribedExchangeRef` + Redux book — Binance-style (no full reload). */
        if (!alreadySubscribed) {
          dispatch(setBuyOrders([]));
          dispatch(setSellOrders([]));
          setLastSocketData(null);
          setLocalBuyOrders([]);
          setLocalSellOrders([]);
          if (lastExchange?.base_currency_id != null && lastExchange?.quote_currency_id != null) {
            unsubscribeFromExchange(lastExchange.base_currency_id, lastExchange.quote_currency_id);
          }
          subscribeToExchange(currentPair.base_currency_id, currentPair.quote_currency_id);
          lastSubscribedExchangeRef.current = {
            base_currency_id: currentPair.base_currency_id,
            quote_currency_id: currentPair.quote_currency_id,
          };
        }
      }
      // If pair has no ids, ensure we don't show stale data from a previous subscription.
      if (!currentPair?.base_currency_id || !currentPair?.quote_currency_id) {
        const lastExchange = lastSubscribedExchangeRef.current;
        if (lastExchange?.base_currency_id != null && lastExchange?.quote_currency_id != null) {
          unsubscribeFromExchange(lastExchange.base_currency_id, lastExchange.quote_currency_id);
          lastSubscribedExchangeRef.current = null;
        }
        dispatch(setBuyOrders([]));
        dispatch(setSellOrders([]));
        dispatch(setRecentTrades([]));
        setLastSocketData(null);
        setLocalBuyOrders([]);
        setLocalSellOrders([]);
      }
      if (currentPair?.available === "LOCAL") {
        if (latestLocalBuyOrdersRef.current?.length > 0) {
          dispatch(setBuyOrders(latestLocalBuyOrdersRef.current));
        }
        if (latestLocalSellOrdersRef.current?.length > 0) {
          dispatch(setSellOrders(latestLocalSellOrdersRef.current));
        }
      }
      // Ensure loader hides after a timeout if data is stuck, but mainly rely on data
      const stopLoaderTimer = setTimeout(() => {
        dispatch(setLoading(false));
      }, 2000);

      return () => {
        dispatch(setLoading(false));
        isSpotFocusedRef.current = false;
        clearTimeout(stopLoaderTimer);

        // Clean up all timers and refs so no callbacks run after blur (prevents freeze and overlay)
        if (focusSettlingTimeoutRef.current) {
          clearTimeout(focusSettlingTimeoutRef.current);
          focusSettlingTimeoutRef.current = null;
        }

        if (socketThrottleTimerRef.current) {
          clearTimeout(socketThrottleTimerRef.current);
          socketThrottleTimerRef.current = null;
        }
        pendingSocketFlushRef.current = null;

        /** Do not unsubscribe or clear the order book on blur (e.g. opening SpotChartScreen).
         *  SocketProvider keeps one exchange subscription; Redux keeps last book until pair changes or Spot unmounts. */
      };
    }, [subscribeToExchange, unsubscribeFromExchange, currency, dispatch])
  );

  /** Tear down exchange subscription only when Spot screen unmounts (leave trading stack), not on blur. */
  useEffect(() => {
    return () => {
      const last = lastSubscribedExchangeRef.current;
      if (last?.base_currency_id != null && last?.quote_currency_id != null) {
        unsubscribeFromExchange(last.base_currency_id, last.quote_currency_id);
        lastSubscribedExchangeRef.current = null;
      }
    };
  }, [unsubscribeFromExchange]);

  // Keep ref in sync for callbacks (socket, flushSocketToState) so they see current focus without delay
  useEffect(() => {
    isSpotFocusedRef.current = isSpotFocused;
  }, [isSpotFocused]);

  // Removed redundant useEffects for exchange subscriptions to prevent duplicate Exchange subscribe logs.

  useEffect(() => {
    if (Object.keys(coinBalance || {}).length === 0) return;
    setBalance(coinBalance?.quote_currency_balance || 0);
    _setBalance(coinBalance?.base_currency_balance || 0);
  }, [coinBalance]);

  // AppState handling to prevent updates when app is in background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appStateRef.current = nextAppState;
      setAppState(nextAppState);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const flushSocketToState = useCallback((payload) => {
    if (!payload) return;
    if (!isSpotFocusedRef.current) {
      pendingOrderBookOnBlurRef.current = payload;
      return;
    }
    setLastSocketData(payload.data);
    if (historyOnly) {
      // In history-only mode, skip orderbook/recentTrades dispatches to keep UI ultra-light.
      return;
    }
    if (payload.recentTrades?.length !== undefined) {
      // already in Redux via setCoinData in SocketProvider
    }
    if (payload.sellOrders?.length !== undefined) {
      if (!orderBookDataEqual(lastFlushedSellRef.current, payload.sellOrders)) {
        lastFlushedSellRef.current = payload.sellOrders;
        setLocalSellOrders(payload.sellOrders);
        dispatch(setSellOrders(payload.sellOrders));
      }
    }
    if (payload.buyOrders?.length !== undefined) {
      if (!orderBookDataEqual(lastFlushedBuyRef.current, payload.buyOrders)) {
        lastFlushedBuyRef.current = payload.buyOrders;
        setLocalBuyOrders(payload.buyOrders);
        dispatch(setBuyOrders(payload.buyOrders));
      }
    }
    if (payload.recentTrades?.length !== undefined) {
      dispatch(setRecentTrades(payload.recentTrades));
    }
  }, [dispatch]);

  flushSocketToStateRef.current = flushSocketToState;

  // Socket listener only when Spot is focused - when blurred we remove listeners so no work in background
  useEffect(() => {
    if (!socket || !isSpotFocused) return;

    const scheduleFlush = (payload) => {
      pendingSocketFlushRef.current = payload;
      const now = Date.now();
      const elapsed = now - socketLastFlushRef.current;
      const throttleMs = (activeTabRef.current === 1 || activeTabRef.current === 2 || activeTabRef.current === 3)
        ? 1200
        : SOCKET_UI_THROTTLE_MS;
      if (elapsed >= throttleMs || socketLastFlushRef.current === 0) {
        socketLastFlushRef.current = now;
        flushSocketToState(payload);
        pendingSocketFlushRef.current = null;
        if (socketThrottleTimerRef.current) {
          clearTimeout(socketThrottleTimerRef.current);
          socketThrottleTimerRef.current = null;
        }
        return;
      }
      if (socketThrottleTimerRef.current == null) {
        socketThrottleTimerRef.current = setTimeout(() => {
          socketThrottleTimerRef.current = null;
          socketLastFlushRef.current = Date.now();
          const pending = pendingSocketFlushRef.current;
          pendingSocketFlushRef.current = null;
          if (pending) {
            flushSocketToState(pending);
          }
        }, throttleMs - elapsed);
      }
    };

    const handleMessage = (data) => {
      latestSocketDataRef.current = data;
      if (!isSpotFocusedRef.current || appStateRef.current !== "active") return;

      // Trade History UI is API-only (getTradeHistory → Redux → spotMyTrades). Do not hydrate from socket.

      const hasBuyArr = Array.isArray(data?.buy_order);
      const hasSellArr = Array.isArray(data?.sell_order);
      if (!historyOnly && (hasBuyArr || hasSellArr)) {
        setOrderBookSocketReady(true);
      }
      if (hasBuyArr) {
        latestLocalBuyOrdersRef.current = data.buy_order;
      }
      if (hasSellArr) {
        latestLocalSellOrdersRef.current = data.sell_order;
      }

      if (!historyOnly && (hasBuyArr || hasSellArr || Array.isArray(data?.recent_trades))) {
        scheduleFlush({
          data,
          buyOrders: hasBuyArr ? data.buy_order : undefined,
          sellOrders: hasSellArr ? data.sell_order : undefined,
          recentTrades: Array.isArray(data?.recent_trades) ? data.recent_trades : undefined,
        });
      }
    };

    // Web uses exchange:update; listen to both so open orders & order history update smoothly
    socket.on("message", handleMessage);
    socket.on("exchange:update", handleMessage);
    return () => {
      socket.off("message", handleMessage);
      socket.off("exchange:update", handleMessage);
      if (socketThrottleTimerRef.current) {
        clearTimeout(socketThrottleTimerRef.current);
        socketThrottleTimerRef.current = null;
      }
    };
  }, [socket, isSpotFocused, dispatch, flushSocketToState]);

  // Use local orders for LOCAL pairs when local lists update
  useEffect(() => {
    if (currency?.available === "LOCAL") {
      dispatch(setBuyOrders(LocalBuyOrders));
      dispatch(setSellOrders(LocalSellOrders));
      dispatch(setRecentTrades(recentTrades));
    }
  }, [LocalBuyOrders, LocalSellOrders, recentTrades, currency, dispatch]);

  // Web parity: poll only while the mounted tab panel is Order History (2) — matches visible UI after slide animation (avoids Redux updating mid-slide + stale list flash).
  /**
   * Warm-switch prefetch:
   * When Spot is focused and a pair is selected, prefetch BOTH:
   * - Order History (executed orders)
   * - Trade History (fills)
   *
   * This makes switching tab 2 ↔ 3 feel instant (same as History screen warm-cache behavior),
   * while keeping the polling intervals gated to the mounted panel only.
   */
  const spotHistoryPrefetchRef = useRef({ pair: undefined, ts: 0 });
  useEffect(() => {
    if (!base_currency || !quote_currency || !userData) return;
    if (!isSpotFocused) return;
    const pair = `${base_currency}${quote_currency}`.toUpperCase();
    const now = Date.now();
    // Debounce: avoid spam on rapid re-renders.
    if (spotHistoryPrefetchRef.current.pair === pair && now - (spotHistoryPrefetchRef.current.ts || 0) < 2500) return;
    spotHistoryPrefetchRef.current = { pair, ts: now };

    // Prefetch order history (tab 2)
    dispatch(getPastOrders({ page: 1, page_size: 50, pair }, { useGlobalLoader: false }));

    // Prefetch trade fills (tab 3) — do NOT clear on focus return (avoids list flicker/reload when coming back from detail).
    dispatch(
      getTradeHistory(0, 50, pair, {
        useGlobalLoader: false,
        clearBeforeFetch: false,
      }),
    );
  }, [base_currency, quote_currency, userData, dispatch, isSpotFocused]);

  useEffect(() => {
    if (!base_currency || !quote_currency || !userData) return undefined;
    if (!isSpotFocused) return undefined;
    if (mountedOrdersTab !== 2) return undefined;
    const pair = `${base_currency}${quote_currency}`.toUpperCase();
    const tick = () =>
      dispatch(getPastOrders({ page: 1, page_size: 50, pair }, { useGlobalLoader: false }));
    tick();
    const id = setInterval(tick, SPOT_HIST_POLL_MS);
    return () => clearInterval(id);
  }, [base_currency, quote_currency, userData, dispatch, mountedOrdersTab, isSpotFocused]);

  // Same for Trade History (3): poll only when that panel is actually mounted (not merely tab highlight mid-animation).
  useEffect(() => {
    if (!base_currency || !quote_currency || !userData) return undefined;
    if (!isSpotFocused) return undefined;
    if (mountedOrdersTab !== 3) return undefined;
    const pair = `${base_currency}${quote_currency}`.toUpperCase();
    const tick = () =>
      dispatch(
        getTradeHistory(0, 50, pair, {
          useGlobalLoader: false,
          clearBeforeFetch: false,
        }),
      );
    tick();
    const id = setInterval(tick, SPOT_HIST_POLL_MS);
    return () => clearInterval(id);
  }, [base_currency, quote_currency, userData, dispatch, mountedOrdersTab, isSpotFocused]);

  // Trade History list: mirror REST-only payload from getTradeHistory (no socket merge).
  const walletTradeHistory = useSelector((state) => state.wallet.tradeHistory);
  useEffect(() => {
    // Optimization: when leaving Trade History tab, ignore background Redux updates
    // to avoid heavy mapping + re-render during tab-switch animation.
    if (mountedOrdersTab !== 3) return;
    const list = walletTradeHistory == null
      ? []
      : (Array.isArray(walletTradeHistory) ? walletTradeHistory : []);
    const norm = list.map((t, idx) => ({
      ...t,
      _id: t._id || t.id || t.trade_id || `trade_row_${idx}`,
    }));
    const sig = norm
      .map(
        (t) =>
          `${t._id}:${String(t.executed_at ?? t.executedAt ?? t.created_at ?? "")}:${String(t.price ?? "")}:${String(t.quantity ?? "")}:${String(t.side ?? "")}`,
      )
      .join("|");
    if (sig === spotMyTradesDataSigRef.current) return;
    spotMyTradesDataSigRef.current = sig;
    setSpotMyTrades(norm);
  }, [walletTradeHistory, mountedOrdersTab]);

  useEffect(() => {
    spotMyTradesDataSigRef.current = "";
  }, [base_currency, quote_currency]);

  const handleAmount = (text) => {
    setPrice(text?.toString());
    setTotal(multiply(text, amount));
  };

  const handleOrderBookClick = useCallback((itemPrice, itemQuantity) => {
    if (isLimit) {
      setPrice(formatPrice(itemPrice).toString());
    }
    const q = formatQuantity(itemQuantity).toString();
    syncAmountAnimForQuantityString(q);
    setAmount(q);
  }, [isLimit, formatPrice, formatQuantity, syncAmountAnimForQuantityString]);

  const validateOrder = (price, quantity, side, orderKind = "LIMIT") => {
    const tick_size = currencyData?.tick_size || 0.01;
    const step_size = currencyData?.step_size || 0.00001;
    const min_notional = currencyData?.min_notional || 5;
    const max_order_qty = currencyData?.max_order_qty || 9000;

    const skipPriceTick = orderKind === "MARKET" || orderKind === "STOP_MARKET";

    const numPrice = parseFloat(price);
    const numQuantity = parseFloat(quantity);
    const total = numPrice * numQuantity;

    if (!skipPriceTick) {
      const pricePrecisionVal = getDecimalPlaces(tick_size);
      const priceMultiplier = Math.pow(10, pricePrecisionVal);
      if (Math.round(numPrice * priceMultiplier) % Math.round(tick_size * priceMultiplier) !== 0) {
        showError(`Price must be a multiple of ${tick_size}`);
        return false;
      }
    }

    const qtyPrecision = getDecimalPlaces(step_size);
    const qtyMultiplier = Math.pow(10, qtyPrecision);
    if (Math.round(numQuantity * qtyMultiplier) % Math.round(step_size * qtyMultiplier) !== 0) {
      showError(`Quantity must be a multiple of ${step_size}`);
      return false;
    }

    if (numQuantity > max_order_qty) {
      showError(`Maximum order quantity is ${max_order_qty} ${currencyData?.base_currency}`);
      return false;
    }

    if (total < min_notional) {
      showError(`Minimum order value is ${min_notional} ${currencyData?.quote_currency}`);
      return false;
    }

    if (side === "BUY") {
      const availableBalance = coinBalance?.quote_currency_balance || 0;
      if (total > availableBalance) {
        showError("Insufficient funds");
        return false;
      }
    } else if (side === "SELL") {
      const availableBalance = coinBalance?.base_currency_balance || 0;
      if (numQuantity > availableBalance) {
        showError("Insufficient funds");
        return false;
      }
    }

    return true;
  };

  const formatTotal = (value) => {
    const precision = getPricePrecision();
    const finalValue = value?.toFixed(precision)?.replace(/\.?0+$/, "");
    let formattedNum = finalValue?.toString();
    let result = formattedNum?.replace(/^0\.0*/, "");
    const decimalPart = finalValue?.toString()?.split(".")[1];
    if (!decimalPart) return finalValue;
    let zeroCount = 0;
    for (let char of decimalPart) {
      if (char === "0") zeroCount++;
      else break;
    }
    if (zeroCount > 4) return `0.0{${zeroCount}}${result}`;
    if (value < 1e-7) return `0.0{${zeroCount}}${result}`;
    return finalValue;
  };

  const isValidPriceInput = (value) => {
    if (value === "" || value === "0") return true;
    const tickSize = currencyData?.tick_size || 0.01;
    const pricePrec = getPricePrecision();
    const regex = new RegExp(`^\\d*\\.?\\d{0,${pricePrec}}$`);
    if (!regex.test(value)) return false;
    if (value.endsWith(".")) return true;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    if (numValue === 0) return true;
    return numValue >= tickSize;
  };

  const handlePriceInput = (value, setter) => {
    if (isValidPriceInput(value)) setter(value);
  };

  const handlePriceBlur = (value, setter) => {
    if (value === "" || value === "0" || value === "0.") {
      setter("");
      return;
    }
    const tickSize = currencyData?.tick_size || 0.01;
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue === 0) {
      setter("");
      return;
    }
    if (numValue < tickSize) {
      setter(tickSize.toString());
      return;
    }
    const rounded = Math.round(numValue / tickSize) * tickSize;
    const prec = getPricePrecision();
    setter(parseFloat(rounded.toFixed(prec)).toString());
  };

  const isValidQuantityInput = (value) => {
    if (value === "" || value === "0") return true;
    const qtyPrec = getQuantityPrecision();
    const regex = new RegExp(`^\\d*\\.?\\d{0,${qtyPrec}}$`);
    return regex.test(value);
  };

  const handleQuantityInput = (value, setter) => {
    if (isValidQuantityInput(value)) setter(value);
  };

  const handleQuantityBlur = (value, setter) => {
    if (value === "" || value === "0" || value === "0.") {
      setter("");
      return;
    }
    const stepSize = currencyData?.step_size || 0.00001;
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue === 0) {
      setter("");
      return;
    }
    if (numValue < stepSize) {
      setter(stepSize.toString());
      return;
    }
    const rounded = Math.round(numValue / stepSize) * stepSize;
    const prec = getQuantityPrecision();
    setter(parseFloat(rounded.toFixed(prec)).toString());
  };

  const tickSize = currencyData?.tick_size || 0.01;
  const stepSize = currencyData?.step_size || 0.00001;
  const handlePriceStep = (delta) => {
    const current = parseFloat(price || buy_price || "0") || 0;
    const next = Math.max(0, current + delta * tickSize);
    const prec = getPricePrecision();
    const val = parseFloat(next.toFixed(prec)).toString();
    setPrice(val);
  };
  const handleAmountStep = (delta) => {
    const current = parseFloat(amount || "0") || 0;
    const next = Math.max(0, current + delta * stepSize);
    const prec = getQuantityPrecision();
    const val = parseFloat(next.toFixed(prec)).toString();
    syncAmountAnimForQuantityString(val);
    setAmount(val);
  };

  const handleStopPriceStep = (delta) => {
    const current = parseFloat(stopPrice || buy_price || "0") || 0;
    const next = Math.max(0, current + delta * tickSize);
    const prec = getPricePrecision();
    const val = parseFloat(next.toFixed(prec)).toString();
    syncStopAnimForPriceString(val);
    setStopPrice(val);
  };

  const handleQty = (text) => handleQuantityInput(text, setAmount);

  const toFixed8 = (data) => {
    const precision = getQuantityPrecision();
    const multiplier = Math.pow(10, precision);
    return Math.floor(data * multiplier) / multiplier;
  };

  const toFixedStepSize = (data) => {
    const stepSize = currencyData?.step_size || 0.00001;
    const precision = getQuantityPrecision();
    const multiplier = Math.pow(10, precision);
    return Math.floor(data * multiplier) / multiplier;
  };

  useEffect(() => {
    if (isBuy && _balance) {
      setBalance(_balance?.quote_currency_balance);
    } else {
      setBalance(_balance?.base_currency_balance);
    }
  }, [isBuy, _balance]);

  const handleTotalPercentage = (value) => {
    setActivePercentage(value);
    if (isBuy) {
      const val = percentCalculation(
        coinBalance?.quote_currency_balance || 0,
        value
      );
      const finalQuantity = toFixed8(
        val / (!isMarketLikeOrder ? price || buy_price : buy_price)
      );

      const amtStr = finalQuantity.toString() || "0";
      syncAmountAnimForQuantityString(amtStr);
      setAmount(amtStr);
      // handleTotal(percentCalculation(coinBalance?.quote_currency_balance || 0, value));
    } else {
      const finalQuantity = toFixed8(
        percentCalculation(coinBalance?.base_currency_balance || 0, value)
      );
      const amtStr = finalQuantity.toString() || "0";
      syncAmountAnimForQuantityString(amtStr);
      setAmount(amtStr);
    }
  };

  const handleTotal = (text) => {
    const qty = Number(text) / Number(price);
    const qStr = qty?.toString();
    syncAmountAnimForQuantityString(qStr);
    setAmount(qStr);
    setTotal(multiply(price, qty));
  };

  const selectNumberLimitOn = (item) => {
    setNumberLimit(item.name);
    rbSheetlimit?.current?.close();
  };

  const orderTypeSheetHeight = Math.min(540, WindowHeight * 0.58);

  const renderOrderTypeSheet = () => {
    const lime = themeColors.spotTradeBuy ?? colors.spotTradeBuy ?? colors.buyBtnGreen;
    const renderRow = (item) => {
      const selected = numberSelectLimit === item.name;
      return (
        <TouchableOpacity
          key={item.name}
          activeOpacity={0.75}
          onPress={() => selectNumberLimitOn({ name: item.name })}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 14,
            paddingHorizontal: 4,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: themeColors.themeBorderColor,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: colors.newThemeColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FastImage source={item.icon} tintColor={colors.white} style={{ width: 16, height: 16 }} resizeMode="contain" />
          </View>
          <View style={{ flex: 1, marginLeft: 12, paddingRight: 8 }}>
            <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 14, marginBottom: 3 }}>
              {item.name}
            </AppText>
            <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, fontSize: 11, lineHeight: 15 }}>
              {item.description}
            </AppText>
          </View>
          {selected ? (
            <View style={{ width: 16, height: 16, borderRadius: 10, backgroundColor: colors.black, alignItems: "center", justifyContent: "center" }}>
              <FastImage source={tick} tintColor={colors.white} style={{ width: 8, height: 8 }} resizeMode="contain" />
            </View>
          ) : (
            <View style={{ width: 26 }} />
          )}
        </TouchableOpacity>
      );
    };

    const sectionInfo = (title, body) => {
      Alert.alert(title, body);
    };

    return (
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 14,
            marginBottom: 4,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: themeColors.themeBorderColor,
          }}
        >
          <AppText weight={SEMI_BOLD} style={{ fontSize: 16, color: themeColors.text }}>
            Order Type
          </AppText>
          <TouchableOpacity
            onPress={() => rbSheetlimit?.current?.close()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: themeColors.themeElevationColor,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: themeColors.themeBorderColor,
            }}
          >
            <FastImage source={REMOVE} style={{ width: 18, height: 18 }} resizeMode="contain" tintColor={colors.black} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 6 }}>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 13, color: themeColors.text }}>
              Basic
            </AppText>
            <TouchableOpacity
              onPress={() =>
                sectionInfo(
                  "Basic order types",
                  "Limit: your order rests on the book at a set price.\n\nMarket: fill immediately at the best available prices."
                )
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: 4, top: 2 }}
            >
              <FastImage source={INFO} style={{ width: 12, height: 12 }} resizeMode="contain" />
            </TouchableOpacity>
          </View>
          {ORDER_TYPE_SHEET_BASIC.map(renderRow)}

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 6 }}>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 14, color: themeColors.text }}>
              Advanced
            </AppText>
            <TouchableOpacity
              onPress={() =>
                sectionInfo(
                  "Advanced (Spot)",
                  "Spot Limit: after your stop is hit, a limit order is placed.\n\nSpot Market: after your stop is hit, a market order runs at the best price."
                )
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: 4, top: 2 }}
            >
              <FastImage source={INFO} style={{ width: 12, height: 12 }} resizeMode="contain" />
            </TouchableOpacity>
          </View>
          {ORDER_TYPE_SHEET_ADVANCED.map(renderRow)}
        </ScrollView>
      </View>
    );
  };

  const validateStopTriggerPrice = useCallback(
    (rawStop) => {
      const tick_size = currencyData?.tick_size || 0.01;
      const numPrice = parseFloat(rawStop);
      if (!Number.isFinite(numPrice) || numPrice <= 0) {
        showError("Enter a valid stop price");
        return false;
      }
      const pricePrecisionVal = getDecimalPlaces(tick_size);
      const priceMultiplier = Math.pow(10, pricePrecisionVal);
      if (Math.round(numPrice * priceMultiplier) % Math.round(tick_size * priceMultiplier) !== 0) {
        showError(`Stop price must be a multiple of ${tick_size}`);
        return false;
      }
      return true;
    },
    [currencyData?.tick_size]
  );

  const buildSpotOrderPayload = useCallback(() => {
    const refPrice = Number(buy_price) || 0;
    const limitFromUi =
      price !== undefined && price !== null && String(price).trim() !== ""
        ? parseFloat(price)
        : refPrice;
    const orderPriceForValidation =
      spotOrderType === "MARKET" || spotOrderType === "STOP_MARKET" ? refPrice : limitFromUi;
    const orderPriceForApi = orderPriceForValidation;
    const stopPxRaw = stopPrice !== undefined && stopPrice !== null && String(stopPrice).trim() !== ""
      ? stopPrice
      : buy_price;
    const data = {
      base_currency_id: base_currency_id,
      order_type: spotOrderType,
      price: String(orderPriceForApi),
      quantity: String(amount),
      quote_currency_id: quote_currency_id,
      side: isBuy ? "BUY" : "SELL",
    };
    if (spotOrderType === "STOP_LIMIT" || spotOrderType === "STOP_MARKET") {
      data.stop_price = String(stopPxRaw);
    }
    if ((spotOrderType === "LIMIT" || spotOrderType === "STOP_LIMIT") && (limitFok || limitIoc)) {
      data.time_in_force = limitFok ? "FOK" : "IOC";
    }
    if ((spotOrderType === "MARKET" || spotOrderType === "STOP_MARKET") && slippageEnabled && !slippageError) {
      const raw = String(slippagePct ?? "").trim();
      const n = parseFloat(raw);
      if (Number.isFinite(n) && n > 0) {
        data.max_slippage_percent = n;
      }
    }
    return { data, orderPriceForValidation };
  }, [
    amount,
    base_currency_id,
    buy_price,
    isBuy,
    limitFok,
    limitIoc,
    price,
    quote_currency_id,
    slippageEnabled,
    slippageError,
    slippagePct,
    spotOrderType,
    stopPrice,
  ]);

  const onSubmit = () => {
    if (skip_buy_sell) {
      const { data, orderPriceForValidation } = buildSpotOrderPayload();
      if (spotOrderType === "STOP_LIMIT" || spotOrderType === "STOP_MARKET") {
        if (!validateStopTriggerPrice(stopPrice !== "" ? stopPrice : buy_price)) return;
      }
      if (!validateOrder(orderPriceForValidation, amount, isBuy ? "BUY" : "SELL", spotOrderType)) {
        return;
      }
      dispatch(placeOrder(data, setVisible));
    } else {
      setIsConfirm(true);
    }
  };

  const onConfirm = () => {
    const { data, orderPriceForValidation } = buildSpotOrderPayload();
    if (spotOrderType === "STOP_LIMIT" || spotOrderType === "STOP_MARKET") {
      if (!validateStopTriggerPrice(stopPrice !== "" ? stopPrice : buy_price)) {
        setIsConfirm(false);
        return;
      }
    }
    if (!validateOrder(orderPriceForValidation, amount, isBuy ? "BUY" : "SELL", spotOrderType)) {
      setIsConfirm(false);
      return;
    }
    dispatch(placeOrder(data, setVisible));
    setIsConfirm(false);
  };

  const handleCancelOrder = (orderId) => {
    dispatch(cancelOrder({ order_id: orderId }));
    // Automatic socket emit (every 1 second) will handle data refresh
  };

  const selectNumber = (item) => {
    setNumberSelect(item.label);
  };
  const renderNumber = () => {
    return Data?.map((item) => {
      return (
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => selectNumber(item)}
          style={[styles.selectContainer, { paddingVertical: 12, height: 'auto' }]}
        >
          <AppText style={{ color: themeColors.text, fontSize: 14 }}>{item.label}</AppText>
          {numberSelect == item.label ? (
            <FastImage
              source={checkIc}
              tintColor={themeColors.green}
              resizeMode="stretch"
              style={styles.checkImage}
            />
          ) : (
            <></>
          )}
        </TouchableOpacity>
      );
    });
  };

  const handlePopup = (theme) => {
    setVisible(false);
  };

  // helpers
  const toFinite = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  const normalizePairSymbol = useCallback((v) => {
    if (v == null) return "";
    const s = String(v).trim();
    return s && s.toLowerCase() !== "undefined" && s.toLowerCase() !== "null" ? s : "";
  }, []);

  const getOrderStatusRaw = useCallback((inv) => {
    return (
      inv?.status ??
      inv?.order_status ??
      inv?.orderStatus ??
      inv?.state ??
      inv?.status_text ??
      inv?.statusText ??
      ""
    );
  }, []);

  const getOrderStatusLabel = useCallback((inv) => {
    const raw = getOrderStatusRaw(inv);
    const status = String(raw || "").toUpperCase().trim();
    if (!status) return "---";
    if (["FILLED", "COMPLETE", "COMPLETED", "EXECUTED"].includes(status)) return "Filled";
    if (["CANCELLED", "CANCELED"].includes(status)) return "Cancelled";
    if (["OPEN", "PENDING"].includes(status)) return "Open";
    if (["PARTIAL", "PARTIALLY_FILLED", "PARTIAL_FILLED"].includes(status)) return "Partial";
    return String(raw);
  }, [getOrderStatusRaw]);

  const getBaseCoinIconUri = useCallback((inv) => {
    const uri =
      inv?.base_currency_image ??
      inv?.base_currency_icon ??
      inv?.base_currency_logo ??
      inv?.baseCurrencyImage ??
      inv?.baseCurrencyIcon ??
      currencyData?.base_currency_image ??
      currencyData?.base_currency_icon ??
      currencyData?.base_currency_logo ??
      null;
    return typeof uri === "string" && uri.length > 0 ? uri : null;
  }, [currencyData]);

  const buildCurrencyPairText = useCallback((inv) => {
    const base =
      normalizePairSymbol(inv?.base_currency_short_name) ||
      normalizePairSymbol(inv?.ask_currency) ||
      normalizePairSymbol(inv?.base_currency) ||
      normalizePairSymbol(inv?.base_currency_name) ||
      normalizePairSymbol(base_currency);
    const quote =
      normalizePairSymbol(inv?.quote_currency_short_name) ||
      normalizePairSymbol(inv?.pay_currency) ||
      normalizePairSymbol(inv?.quote_currency) ||
      normalizePairSymbol(inv?.quote_currency_name) ||
      normalizePairSymbol(quote_currency);
    if (!base || !quote) return `${base || "-"} / ${quote || "-"}`;
    return `${base}/${quote}`;
  }, [base_currency, quote_currency, normalizePairSymbol]);

  // Stable keyExtractors for order FlatLists (avoid inline functions)
  // Prefer stable keys (avoid index fallback -> remounts on sort/filter)
  const openOrderKeyExtractor = useCallback((item, idx) => {
    const id = item?._id ?? item?.order_id ?? item?.id;
    const t = item?.created_at ?? item?.createdAt ?? item?.updated_at ?? item?.updatedAt;
    return id ? `open_${id}` : `open_${t ?? "na"}_${idx}`;
  }, []);
  const pastOrderKeyExtractor = useCallback((item, idx) => {
    const id = item?._id ?? item?.order_id ?? item?.id;
    const t = item?.created_at ?? item?.createdAt ?? item?.updated_at ?? item?.updatedAt;
    return id ? `past_${id}` : `past_${t ?? "na"}_${idx}`;
  }, []);

  // Memoize filtered open orders for better performance
  const filteredOpenOrders = useMemo(() => {
    if (!openOrders?.length) return [];
    let filtered = openOrders.filter((item) => matchesOpenOrderKind(item, openOrderKindTab));
    if (orderFilter !== "All") {
      filtered = filtered.filter((item) => item?.side === orderFilter);
    }
    return filtered.sort((a, b) => {
      const dateA = new Date(a?.created_at || a?.createdAt || 0).getTime();
      const dateB = new Date(b?.created_at || b?.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [openOrders, orderFilter, openOrderKindTab]);

  const pastOrdersNormalized = useMemo(() => {
    if (!Array.isArray(pastOrders)) return [];

    // Web uses dedupeSpotHistoryById and normalizeSpotOrderHistoryApiItemForTrade
    const items = pastOrders.map(raw => {
      const id = raw._id || raw.id || raw.order_id || raw.client_order_id;
      if (!id) return null;

      // Ensure executions (executed_prices) are present
      const executions = Array.isArray(raw.executions) ? raw.executions : (Array.isArray(raw.executed_prices) ? raw.executed_prices : []);
      const executed_prices = executions.map((ex) => {
        const p = ex?.price ?? ex?.execution_price;
        const q = ex?.quantity ?? ex?.filled_quantity;
        const f = ex?.fee ?? "0";
        return {
          price: p,
          quantity: q,
          fee: f,
        };
      });

      const qty = Number(raw.quantity ?? 0);
      const filled = Number(raw.filled_quantity ?? raw.filled ?? 0);
      const remaining = Number(raw.remaining_quantity ?? raw.remaining ?? Math.max(0, qty - filled));

      return {
        ...raw,
        _id: id,
        side: String(raw.side || "").toUpperCase(),
        type: raw.type ?? raw.order_type ?? raw.orderType,
        order_type: raw.order_type ?? raw.type ?? raw.orderType,
        orderType: raw.orderType ?? raw.order_type ?? raw.type,
        user_status: raw.user_status ?? raw.status,
        status: raw.status,
        quantity: qty,
        remaining_quantity: remaining,
        filled_quantity: filled,
        avg_execution_price: raw.avg_execution_price ?? raw.avgPrice ?? raw.average_price,
        executed_value: raw.executed_value ?? raw.executedValue ?? (Number(raw.avg_execution_price || 0) * filled),
        price: raw.price ?? raw.limit_price ?? raw.stop_price ?? raw.trigger_price,
        time_in_force: raw.time_in_force || raw.tif || raw.timeInForce,
        tif: raw.tif || raw.time_in_force || raw.timeInForce,
        fill_percent: raw.fill_percent ?? raw.fillPercent ?? (qty > 0 ? `${Math.round((filled / qty) * 100)}%` : "0%"),
        executed_prices: executed_prices.length > 0 ? executed_prices : undefined,
        pair: raw.pair,
        ask_currency: raw.ask_currency,
        pay_currency: raw.pay_currency,
        total_fee: raw.total_fee ?? raw.fee,
        total_tds: raw.total_tds ?? raw.tds,
        updatedAt: raw.updatedAt || raw.updated_at || raw.created_at || raw.createdAt,
        createdAt: raw.createdAt || raw.created_at || raw.updatedAt || raw.updated_at,
      };
    }).filter(Boolean);

    // Dedupe by ID
    const seen = new Set();
    const out = [];
    for (const r of items) {
      const k = String(r._id);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(r);
    }

    return out.sort((a, b) => {
      const dateA = new Date(a?.created_at || a?.createdAt || a?.updated_at || a?.updatedAt || 0).getTime();
      const dateB = new Date(b?.created_at || b?.createdAt || b?.updated_at || b?.updatedAt || 0).getTime();
      return dateB - dateA;
    });
  }, [pastOrders]);

  const filteredPastOrders = useMemo(() => {
    if (!pastOrdersNormalized?.length) return [];
    if (pastOrderFilter === "All") return pastOrdersNormalized;
    const filtered = pastOrdersNormalized.filter((item) => item?.side === pastOrderFilter);
    return filtered.sort((a, b) => {
      const dateA = new Date(a?.created_at || a?.createdAt || a?.updated_at || a?.updatedAt || 0).getTime();
      const dateB = new Date(b?.created_at || b?.createdAt || b?.updated_at || b?.updatedAt || 0).getTime();
      return dateB - dateA;
    });
  }, [pastOrdersNormalized, pastOrderFilter]);

  const pastOrdersForSpotPair = useMemo(() => {
    if (!base_currency || !quote_currency || !filteredPastOrders?.length) return [];
    const b = String(base_currency).toUpperCase();
    const q = String(quote_currency).toUpperCase();
    return filteredPastOrders.filter((item) => spotPastOrderMatchesScreenPair(item, b, q));
  }, [filteredPastOrders, base_currency, quote_currency]);

  const filteredMyTrades = useMemo(() => {
    if (!spotMyTrades?.length) return [];
    const list =
      tradeHistorySideFilter === "All"
        ? [...spotMyTrades]
        : spotMyTrades.filter((t) => String(t?.side || "").toUpperCase() === tradeHistorySideFilter);
    return list.sort((a, b) => {
      const ta = Date.parse(a?.executed_at || a?.executedAt || a?.created_at || "") || 0;
      const tb = Date.parse(b?.executed_at || b?.executedAt || b?.created_at || "") || 0;
      return tb - ta;
    });
  }, [spotMyTrades, tradeHistorySideFilter]);

  const tradeHistoryKeyExtractor = useCallback((item, idx) => {
    const id = item?._id ?? item?.trade_id ?? item?.id;
    const t = item?.executed_at ?? item?.executedAt ?? item?.created_at ?? item?.createdAt;
    const p = item?.price ?? item?.rate ?? item?.avg_price;
    return id ? `th_${id}` : `th_${t ?? "na"}_${p ?? "na"}_${idx}`;
  }, []);

  const tradeHistoryPreviewSlice = useMemo(
    () => filteredMyTrades.slice(0, 5),
    [filteredMyTrades],
  );

  const tradeHistorySectionNode = useMemo(() => {
    if (!filteredMyTrades?.length) {
      return (
        <View style={styles.noDataRow}>
          <FastImage
            source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
            resizeMode="contain"
            style={{ width: 80, height: 80 }}
          />
        </View>
      );
    }
    const baseHint = effectiveCurrency?.base_currency;
    const quoteHint = effectiveCurrency?.quote_currency;
    return (
      <>
        <View style={styles.scrollContent}>
          {tradeHistoryPreviewSlice.map((item, index) => {
            const mLabel = tradeHistoryMarketLabel(item, baseHint, quoteHint);
            const baseSym = tradeHistoryBaseAsset(item, baseHint, quoteHint);
            const side = String(item?.side || "").toUpperCase();
            const role = item?.is_maker === true ? "Maker" : item?.is_maker === false ? "Taker" : "—";
            const sideColor = side === "BUY" ? themeColors.green : themeColors.red;
            const ts = item?.executed_at || item?.executedAt || item?.created_at;
            const m = moment(ts);
            const dateStr = m.isValid() ? m.format("DD/MM/YYYY") : "—";
            const timeStr = m.isValid() ? m.format("HH:mm:ss") : "—";

            return (
              <TouchableOpacity
                key={tradeHistoryKeyExtractor(item, index)}
                activeOpacity={0.85}
                onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item })}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 0,
                  borderBottomWidth: 1,
                  borderBottomColor: themeColors.themeBorderColor,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                  <AppText style={{ color: themeColors.text, fontSize: 14 }} weight={MEDIUM}>
                    {mLabel}
                  </AppText>
                  <FastImage
                    source={right_ic}
                    style={{ width: 11, height: 11, marginLeft: 4 }}
                    resizeMode="contain"
                    tintColor={themeColors.secondaryText}
                  />
                </View>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12, marginBottom: 2 }}>
                  {dateStr} {timeStr}
                </AppText>
                <AppText style={{ color: sideColor, fontSize: 13, marginBottom: 12 }} weight={MEDIUM}>
                  {side} · {role}
                </AppText>

                <View style={styles.kvRow}>
                  <AppText style={[styles.kvK, { color: themeColors.secondaryText, fontSize: 11 }]}>Date</AppText>
                  <AppText style={[styles.kvV, { color: themeColors.text, fontSize: 11, textAlign: "right" }]}>
                    {dateStr}
                  </AppText>
                </View>
                <View style={styles.kvRow}>
                  <AppText style={[styles.kvK, { color: themeColors.secondaryText, fontSize: 11 }]}>Time</AppText>
                  <AppText style={[styles.kvV, { color: themeColors.text, fontSize: 11, textAlign: "right" }]}>
                    {timeStr}
                  </AppText>
                </View>
                <View style={styles.kvRow}>
                  <AppText style={[styles.kvK, { color: themeColors.secondaryText, fontSize: 11 }]}>Pair</AppText>
                  <AppText style={[styles.kvV, { color: themeColors.text, fontSize: 11, textAlign: "right" }]}>
                    {mLabel}
                  </AppText>
                </View>
                <View style={styles.kvRow}>
                  <AppText style={[styles.kvK, { color: themeColors.secondaryText, fontSize: 11 }]}>Side</AppText>
                  <AppText style={[styles.kvV, { color: sideColor, fontSize: 11, textAlign: "right" }]}>{side}</AppText>
                </View>
                <View style={styles.kvRow}>
                  <AppText style={[styles.kvK, { color: themeColors.secondaryText, fontSize: 11 }]}>Role</AppText>
                  <AppText style={[styles.kvV, { color: themeColors.text, fontSize: 11, textAlign: "right" }]}>
                    {role}
                  </AppText>
                </View>
                <View style={styles.kvRow}>
                  <AppText style={[styles.kvK, { color: themeColors.secondaryText, fontSize: 11 }]}>Price</AppText>
                  <AppText style={[styles.kvV, { color: themeColors.text, fontSize: 11, textAlign: "right" }]}>
                    {safeToFixed8(item?.price, "—")}
                  </AppText>
                </View>
                <View style={styles.kvRow}>
                  <AppText style={[styles.kvK, { color: themeColors.secondaryText, fontSize: 11 }]}>Quantity</AppText>
                  <AppText style={[styles.kvV, { color: themeColors.text, fontSize: 11, textAlign: "right" }]}>
                    {safeToFixed8(item?.quantity, "—")} {baseSym}
                  </AppText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {filteredMyTrades?.length > 5 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => NavigationService.navigate("Trade_History", { activeTab: 1 })}
          >
            <AppText style={[styles.viewAllText, { color: colors.buttonBg }]}>View More</AppText>
          </TouchableOpacity>
        )}
      </>
    );
  }, [
    filteredMyTrades,
    tradeHistoryPreviewSlice,
    tradeHistoryKeyExtractor,
    isDark,
    themeColors,
    effectiveCurrency?.base_currency,
    effectiveCurrency?.quote_currency,
    styles.scrollContent,
    styles.kvRow,
    styles.kvK,
    styles.kvV,
    styles.viewAllButton,
    styles.viewAllText,
    styles.noDataRow,
    colors.buttonBg,
  ]);

  /** Same UI as `tradeHistorySectionNode`; kept for any `{renderTradeHistorySection()}` call sites / bundles. */
  const renderTradeHistorySection = useCallback(
    () => tradeHistorySectionNode,
    [tradeHistorySectionNode],
  );

  // Total: when amount is 0/empty show same default price as Limit field; else amount * price
  const totalDisplayValue = useMemo(() => {
    const amt = (amount === "" || amount === undefined) ? 0 : (Number(amount) || 0);
    const effectivePrice = !isMarketLikeOrder
      ? (Number(price) || Number(buy_price) || 0)
      : (Number(buy_price) || 0);
    return amt * effectivePrice;
  }, [amount, price, buy_price, isMarketLikeOrder]);

  // Stable slice references for FlatList data (avoid new array on every render)
  const openOrdersSlice = useMemo(() => filteredOpenOrders.slice(0, 5), [filteredOpenOrders]);
  const pastOrdersSlice = useMemo(() => (pastOrdersForSpotPair ?? []).slice(0, 5), [pastOrdersForSpotPair]);

  // Estimated height for order cards (variable due to expand) - improves scroll perf when getItemLayout not used
  const ORDER_CARD_ESTIMATED_HEIGHT = 380;
  // Height per card so 3 cards fit fully without cutting the last one (card content + margins + Cancel button)
  const ORDER_CARD_HEIGHT_FOR_CONTAINER = 420;

  // Memoized empty list components so FlatList doesn't recreate on every render
  const openOrdersListEmptyComponent = useMemo(
    () => (
      <View style={styles.noDataRow}>
        <FastImage
          source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
          resizeMode="contain"
          style={{ width: 80, height: 80 }}
        />
        {/* <AppText style={[styles.noDataText, { color: theme !== "Dark" ? colors.textGray : colors.descText }]}>
          No Open Orders
        </AppText> */}
      </View>
    ),
    [isDark, theme]
  );
  const orderHistoryListEmptyComponent = useMemo(
    () => (
      <View style={styles.noDataRow}>
        <FastImage
          source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
          resizeMode="contain"
          style={{ width: 80, height: 80 }}
        />
      </View>
    ),
    [isDark, theme]
  );

  // Format date like "27/11/2025, 11:08 PM"
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return "---";
    return moment(dateString).format("DD/MM/YYYY, hh:mm A");
  }, []);

  // Get status color
  const getStatusColor = useCallback((status) => {
    if (status === "COMPLETE" || status === "Completed" || status === "FILLED" || status === "EXECUTED") {
      return themeColors.green;
    }
    if (status === "PENDING" || status === "OPEN") {
      return themeColors.yellow || "#FFD700";
    }
    if (status === "CANCELLED" || status === "CANCELED") {
      return themeColors.secondaryText;
    }
    return themeColors.green;
  }, [themeColors]);

  // Get side color
  const getSideColor = useCallback((side) => {
    if (side === "BUY" || side === "buy") {
      return themeColors.green;
    }
    if (side === "SELL" || side === "sell") {
      return themeColors.red;
    }
    return themeColors.text;
  }, [themeColors]);

  /** Open orders preview — matches detail header + Date…Price only; pair row → full detail; Cancel unchanged. */
  const renderOpenOrderItem = useCallback(({ item: inv }) => {
    const currencyPair = buildCurrencyPairText(inv);
    const statusRaw = getOrderStatusRaw(inv);
    const statusUpper = String(statusRaw || "").toUpperCase().trim();
    const orderId = inv?._id || inv?.id;
    const canCancel =
      !!orderId &&
      !["FILLED", "CANCELLED", "CANCELED", "COMPLETED", "EXECUTED", "REJECTED"].includes(statusUpper);

    const priceNum = Number(inv?.price) || 0;
    const typeUpper = String(inv?.order_type || inv?.type || inv?.orderType || "MARKET").toUpperCase();
    const side = String(inv?.side || "").toUpperCase();

    const eventTs =
      inv?.updatedAt || inv?.updated_at || inv?.createdAt || inv?.created_at || inv?.date || inv?.timestamp;
    const eventM = eventTs ? moment(eventTs) : null;
    const dateStr = eventM?.isValid() ? eventM.format("DD/MM/YYYY") : "---";
    const timeStr = eventM?.isValid() ? eventM.format("HH:mm:ss") : "---";
    const headerDateTime = eventM?.isValid() ? eventM.format("DD/MM/YYYY HH:mm:ss") : "---";

    const rawTif = inv?.time_in_force ?? inv?.tif ?? inv?.timeInForce;
    const tifStr =
      rawTif != null && String(rawTif).trim() !== "" ? String(rawTif).trim().toUpperCase() : "—";

    const priceDisplay =
      String(inv?.order_type || inv?.type || "").toUpperCase() === "MARKET" ? "Market" : toFixedEight(priceNum);

    const textColor = themeColors.text;
    const labelColor = themeColors.secondaryText;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item: inv })}
        style={[styles.openOrderCard, { backgroundColor: themeColors.background }]}
      >
        <View>
          <View style={styles.openOrderTopRow}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item: inv })}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <AppText style={[styles.openOrderCardTitle, { color: textColor, fontSize: 14 }]} weight={MEDIUM}>
                  {currencyPair}
                </AppText>
                <FastImage
                  source={right_ic}
                  style={{ width: 12, height: 12 }}
                  resizeMode="contain"
                  tintColor={labelColor}
                />
              </TouchableOpacity>
              <AppText style={{ color: labelColor, fontSize: 11, marginTop: 4 }}>{headerDateTime}</AppText>
              <AppText style={{ color: getSideColor(inv?.side), fontSize: 12, marginTop: 4 }} weight={MEDIUM}>
                {side} · {typeUpper}
              </AppText>
            </View>
          </View>

          <View style={styles.kvRow}>
            <AppText style={[styles.kvK, { color: labelColor }]}>Date</AppText>
            <AppText style={[styles.kvV, { color: textColor }]}>{dateStr}</AppText>
          </View>
          <View style={styles.kvRow}>
            <AppText style={[styles.kvK, { color: labelColor }]}>Time</AppText>
            <AppText style={[styles.kvV, { color: textColor }]}>{timeStr}</AppText>
          </View>
          <View style={styles.kvRow}>
            <AppText style={[styles.kvK, { color: labelColor }]}>Market</AppText>
            <AppText style={[styles.kvV, { color: textColor }]}>{currencyPair}</AppText>
          </View>
          <View style={styles.kvRow}>
            <AppText style={[styles.kvK, { color: labelColor }]}>Side</AppText>
            <AppText style={[styles.kvV, { color: getSideColor(inv?.side) }]}>{side || "—"}</AppText>
          </View>
          <View style={styles.kvRow}>
            <AppText style={[styles.kvK, { color: labelColor }]}>Type</AppText>
            <AppText style={[styles.kvV, { color: textColor }]}>{typeUpper}</AppText>
          </View>
          <View style={styles.kvRow}>
            <AppText style={[styles.kvK, { color: labelColor }]}>TIF</AppText>
            <AppText style={[styles.kvV, { color: textColor }]}>{tifStr}</AppText>
          </View>
          <View style={styles.kvRow}>
            <AppText style={[styles.kvK, { color: labelColor }]}>Price</AppText>
            <AppText style={[styles.kvV, { color: textColor }]}>{priceDisplay}</AppText>
          </View>
        </View>

        {canCancel ? (
          <View style={[styles.openOrderCardRow, { marginTop: 8 }]}>
            <AppText style={[styles.openOrderCardLabel, { color: labelColor }]}>Action:</AppText>
            <TouchableOpacity
              style={styles.cancelActionBtn}
              activeOpacity={0.8}
              onPress={() => {
                setOrderToCancel(inv);
                setIsCancelModalVisible(true);
              }}
            >
              <AppText style={{ color: themeColors.red, fontWeight: "600", fontSize: 13 }}>Cancel</AppText>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={[styles.openOrderCardDivider, { backgroundColor: themeColors.themeBorderColor }]} />
      </TouchableOpacity>
    );
  }, [themeColors, buildCurrencyPairText, getOrderStatusRaw, getSideColor]);

  // Memoized render function for past orders - same card UI as Open Orders; tap → SPOT_ORDER_HISTORY_DETAIL with full order data
  const renderPastOrderItem = useCallback(({ item: inv, index: idx }) => {
    const orderId = inv?._id || inv?.order_id || inv?.id;
    const baseSym = inv?.ask_currency || inv?.base_currency || base_currency || "";
    const quoteSym = inv?.pay_currency || inv?.quote_currency || quote_currency || "";
    const currencyPair = (baseSym && quoteSym) ? `${baseSym}/${quoteSym}` : buildCurrencyPairText(inv);
    const quoteCc =
      normalizePairSymbol(inv?.pay_currency) ||
      normalizePairSymbol(inv?.fee_asset) ||
      normalizePairSymbol(quote_currency);


    const fillPercent = (() => {
      const fp = inv?.fill_percent;
      if (fp == null || String(fp).trim() === "") return "—";
      const s = String(fp).trim();
      return s.endsWith("%") ? s : `${s}%`;
    })();

    const execValue = Number(inv?.executed_value ?? inv?.executedValue ?? inv?.quote ?? 0);
    const fee = inv?.total_fee ?? inv?.fee;
    const tds = inv?.total_tds ?? inv?.tds;

    const statusRaw = getOrderStatusRaw(inv);
    const statusLabel = getOrderStatusLabel(inv);

    const hasExecutedTrades = Array.isArray(inv?.executed_prices) && inv.executed_prices.length > 0;
    const showTrades = !!showExecutedTrades?.[orderId];

    const textColor = themeColors.text;
    const labelColor = themeColors.secondaryText;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item: inv })}
        style={[styles.openOrderCard, { backgroundColor: themeColors.background }]}
      >
        <View>
          <View style={styles.openOrderTopRow}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item: inv })}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <AppText style={[styles.openOrderCardTitle, { color: textColor, fontSize: 14, }]} weight={MEDIUM}>{currencyPair}</AppText>
                <FastImage source={right_ic} style={{ width: 12, height: 12, }} resizeMode="contain" tintColor={labelColor} />
              </TouchableOpacity>
              <AppText style={{ color: labelColor, fontSize: 11, marginTop: 4 }}>
                {(() => {
                  const d = inv?.updatedAt || inv?.updated_at || inv?.createdAt || inv?.created_at || inv?.date || inv?.timestamp || inv?.time;
                  return d ? moment(d).format("DD/MM/YYYY HH:mm:ss") : "---";
                })()}
              </AppText>

              <AppText style={{ color: getSideColor(inv?.side), fontSize: 12, marginTop: 4 }} weight={MEDIUM}>
                {String(inv?.side || "").toUpperCase()} · {String(inv?.order_type || inv?.type || inv?.orderType || "").toUpperCase()}
              </AppText>
            </View>
          </View>

          {(() => {
            const d = inv?.updatedAt || inv?.updated_at || inv?.createdAt || inv?.created_at || inv?.date || inv?.timestamp || inv?.time;
            return (
              <>
                <View style={styles.kvRow}>
                  <AppText style={[styles.kvK, { color: labelColor }]}>Date</AppText>
                  <AppText style={[styles.kvV, { color: textColor }]}>{d ? moment(d).format("DD/MM/YYYY") : "---"}</AppText>
                </View>
                <View style={styles.kvRow}>
                  <AppText style={[styles.kvK, { color: labelColor }]}>Time</AppText>
                  <AppText style={[styles.kvV, { color: textColor }]}>{d ? moment(d).format("HH:mm:ss") : "---"}</AppText>
                </View>
              </>
            );
          })()}
          <View style={styles.kvRow}><AppText style={[styles.kvK, { color: labelColor }]}>Market</AppText><AppText style={[styles.kvV, { color: textColor }]}>{currencyPair}</AppText></View>
          <View style={styles.kvRow}><AppText style={[styles.kvK, { color: labelColor }]}>Side</AppText><AppText style={[styles.kvV, { color: getSideColor(inv?.side) }]}>{String(inv?.side || "---").toUpperCase()}</AppText></View>
          <View style={styles.kvRow}><AppText style={[styles.kvK, { color: labelColor }]}>Type</AppText><AppText style={[styles.kvV, { color: textColor }]}>{String(inv?.order_type || inv?.type || inv?.orderType || "Market").toUpperCase()}</AppText></View>
          <View style={styles.kvRow}><AppText style={[styles.kvK, { color: labelColor }]}>TIF</AppText><AppText style={[styles.kvV, { color: textColor }]}>{inv?.time_in_force || inv?.tif || "—"}</AppText></View>
          <View style={styles.kvRow}>
            <AppText style={[styles.kvK, { color: labelColor }]}>Price</AppText>
            <AppText style={[styles.kvV, { color: textColor }]}>
              {String(inv?.order_type || inv?.type || "").toUpperCase() === "MARKET" ? "Market" : toFixedEight(inv?.price || 0)}
            </AppText>
          </View>
        </View>

        {hasExecutedTrades && (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.execTradesBtn}
              onPress={() => setShowExecutedTrades((p) => ({ ...p, [orderId]: !p?.[orderId] }))}
            >
              <View style={styles.execTradesBtnRow}>
                <FastImage
                  source={downIcon}
                  tintColor={colors.lightGrey}
                  style={[
                    styles.orderHistoryChevron,
                    { transform: [{ rotate: showTrades ? "180deg" : "0deg" }] },
                  ]}
                  resizeMode="contain"
                />
                <AppText style={[styles.execTradesBtnText, { color: textColor }]}> Executed trades</AppText>
              </View>
            </TouchableOpacity>

            {showTrades && (
              <View style={styles.execTradesBox}>
                {inv.executed_prices.map((tr, i) => (
                  <View
                    key={`${orderId}_${tr?.trade_id ?? i}`}
                    style={[
                      styles.execTradeItem,
                      i === inv.executed_prices.length - 1 ? { borderBottomWidth: 0, marginBottom: 0 } : null,
                    ]}
                  >
                    <View style={styles.execTradeHeaderRow}>
                      <AppText style={[styles.execTradeHeaderText, { color: labelColor }]} weight={MEDIUM}>
                        Trade #{i + 1}
                      </AppText>
                    </View>

                    <View style={styles.execTradeKvRow}>
                      <AppText style={[styles.execTradeKvK, { color: labelColor }]}>Price:</AppText>
                      <AppText style={[styles.execTradeKvV, { color: textColor }]}>{toFixedEight(Number(tr?.price) || 0)} {quoteCc}</AppText>
                    </View>
                    <View style={styles.execTradeKvRow}>
                      <AppText style={[styles.execTradeKvK, { color: labelColor }]}>Executed:</AppText>
                      <AppText style={[styles.execTradeKvV, { color: textColor }]}>{toFixedEight(Number(tr?.quantity) || 0)} {baseSym}</AppText>
                    </View>
                    <View style={styles.execTradeKvRow}>
                      <AppText style={[styles.execTradeKvK, { color: labelColor }]}>Fee:</AppText>
                      <AppText style={[styles.execTradeKvV, { color: textColor }]}>{toFixedEight(Number(tr?.fee) || 0)} {quoteCc}</AppText>
                    </View>
                    <View style={styles.execTradeKvRow}>
                      <AppText style={[styles.execTradeKvK, { color: labelColor }]}>Total:</AppText>
                      <AppText style={[styles.execTradeKvV, { color: textColor }]}>{toFixedEight((Number(tr?.price) || 0) * (Number(tr?.quantity) || 0))}</AppText>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={[styles.openOrderCardDivider, { backgroundColor: themeColors.themeBorderColor }]} />
      </TouchableOpacity>
    );
  }, [themeColors, buildCurrencyPairText, getBaseCoinIconUri, getOrderStatusRaw, showExecutedTrades, getSideColor]);

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: themeColors.background },
        ]}
      >
        <>
          <SpotHeader
            title={`${base_currency ?? effectiveCurrency?.base_currency ?? "-"}/${quote_currency ?? effectiveCurrency?.quote_currency ?? "-"}`}
            setCurrency={handleCurrencyChange}
            change={change_percentage}
            isDark={isDark}
            pairLoading={pairHeaderLoading}
            onCandlePress={handleCandlePress}
            onTrendPress={() => NavigationService.navigate(MARKET_SCREEN)}
            onBackPress={() => navigation.goBack()}
          />

          <View style={styles.secondcontainer}>
            {/* Left: Order book (ratio + controls inside). */}
            <View style={styles.leftPanel}>
              <OrderBookSection
                styles={styles}
                buy_price={buy_price}
                change_percentage={change_percentage}
                quote_currency={quote_currency}
                base_currency={base_currency}
                orderBookReady={orderBookReady}
                showOrderBookSkeleton={showOrderBookSkeleton}
                onOrderBookPress={handleOrderBookClick}
                formatPrice={formatPrice}
                formatQuantity={formatQuantity}
                tickSize={currencyData?.tick_size ?? spotSelectedPair?.tick_size ?? 0.01}
                pairResetKey={`${base_currency_id ?? ""}_${quote_currency_id ?? ""}`}
              />
            </View>

            {/* Right: Buy/Sell + fields */}
            <View style={styles.rightPanel}>

              <View
                style={[
                  styles.tabContainer,
                  {
                    borderWidth: 0.5,
                    borderColor: themeColors.themeBorderColor,
                    borderRadius: 8,
                    overflow: "hidden",
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => { setTab("Buy"); setIsBuy(true); }}
                  style={{ flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "center", paddingVertical: 15 }}
                >
                  <ImageBackground
                    source={trade_btn}
                    tintColor={tab === "Buy" ? (themeColors.spotTradeBuy ?? colors.spotTradeBuy) : themeColors.background}
                    resizeMode="stretch"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AppText weight={SEMI_BOLD} style={[styles.tabText, { color: tab === "Buy" ? colors.white : themeColors.secondaryText }]}>Buy</AppText>
                  </ImageBackground>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => { setTab("Sell"); setIsBuy(false); }}
                  style={{ flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "center", paddingVertical: 15 }}
                >
                  <ImageBackground
                    source={trade_btn}
                    tintColor={tab === "Sell" ? (themeColors.spotTradeSell ?? colors.spotTradeSell) : themeColors.background}
                    resizeMode="stretch"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      transform: [{ rotate: "180deg" }],
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AppText weight={SEMI_BOLD} style={[styles.tabText, {
                      color: tab === "Sell" ? themeColors.textOnButton : themeColors.secondaryText,
                      transform: [{ rotate: '180deg' }]
                    }]}>Sell</AppText>
                  </ImageBackground>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.dropdown,
                    {
                      backgroundColor: themeColors.input,
                      flex: 1,
                      borderRadius: 8,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: themeColors.themeBorderColor,
                    },
                  ]}
                  onPress={() => rbSheetlimit?.current?.open()}
                >
                  <FastImage
                    source={INFO}
                    style={{ height: 12, width: 12 }}
                    resizeMode="contain"
                    tintColor={themeColors.secondaryText}
                  />
                  <AppText
                    style={[styles.dropdownText, { color: themeColors.text, flex: 1, textAlign: "center" }]}
                    numberOfLines={1}
                  >
                    {numberSelectLimit}
                  </AppText>
                  <FastImage
                    source={downIcon}
                    resizeMode="contain"
                    style={{ width: 9, height: 9 }}
                    tintColor={themeColors.secondaryText}
                  />
                </TouchableOpacity>
              </View>

              {/* Price field (web parity)
                    - LIMIT / STOP_LIMIT: editable + stepper
                    - MARKET / STOP_MARKET: readonly "Best Market Price" */}
              <View style={styles.spotOrderInputBlock}>
                <View
                  style={[
                    styles.spotOrderFieldCard,
                    styles.spotOrderFieldCardDense,
                    {
                      backgroundColor: themeColors.input,
                      borderColor: themeColors.themeBorderColor,
                    },
                  ]}
                >
                  <View style={styles.spotOrderFieldStack}>
                      <Animated.Text
                        style={[
                          styles.spotOrderInputLabel,
                          {
                            position: "absolute",
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            top: priceAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [9, 1],
                            }),
                            fontSize: priceAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [9, 7],
                            }),
                            lineHeight: priceAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [12, 9],
                            }),
                            color: themeColors.secondaryText,
                          },
                        ]}
                      >
                        Price ({quote_currency})
                      </Animated.Text>

                      {isLimit ? (
                        <Animated.View
                          style={[
                            styles.spotOrderInputBox,
                            styles.spotOrderInputBoxDense,
                            {
                              backgroundColor: "transparent",
                              paddingHorizontal: 0,
                              paddingVertical: 0,
                              marginTop: priceAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [15, 4],
                              }),
                            },
                          ]}
                        >
                          <TouchableOpacity
                            onPress={() => handlePriceStep(-1)}
                            style={[styles.spotOrderStepBtn, styles.spotOrderStepBtnSpotPair]}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                          >
                            <AppText style={[styles.spotOrderStepBtnText, styles.spotOrderStepBtnTextDense, { color: themeColors.secondaryText }]}>−</AppText>
                          </TouchableOpacity>
                          <TextInput
                            placeholder={""}
                            placeholderTextColor={themeColors.secondaryText}
                            selectionColor={inputSelectionColor}
                            value={price || formatTotal(buy_price)}
                            onChangeText={(text) => handlePriceInput(text, setPrice)}
                            onBlur={() => {
                              setIsPriceFocused(false);
                              handlePriceBlur(price, setPrice);
                            }}
                            onFocus={() => setIsPriceFocused(true)}
                            keyboardType="numeric"
                            style={[
                              styles.spotOrderInputValue,
                              styles.spotOrderInputValueDense,
                              {
                                top:2,
                                color: themeColors.text,
                                textAlign: "center",
                                textAlignVertical: "center",
                                ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                              },
                            ]}
                            editable
                          />
                          <TouchableOpacity
                            onPress={() => handlePriceStep(1)}
                            style={[styles.spotOrderStepBtn, styles.spotOrderStepBtnSpotPair]}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                          >
                            <AppText style={[styles.spotOrderStepBtnText, styles.spotOrderStepBtnTextDense, { color: themeColors.secondaryText }]}>+</AppText>
                          </TouchableOpacity>
                        </Animated.View>
                      ) : (
                        <Animated.View
                          style={{
                            width: "100%",
                            minHeight: 18,
                            justifyContent: "center",
                            alignItems: "center",
                            marginTop: priceAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [15, 4],
                            }),
                          }}
                        >
                          <AppText style={[styles.spotOrderInputValue, styles.spotOrderInputValueDense, { color: themeColors.secondaryText }]}>
                            ---Best Market Price---
                          </AppText>
                        </Animated.View>
                      )}
                    </View>
                  </View>
                </View>

              {showStopPriceField && (
                <View style={styles.spotOrderInputBlock}>
                  <View
                    style={[
                      styles.spotOrderFieldCard,
                      isStopFocused || String(stopPrice ?? "").trim() !== ""
                        ? styles.spotOrderFieldCardDense
                        : styles.spotOrderFieldCardTight,
                      {
                        backgroundColor: themeColors.input,
                        borderColor: themeColors.themeBorderColor,
                      },
                    ]}
                  >
                    <View style={styles.spotOrderFieldStack}>
                      {isStopFocused || String(stopPrice ?? "").trim() !== "" ? (
                        <Animated.Text
                          style={[
                            styles.spotOrderInputLabel,
                            {
                              position: "absolute",
                              left: 0,
                              right: 0,
                              textAlign: "center",
                              top: stopAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [9, 1],
                              }),
                              fontSize: stopAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [9, 7],
                              }),
                              lineHeight: stopAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [12, 9],
                              }),
                              color: themeColors.secondaryText,
                            },
                          ]}
                        >
                          Stop ({quote_currency})
                        </Animated.Text>
                      ) : null}
                      <Animated.View
                        style={[
                          styles.spotOrderInputBox,
                          styles.spotOrderInputBoxDense,
                          {
                            backgroundColor: "transparent",
                            paddingHorizontal: 0,
                            paddingVertical: 0,
                            marginTop: stopAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 4],
                            }),
                          },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => handleStopPriceStep(-1)}
                          style={[styles.spotOrderStepBtn, styles.spotOrderStepBtnSpotPair]}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <AppText style={[styles.spotOrderStepBtnText, styles.spotOrderStepBtnTextDense, { color: themeColors.secondaryText }]}>−</AppText>
                        </TouchableOpacity>
                        <TextInput
                          placeholder={""}
                          placeholderTextColor={themeColors.secondaryText}
                          selectionColor={inputSelectionColor}
                          value={stopPrice}
                          onChangeText={(text) => handlePriceInput(text, setStopPrice)}
                          onBlur={() => {
                            setIsStopFocused(false);
                            handlePriceBlur(stopPrice, setStopPrice);
                          }}
                          onFocus={() => setIsStopFocused(true)}
                          keyboardType="numeric"
                          style={[
                            styles.spotOrderInputValue,
                            styles.spotOrderInputValueDense,
                            {
                              color:
                                !isStopFocused && String(stopPrice ?? "").trim() === ""
                                  ? "transparent"
                                  : themeColors.text,
                              textAlign: "center",
                              textAlignVertical: "center",
                              ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                            },
                          ]}
                        />
                        <TouchableOpacity
                          onPress={() => handleStopPriceStep(1)}
                          style={[styles.spotOrderStepBtn, styles.spotOrderStepBtnSpotPair]}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <AppText style={[styles.spotOrderStepBtnText, styles.spotOrderStepBtnTextDense, { color: themeColors.secondaryText }]}>+</AppText>
                        </TouchableOpacity>
                      </Animated.View>
                      {!isStopFocused && String(stopPrice ?? "").trim() === "" ? (
                        <View pointerEvents="none" style={styles.spotOrderAmountEmptyOverlay}>
                          <AppText
                            style={[
                              styles.spotOrderInputLabel,
                              { color: themeColors.secondaryText, textAlign: "center" },
                            ]}
                          >
                            Stop ({quote_currency})
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.spotOrderInputBlock}>
                <View
                  style={[
                    styles.spotOrderFieldCard,
                    isAmountFocused || String(amount ?? "").trim() !== ""
                      ? styles.spotOrderFieldCardDense
                      : styles.spotOrderFieldCardTight,
                    {
                      backgroundColor: themeColors.input,
                      borderColor: themeColors.themeBorderColor,
                    },
                  ]}
                >
                  <View style={styles.spotOrderFieldStack}>
                    {isAmountFocused || String(amount ?? "").trim() !== "" ? (
                      <Animated.Text
                        style={[
                          styles.spotOrderInputLabel,
                          {
                            position: "absolute",
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            top: amountAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [9, 1],
                            }),
                            fontSize: amountAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [9, 7],
                            }),
                            lineHeight: amountAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [12, 9],
                            }),
                            color: themeColors.secondaryText,
                          },
                        ]}
                      >
                        Amount ({base_currency})
                      </Animated.Text>
                    ) : null}
                    <Animated.View
                      style={[
                        styles.spotOrderInputBox,
                        styles.spotOrderInputBoxDense,
                        {
                          backgroundColor: "transparent",
                          paddingHorizontal: 0,
                          paddingVertical: 0,
                          marginTop: amountAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 4],
                          }),
                        },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => handleAmountStep(-1)}
                        style={[styles.spotOrderStepBtn, styles.spotOrderStepBtnSpotPair]}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <AppText style={[styles.spotOrderStepBtnText, styles.spotOrderStepBtnTextDense, { color: themeColors.secondaryText }]}>−</AppText>
                      </TouchableOpacity>
                      <TextInput
                        ref={amountInputRef}
                        placeholder={""}
                        placeholderTextColor={themeColors.secondaryText}
                        selectionColor={inputSelectionColor}
                        value={amount}
                        onChangeText={(text) => handleQty(text)}
                        onBlur={() => {
                          setIsAmountFocused(false);
                          handleQuantityBlur(amount, setAmount);
                        }}
                        onFocus={() => setIsAmountFocused(true)}
                        keyboardType="numeric"
                        style={[
                          styles.spotOrderInputValue,
                          styles.spotOrderInputValueDense,
                          {
                            color:
                              !isAmountFocused && String(amount ?? "").trim() === ""
                                ? "transparent"
                                : themeColors.text,
                            textAlign: "center",
                            textAlignVertical: "center",
                            ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                          },
                        ]}
                      />
                      <TouchableOpacity
                        onPress={() => handleAmountStep(1)}
                        style={[styles.spotOrderStepBtn, styles.spotOrderStepBtnSpotPair]}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <AppText style={[styles.spotOrderStepBtnText, styles.spotOrderStepBtnTextDense, { color: themeColors.secondaryText }]}>+</AppText>
                      </TouchableOpacity>
                    </Animated.View>
                    {!isAmountFocused && String(amount ?? "").trim() === "" ? (
                      <View pointerEvents="none" style={styles.spotOrderAmountEmptyOverlay}>
                        <AppText
                          style={[
                            styles.spotOrderInputLabel,
                            { color: themeColors.secondaryText, textAlign: "center" },
                          ]}
                        >
                          Amount ({base_currency})
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
              <View style={styles.spotOrderSliderWrap}>
                <PercentQuickSelect
                  activeValue={activePercentage}
                  onSelect={handleTotalPercentage}
                  theme={theme}
                />
              </View>

              {spotOrderType === "LIMIT" ? (
                <View style={styles.spotOrderInputBlock}>
                  <View
                    style={[
                      styles.spotOrderFieldCard,
                      String(amount ?? "").trim() !== ""
                        ? styles.spotOrderFieldCardDense
                        : styles.spotOrderFieldCardTight,
                      {
                        backgroundColor: themeColors.input,
                        borderColor: themeColors.themeBorderColor,
                      },
                    ]}
                  >
                    {String(amount ?? "").trim() === "" ? (
                      <View style={styles.spotOrderTotalEmptyInner}>
                        <AppText
                          style={[
                            styles.spotOrderInputLabel,
                            { color: themeColors.secondaryText, textAlign: "center" },
                          ]}
                        >
                          Total ({quote_currency})
                        </AppText>
                      </View>
                    ) : (
                      <View style={styles.spotOrderFieldStack}>
                        <Animated.Text
                          style={[
                            styles.spotOrderInputLabel,
                            {
                              position: "absolute",
                              left: 0,
                              right: 0,
                              textAlign: "center",
                              top: amountAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [9, 1],
                              }),
                              fontSize: amountAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [9, 7],
                              }),
                              lineHeight: amountAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [12, 9],
                              }),
                              color: themeColors.secondaryText,
                            },
                          ]}
                        >
                          Total ({quote_currency})
                        </Animated.Text>
                        <Animated.View
                          style={[
                            styles.spotOrderInputBox,
                            styles.spotOrderInputBoxDense,
                            {
                              backgroundColor: "transparent",
                              paddingHorizontal: 0,
                              paddingVertical: 0,
                              marginTop: amountAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 4],
                              }),
                            },
                          ]}
                        >
                          <View style={styles.spotOrderTotalSideSpacer} />
                          <TextInput
                            placeholder={""}
                            placeholderTextColor={themeColors.secondaryText}
                            selectionColor={inputSelectionColor}
                            value={amount ? formatTotal(totalDisplayValue) : ""}
                            keyboardType="numeric"
                            style={[
                              styles.spotOrderInputValue,
                              styles.spotOrderInputValueDense,
                              {
                                flex: 1,
                                color: themeColors.text,
                                textAlign: "center",
                                textAlignVertical: "center",
                                paddingVertical: 0,
                                ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                              },
                            ]}
                            editable={false}
                          />
                          <View style={styles.spotOrderTotalSideSpacer} />
                        </Animated.View>
                      </View>
                    )}
                  </View>
                </View>
              ) : null}
              {/* Web parity: IOC/FOK toggles are visible for Spot form footer.
                    API uses them only for LIMIT / STOP_LIMIT (we only send then), but UI stays consistent. */}
              <View style={styles.spotOrderTifRow}>
                <TouchableOpacity
                  onPress={() => {
                    setLimitIoc((v) => {
                      const next = !v;
                      if (next) setLimitFok(false);
                      return next;
                    });
                  }}
                  style={styles.spotOrderTifChip}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <View style={[styles.slippageCheckbox, { borderColor: themeColors.themeBorderColor }]}>
                    {limitIoc ? (
                      <FastImage source={checkIc} style={styles.slippageCheckIcon} resizeMode="contain" />
                    ) : null}
                  </View>
                  <AppText style={[styles.spotOrderTifText, { color: themeColors.text }]}>IOC</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setLimitFok((v) => {
                      const next = !v;
                      if (next) setLimitIoc(false);
                      return next;
                    });
                  }}
                  style={styles.spotOrderTifChip}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <View style={[styles.slippageCheckbox, { borderColor: themeColors.themeBorderColor }]}>
                    {limitFok ? (
                      <FastImage source={checkIc} style={styles.slippageCheckIcon} resizeMode="contain" />
                    ) : null}
                  </View>
                  <AppText style={[styles.spotOrderTifText, { color: themeColors.text }]}>FOK</AppText>
                </TouchableOpacity>
                {isMarketLikeOrder ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSlippageEnabled((v) => !v)}
                    style={styles.spotOrderTifChip}
                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  >
                    <View
                      style={[
                        styles.slippageCheckbox,
                        { borderColor: themeColors.themeBorderColor },
                      ]}
                    >
                      {slippageEnabled ? (
                        <FastImage source={checkIc} style={styles.slippageCheckIcon} resizeMode="contain" />
                      ) : null}
                    </View>
                    <AppText style={[styles.spotOrderTifText, { color: themeColors.text }]}>Slippage</AppText>
                  </TouchableOpacity>
                ) : null}
              </View>

              {isMarketLikeOrder && slippageEnabled ? (
                <View style={{ marginBottom: SPOT_ORDER_V_GAP }}>
                  <View style={styles.spotOrderInputBlock}>
                    <View
                      style={[
                        styles.spotOrderFieldCard,
                        styles.spotOrderFieldCardDense,
                        {
                          backgroundColor: themeColors.input,
                          borderColor: themeColors.themeBorderColor,
                        },
                      ]}
                    >
                      <View style={styles.spotOrderFieldStack}>
                        {/*
                          Web parity (TradeCenterSection): trade_amount_field_limit input-group,
                          placeholder only — no floating label / animation.
                        */}
                        <View
                          style={[
                            styles.spotOrderInputBox,
                            styles.spotOrderInputBoxDense,
                            {
                              backgroundColor: "transparent",
                              paddingHorizontal: 0,
                              paddingVertical: 0,
                              marginTop: 0,
                            },
                          ]}
                        >
                          <View style={styles.spotOrderTotalSideSpacer} />
                          <View style={styles.spotOrderSlippageInputShell}>
                            <TextInput
                              value={slippagePct}
                              onChangeText={(t) => setSlippagePct(String(t).replace(/[^0-9.]/g, ""))}
                              placeholder={isSlippageInputFocused ? "" : slippagePlaceholder}
                              placeholderTextColor={themeColors.secondaryText}
                              selectionColor={inputSelectionColor}
                              keyboardType="numeric"
                              textAlign="center"
                              accessibilityLabel="Slippage tolerance percent"
                              onFocus={() => setIsSlippageInputFocused(true)}
                              onBlur={() => setIsSlippageInputFocused(false)}
                              style={[
                                styles.spotOrderSlippageInput,
                                {
                                  color: themeColors.text,
                                  ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                                },
                              ]}
                            />
                            <View pointerEvents="none" style={styles.spotOrderSlippagePctWrap}>
                              <AppText style={[styles.spotOrderSlippagePctText, { color: themeColors.secondaryText }]}>
                                %
                              </AppText>
                            </View>
                          </View>
                          <View style={styles.spotOrderTotalSideSpacer} />
                        </View>
                      </View>
                    </View>
                  </View>
                  {slippageError ? (
                    <AppText style={[styles.spotOrderSlippageError, { color: themeColors.red }]}>
                      {slippageError}
                    </AppText>
                  ) : null}
                </View>
              ) : null}

              {/* Coin Info */}
              <View style={styles.assetBox}>
                <View style={styles.assetRow}>
                  <AppText
                    style={[
                      styles.assetLabel,
                      { color: themeColors.text },
                    ]}
                  >
                    Coin
                  </AppText>
                  <AppText
                    style={[
                      styles.assetLabel,
                      { color: themeColors.text },
                    ]}
                  >
                    Total Assets
                  </AppText>
                </View>
                <View style={styles.assetRow}>
                  <AppText style={[styles.assetValue, { color: themeColors.text }]}>{quote_currency}</AppText>
                  <AppText style={[styles.assetValue, { color: themeColors.text }]}>
                    {coinBalance?.quote_currency_balance || 0}
                  </AppText>
                </View>
                <View style={styles.assetRow}>
                  <AppText style={[styles.assetValue, { color: themeColors.text }]}>{base_currency}</AppText>
                  <AppText style={[styles.assetValue, { color: themeColors.text }]}>
                    {coinBalance?.base_currency_balance || 0}
                  </AppText>
                </View>

                <View style={styles.assetActionRow}>
                  {["Deposit", "Transfer", "Withdraw"].map((btn, i) => (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.75}
                      style={[
                        styles.assetActionBtn,
                        {
                          backgroundColor: themeColors.input,
                          borderColor: themeColors.themeBorderColor,
                        },
                      ]}
                      onPress={() =>
                        NavigationService.navigate(
                          btn == "Withdraw"
                            ? WALLET_WITHDRAW_SCREEN
                            : btn == "Deposit"
                              ? DEPOSIT_COIN_SCREEN
                              : TRANSFER_SCREEN
                        )
                      }
                    >
                      <AppText style={[styles.assetActionText, { color: themeColors.text }]}>{btn}</AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Buy Button */}
              <View style={styles.spotOrderSubmitWrap}>
                <Button
                  children={
                    isBuy
                      ? `Buy ${base_currency}`
                      : `Sell ${base_currency}`
                  }
                  disabled={!amount}
                  containerStyle={[
                    styles.spotOrderSubmitBtn,
                    {
                      backgroundColor: isBuy
                        ? (themeColors.spotTradeBuy ?? colors.spotTradeBuy)
                        : (themeColors.spotTradeSell ?? colors.spotTradeSell),
                    },
                  ]}
                  onPress={() => onSubmit()}
                  titleStyle={styles.spotOrderSubmitTitle}
                />
              </View>

              {/* Web TradeCenterSection: fees + staking row directly under Buy/Sell CTA */}
              <View style={styles.spotOrderFooterBelowCta}>
                <View style={styles.spotOrderFooterFeesRow}>
                  <AppText weight={SEMI_BOLD} style={[styles.spotOrderFooterFeeText, { color: themeColors.text }]}>
                    Maker {spotFooterMakerTakerPct.maker}%
                  </AppText>
                  <AppText weight={SEMI_BOLD} style={[styles.spotOrderFooterFeeText, { color: themeColors.text }]}>
                    Taker {spotFooterMakerTakerPct.taker}%
                  </AppText>
                </View>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => NavigationService.navigate(ACCOUNT_SCREEN)}
                  style={[
                    styles.spotOrderStakingCard,
                    {
                      borderColor: themeColors.themeBorderColor,
                      backgroundColor: themeColors.themeElevationColor,
                    },
                  ]}
                >
                  <AppText
                    weight={SEMI_BOLD}
                    numberOfLines={1}
                    style={[styles.spotOrderStakingAprText, { flex: 1 }]}
                  >
                    {base_currency || "BTC"} Staking Estimated APR: 2.45%
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </>

        {/* Bottom tabs: Open Orders / Order History / Trade History */}
        {(historyOnly || orderBookReady) && (
          <View
            style={{
              flexDirection: "row",
              marginTop: 6,
              alignItems: "center",
              marginHorizontal: 8,
            }}
          >
            <ScrollView
              ref={ordersBottomTabScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 8 }}
              style={{ flex: 1 }}
              onLayout={(e) => {
                ordersBottomTabBarWidthRef.current = e.nativeEvent.layout.width;
              }}
            >
              {[
                { id: 1, label: "Open Orders" },
                { id: 2, label: "Order History" },
                { id: 3, label: "Trade History" },
              ].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.8}
                  onLayout={(e) => {
                    const { x, width } = e.nativeEvent.layout;
                    ordersBottomTabItemLayoutRef.current[t.id] = { x, width };
                  }}
                  onPress={() => handleSpotOrdersPrimaryTab(t.id)}
                  style={{ alignItems: "center", minHeight: 28, justifyContent: "center", paddingHorizontal: 2 }}
                >
                  <AppText
                    numberOfLines={1}
                    style={{
                      color: activeTab === t.id ? themeColors.text : themeColors.secondaryText,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {t.label}
                    {typeof t.count === "number" && t.count > 0 ? ` (${t.count})` : ""}
                  </AppText>
                  <View
                    style={{
                      minWidth: 24,
                      height: 2,
                      marginTop: 2,
                      backgroundColor: activeTab === t.id ? colors.buttonBg : "transparent",
                      borderRadius: 1,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bottom tabs: ek hi panel — Order History / Trade History data web jaisi APIs se (`me/orders/history`, `me/trades`). */}
        {(historyOnly || orderBookReady) && (
          <View style={styles.ordersTabContentWrapper}>
            <Animated.View style={{ transform: [{ translateX: ordersTabsAnimX }] }}>
              {mountedOrdersTab === 1 ? (
                <View style={styles.ordersTabPanel}>
                  {/* existing Open Orders panel */}
                  <View style={{ marginBottom: 4, paddingHorizontal: 2 }}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingVertical: 2,
                        paddingRight: 14,
                      }}
                    >
                      {SPOT_OPEN_ORDER_KINDS.map((k) => {
                        const active = openOrderKindTab === k.id;
                        return (
                          <TouchableOpacity
                            key={k.id}
                            activeOpacity={0.85}
                            onPress={() => setOpenOrderKindTab(k.id)}
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                              borderWidth: active ? 1 : 0,
                              borderColor: active ? themeColors.themeBorderColor : "transparent",
                              backgroundColor: active ? themeColors.input : "transparent",
                            }}
                          >
                            <AppText
                              style={{
                                fontSize: 11,
                                color: active ? themeColors.text : themeColors.secondaryText,
                                fontWeight: active ? "600" : "500",
                              }}
                            >
                              {k.label}
                            </AppText>
                          </TouchableOpacity>
                        );
                      })}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 2, alignSelf: "flex-start" }}>
                        <View style={{ width: 102 }}>
                          <CustomDropdown
                            compact
                            data={SPOT_SIDE_DROPDOWN_LABELS}
                            selected={spotDropdownLabelFromSideFilter(orderFilter)}
                            onSelect={(label) => setOrderFilter(spotSideFilterFromDropdownLabel(label))}
                          />
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            setOpenOrderKindTab("all");
                            setOrderFilter("All");
                          }}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            paddingVertical: 4,
                            paddingLeft: 4,
                            marginLeft: 2,
                          }}
                        >
                          <FastImage source={Refresh} style={{ width: 12, height: 12 }} resizeMode="contain" />
                          <AppText style={{ fontSize: 13, color: themeColors.secondaryText }}>Reset</AppText>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>

                  {filteredOpenOrders?.length > 0 ? (
                    <>
                      <View style={styles.scrollContent}>
                        {openOrdersSlice.map((item, index) => (
                          <View key={openOrderKeyExtractor(item)}>
                            {renderOpenOrderItem({ item, index })}
                          </View>
                        ))}
                      </View>
                      {filteredOpenOrders?.length > 5 && (
                        <TouchableOpacity
                          style={styles.viewAllButton}
                          onPress={() => NavigationService.navigate(OPEN_ORDER_SCREEN)}
                        >
                          <AppText style={[styles.viewAllText, { color: colors.buttonBg }]}>View All</AppText>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <View style={styles.noDataRow}>
                      <FastImage
                        source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
                        resizeMode="contain"
                        style={{ width: 80, height: 80 }}
                      />
                    </View>
                  )}
                </View>
              ) : null}

              {mountedOrdersTab === 2 ? (
                <View style={styles.ordersTabPanel}>
                  {pastOrdersForSpotPair?.length > 0 ? (
                    <>
                      <View style={styles.scrollContent}>
                        {(pastOrdersSlice ?? []).map((item, index) => (
                          <View key={pastOrderKeyExtractor(item)}>
                            {renderPastOrderItem({ item, index })}
                          </View>
                        ))}
                      </View>
                      {pastOrdersForSpotPair?.length > 5 && (
                        <TouchableOpacityView
                          style={styles.viewAllButton}
                          onPress={() => NavigationService.navigate('Trade_History')}
                        >
                          <AppText style={[styles.viewAllText, { color: colors.buttonBg }]}>View More</AppText>
                        </TouchableOpacityView>
                      )}
                    </>
                  ) : (
                    <View style={styles.noDataRow}>
                      <FastImage
                        source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
                        resizeMode="contain"
                        style={{ width: 80, height: 80 }}
                      />
                    </View>
                  )}
                </View>
              ) : null}

              {mountedOrdersTab === 3 ? (
                <View style={styles.ordersTabPanel}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 6,
                      marginBottom: 4,
                      paddingLeft: 2,
                      paddingRight: 14,
                      alignSelf: "flex-start",
                    }}
                  >
                    <View style={{ width: 102 }}>
                      <CustomDropdown
                        compact
                        data={SPOT_SIDE_DROPDOWN_LABELS}
                        selected={spotDropdownLabelFromSideFilter(tradeHistorySideFilter)}
                        onSelect={(label) => setTradeHistorySideFilter(spotSideFilterFromDropdownLabel(label))}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => setTradeHistorySideFilter("All")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingVertical: 4,
                        paddingLeft: 4,
                      }}
                    >
                      <FastImage source={Refresh} style={{ width: 12, height: 12 }} resizeMode="contain" />
                      <AppText style={{ fontSize: 13, color: themeColors.secondaryText }}>Reset</AppText>
                    </TouchableOpacity>
                  </View>
                  {renderTradeHistorySection()}
                </View>
              ) : null}
            </Animated.View>
          </View>
        )}
        {/* Sweet Alert Style Modal */}
        <ReactNativeModal
          isVisible={isConfirm}
          animationIn="zoomIn"
          animationOut="zoomOut"
          backdropOpacity={0.5}
          onBackdropPress={() => setIsConfirm(false)}
          onBackButtonPress={() => setIsConfirm(false)}
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: themeColors.themeElevationColor,
              borderRadius: 20,
              padding: 25,
              width: Dimensions.get("window").width * 0.85,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 10,
              },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
            }}
          >

            <AppText
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: themeColors.text,
                textAlign: "center",
                marginBottom: 15,
              }}
            >
              Confirm Order
            </AppText>

            {/* Message */}
            <AppText
              style={{
                fontSize: 15,
                color: themeColors.secondaryText,
                textAlign: "center",
                marginBottom: 25,
                lineHeight: 22,
              }}
            >
              Are you sure you want to execute this order?
            </AppText>

            {/* Buttons Container */}
            <View
              style={{
                flexDirection: "row",
                width: "100%",
                gap: 12,
              }}
            >
              {/* Cancel Button */}
              <TouchableOpacity
                onPress={() => {
                  setIsConfirm(false);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  backgroundColor: themeColors.themeElevationColor,
                  borderWidth: 1,
                  borderColor: themeColors.themeBorderColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppText
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: themeColors.text,
                  }}
                >
                  Cancel
                </AppText>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                onPress={() => {
                  setIsConfirm(false);
                  onConfirm();
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  backgroundColor: themeColors.red,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: themeColors.red,
                  shadowOffset: {
                    width: 0,
                    height: 4,
                  },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <AppText
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: themeColors.textOnButton,
                  }}
                >
                  Confirm
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </ReactNativeModal>
        {/* <PopupModal visible={visible} handleVisiblity={handlePopup} /> */}
        <RBSheet
          ref={rbSheetNumber}
          closeOnDragDown={true}
          closeOnPressMask={true}
          height={300}
          animationType="none"
          customStyles={{
            container: {
              backgroundColor: themeColors.themeElevationColor,
              height: 300,
              borderRadius: 10,
              paddingHorizontal: universalPaddingHorizontal,
            },
            wrapper: {
              backgroundColor: "#0006",
            },
            draggableIcon: {
              backgroundColor: "transparent",
            },
          }}
        >
          {renderNumber()}
        </RBSheet>
        <RBSheet
          ref={rbSheetlimit}
          closeOnDragDown={true}
          closeOnPressMask={true}
          height={orderTypeSheetHeight}
          animationType="slide"
          customStyles={{
            container: {
              backgroundColor: themeColors.themeElevationColor,
              height: orderTypeSheetHeight,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: universalPaddingHorizontal,
              paddingTop: 12,
              paddingBottom: 8,
            },
            wrapper: {
              backgroundColor: "#0006",
            },
            draggableIcon: {
              backgroundColor: themeColors.themeBorderColor,
              width: 40,
            },
          }}
        >
          {renderOrderTypeSheet()}
        </RBSheet>

        <ReactNativeModal
          isVisible={isCancelModalVisible}
          animationIn="zoomIn"
          animationOut="zoomOut"
          backdropOpacity={0.5}
          onBackdropPress={() => setIsCancelModalVisible(false)}
          onBackButtonPress={() => setIsCancelModalVisible(false)}
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <View
            style={{
              backgroundColor: themeColors.themeElevationColor,
              borderRadius: 20,
              padding: 25,
              width: Width * 0.85,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
              borderWidth: 1,
              borderColor: themeColors.themeBorderColor,
            }}
          >
            <AppText
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: themeColors.text,
                textAlign: "center",
                marginBottom: 15,
              }}
            >
              Cancel Order
            </AppText>

            <AppText
              style={{
                fontSize: 15,
                color: themeColors.secondaryText,
                textAlign: "center",
                marginBottom: 25,
                lineHeight: 22,
              }}
            >
              Are you sure you want to cancel this order?
            </AppText>

            <View style={{ flexDirection: "row", width: "100%", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setIsCancelModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: themeColors.themeElevationColor,
                  borderWidth: 1,
                  borderColor: themeColors.themeBorderColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppText style={{ fontSize: 14, fontWeight: "600", color: themeColors.text }}>
                  No, Keep
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isCancelLoading}
                onPress={async () => {
                  const orderId = orderToCancel?._id || orderToCancel?.id;
                  if (orderId) {
                    setIsCancelLoading(true);
                    const res = await dispatch(cancelOrder({ order_id: orderId }));
                    setIsCancelLoading(false);
                    if (res?.success) {
                      setIsCancelModalVisible(false);
                      setOrderToCancel(null);
                    }
                  } else {
                    setIsCancelModalVisible(false);
                    setOrderToCancel(null);
                  }
                }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: themeColors.red,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: themeColors.red,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                  opacity: isCancelLoading ? 0.7 : 1,
                }}
              >
                {isCancelLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <AppText style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
                    Yes, Cancel
                  </AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ReactNativeModal>
      </ScrollView>
    </View>
  );
};

export default Spot;
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    // padding: 12,
  },
  minicontainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: SPOT_ORDER_V_GAP,
  },
  contain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  barContainer: {
    padding: 16,
    backgroundColor: "#fff",
    // flex: 1,
    justifyContent: "center",
    height: 500,
  },
  // secondcontainer: {
  //   padding: 12,
  //   backgroundColor: '#fff',
  // },
  secondcontainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: SPOT_ORDER_V_GAP,
  },
  leftPanel: {
    flex: 4,
    paddingRight: 6,
  },
  rightPanel: {
    flex: 6,
    paddingLeft: 6,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: SPOT_ORDER_V_GAP,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 4,
    marginRight: 6,
  },
  activeTab: {
    backgroundColor: "#00C076",
  },
  tabText: {
    color: "#000",
    fontSize: 12,
  },
  activeTabText: {
    color: "#fff",
  },
  ordersTabContentWrapper: {
    minHeight: 120,
    marginTop: 4,
    marginBottom: 8,
    marginHorizontal: 5,
    position: "relative",
    paddingBottom: 24,
  },
  ordersTabPanel: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  dropdown: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    justifyContent: "space-between",
    marginBottom: SPOT_ORDER_V_GAP,
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 11,
  },
  spotOrderInputBlock: {
    marginBottom: SPOT_ORDER_V_GAP,
  },
  spotOrderSliderWrap: {
    marginBottom: SPOT_ORDER_V_GAP,
  },
  spotOrderTifRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 10,
    rowGap: 4,
    marginBottom: SPOT_ORDER_V_GAP,
    alignItems: "center",
  },
  spotOrderTifChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  spotOrderTifBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
  },
  spotOrderTifText: {
    fontSize: 9,
  },
  slippageCheckbox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  slippageCheckIcon: {
    width: 7,
    height: 7,
  },
  spotOrderSlippageError: {
    fontSize: 9,
    lineHeight: 12,
  },
  spotOrderSubmitWrap: {
    marginTop: SPOT_ORDER_V_GAP,
    width: "100%",
    alignSelf: "stretch",
  },
  spotOrderSubmitBtn: {
    height: 36,
    minHeight: 36,
    borderRadius: 8,
  },
  spotOrderSubmitTitle: {
    fontSize: 12,
    color: colors.white,
  },
  spotOrderFooterBelowCta: {
    width: "100%",
    alignSelf: "stretch",
    marginTop: SPOT_ORDER_V_GAP,
    marginBottom: SPOT_ORDER_V_GAP,
  },
  spotOrderFooterFeesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 16,
    rowGap: 4,
  },
  spotOrderFooterFeeText: {
    fontSize: 11,
  },
  spotOrderStakingCard: {
    marginTop: SPOT_ORDER_V_GAP,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  spotOrderStakingAprText: {
    fontSize: 11,
    color: "#f59e0b",
  },
  /** Outer: centers the label+value stack vertically when taller than content. */
  spotOrderFieldCard: {
    justifyContent: "center",
    alignItems: "stretch",
    paddingVertical: 2,
    paddingHorizontal: 3,
    minHeight: 34,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "visible",
  },
  /** Inner: label + row treated as one block (centered inside spotOrderFieldCard). */
  spotOrderFieldStack: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    overflow: "visible",
  },
  spotOrderInputLabel: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 0,
    lineHeight: 13,
  },
  spotOrderInputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 6,
    paddingHorizontal: 2,
    minHeight: 22,
  },
  spotOrderStepBtn: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: 22,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  spotOrderStepBtnText: {
    fontSize: 11,
    fontWeight: "400",
  },
  spotOrderInputValue: {
    flex: 1,
    fontSize: 11,
    textAlign: "center",
    textAlignVertical: "center",
    paddingVertical: 2,
    paddingHorizontal: 2,
    minHeight: 22,
    alignSelf: "center",
    fontFamily: MEDIUM,
    lineHeight: 16,
  },
  spotOrderTotalValue: {
    flex: 1,
  },
  /** Price / Amount / Total only — shorter vertical footprint */
  spotOrderFieldCardDense: {
    minHeight: 34,
    paddingVertical: 1,
    paddingHorizontal: 2,
  },
  /** Amount / Total when empty — Binance-like short row, label centered */
  spotOrderFieldCardTight: {
    minHeight: 26,
    paddingVertical: 0,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  spotOrderAmountEmptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  spotOrderTotalEmptyInner: {
    minHeight: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  spotOrderInputBoxDense: {
    minHeight: 18,
  },
  spotOrderInputValueDense: {
    minHeight: 18,
    paddingVertical: 0,
    fontSize: 8,
    lineHeight: 12,
  },
  /** Slippage: slightly larger placeholder/value than dense amount; % overlay so caret stays centered */
  spotOrderSlippageInputShell: {
    flex: 1,
    position: "relative",
    minHeight: 20,
    justifyContent: "center",
    alignSelf: "stretch",
  },
  spotOrderSlippageInput: {
    width: "100%",
    fontSize: 10,
    lineHeight: 14,
    minHeight: 20,
    paddingVertical: 0,
    paddingLeft: 26,
    paddingRight: 26,
    fontFamily: MEDIUM,
    textAlign: "center",
    textAlignVertical: "center",
  },
  spotOrderSlippagePctWrap: {
    position: "absolute",
    right: -10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  spotOrderSlippagePctText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: MEDIUM,
   
  },
  /** Price / Amount steppers (+/−) */
  spotOrderStepBtnSpotPair: {
    minWidth: 24,
  },
  /** Total row: same side width as ± so value centers like Price/Amount */
  spotOrderTotalSideSpacer: {
    minWidth: 24,
  },
  spotOrderStepBtnTextDense: {
    fontSize: 10,
  },
  input: {
    // borderWidth: 1,
    // borderColor: '#ccc',
    height: 40,
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    backgroundColor: "#EBEAE7",
    fontWeight: "600",
    marginTop: 0,
  },
  percentButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 8,
  },
  percentBtn: {
    // borderWidth: 1,
    // borderColor: '#aaa',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  selectedPercentBtn: (theme) => ({
    backgroundColor: theme === "Dark" ? colors.buttonDarkBg : "#F3BB2B",
    // borderColor: '#00C076',
  }),
  assetBox: {
    borderRadius: 6,
    padding: 5,
    marginBottom: SPOT_ORDER_V_GAP,
  },
  assetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  assetActionRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 6,
    marginTop: SPOT_ORDER_V_GAP,
  },
  assetLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  assetValue: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  assetActionBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  assetActionText: {
    fontSize: 10,
    fontWeight: "600",
  },
  buyBtn: {
    backgroundColor: "#00C076",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  buyBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    width: "100%",
  },
  orderRowThreeCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  orderPrice: {
    color: "#E86161",
    fontSize: 12,
    flex: 1,
  },
  orderSize: {
    fontSize: 12,
    flex: 1,
    textAlign: "center",
  },
  orderTotal: {
    flex: 1,
    textAlign: "right",
  },
  orderBookTabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 8,
  },
  orderBookTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  orderBookTabActive: {
    borderBottomWidth: 2,
  },
  orderBookTabText: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  orderBookTabTextActive: {
    fontWeight: "600",
  },
  orderBookFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  orderBookFilterBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 4,
    backgroundColor: colors.white_fifteen,
  },
  orderBookFilterBtnActive: {
    backgroundColor: colors.buttonDarkBg,
  },
  orderBookFilterText: {
    fontSize: 11,
    color: colors.secondaryText,
  },
  orderBookFilterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  orderBookHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  orderBookHeaderText: {
    fontSize: 11,
    color: "#9D9D9D",
    flex: 1,
  },
  currentPriceBox: {
    marginVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spotObToolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 0,
  },
  spotObRatioRow: {
    width: "100%",
    flexDirection: "row",
  },
  spotObRatioPill: {
    flex: 1,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  spotObAggTrigger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 32,
  },
  spotObAggCaret: {
    width: 10,
    height: 10,
  },
  spotObViewCycleBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  spotObViewCycleIcon: {
    width: 15,
    height: 15,
  },
  spotObAggBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  spotObAggPopover: {
    position: "absolute",
    width: 144,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  spotObAggRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  currentPrice: {
    color: "#00C076",
    fontWeight: "bold",
    fontSize: 16,
  },
  currentPriceUSD: {
    fontSize: 12,
    color: "#555",
  },
  selectContainer: {
    height: 25,
    flexDirection: "row",
    alignItems: "center",
    // borderWidth: 1,
    // borderColor: colors.white,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  checkImage: {
    height: 16,
    width: 16,
  },
  tableWrapper: {
    borderRadius: 10,
    overflow: "hidden",
    // backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
  },

  headerRow: {
    // backgroundColor: "#FFD700",
    borderBottomWidth: 2,
    borderBottomColor: "#b8860b",
  },
  //   evenRow: { backgroundColor: "#fff" },
  //   oddRow: { backgroundColor: "#f9f9f9" },
  //
  cell: {
    width: 100,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    textAlign: "center",
    // color:
  },
  headerCell: { fontWeight: "bold", fontSize: 13 },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
    backgroundColor: "transparent",
  },
  orderBookEmptyList: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: ORDER_BOOK_LIST_MAX_HEIGHT,
    backgroundColor: "transparent",
  },
  orderBookListContentAsks: {
    flexGrow: 0,
    paddingTop: ORDER_BOOK_LIST_END_PAD,
  },
  orderBookListContentBids: {
    flexGrow: 0,
    paddingBottom: ORDER_BOOK_LIST_END_PAD,
  },
  emptyOrderBook: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: "transparent",
  },
  filterBtn: {
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  // Card styles for orders – height content-driven (no fixed height)
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 5,
    paddingBottom: 8,
  },
  orderCard: {
    borderRadius: 10,
    padding: universalPaddingHorizontal,
    marginBottom: 10,
    marginTop: 10,
    borderWidth: borderWidth,
    borderColor: "#ccc",
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.themeElevationColor,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  currencyText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 6,
  },
  cardLinkIcon: {
    width: 16,
    height: 16,
  },
  orderTypeLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  rightInfo: {
    alignItems: "flex-end",
    minWidth: 140,
  },
  dateText: {
    fontSize: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  labelText: {
    fontSize: 13,
    marginRight: 8,
    minWidth: 110,
  },
  valueText: {
    fontSize: 13,
    flex: 1,
    flexShrink: 1,
    textAlign: "right",
  },
  actionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grey,
    alignItems: "flex-end",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#A65C5C",
  },
  binIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  executedTradesContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  executedTradeCard: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: borderWidth,
  },
  noDataRow: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  noDataText: {
    fontSize: 16,
    fontStyle: "italic",
    marginTop: 16,
  },
  viewAllButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 4,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  // Open Order card – same design as OpenOrder.js screen
  openOrderCard: {
    padding: 14,
    paddingBottom: 0,
    width: "100%",
    alignSelf: "center",
  },
  openOrderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  orderHistoryChevron: {
    width: 10,
    height: 10,
    marginTop: 2,
  },
  pairRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  coinIconSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
    backgroundColor: "transparent",
  },
  openOrderCardTitle: {
    fontSize: 14,
    marginRight: 6,
    fontWeight: "600",
  },
  openOrderCardDate: {
    fontSize: 11,
  },
  openOrderTypeLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  openOrderCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 1,
  },
  kvK: {
    fontSize: 11,
    flex: 1,
  },
  kvV: {
    fontSize: 11,
    flex: 1,
    textAlign: "right",
  },
  execTradesBtn: {
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: lightTheme.inputBorder,
    borderRadius: 5,

  },
  execTradesBtnRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  execTradesBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  execTradesBox: {
    marginTop: 8,
    backgroundColor: "rgba(128, 128, 128, 0.08)",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  execTradeItem: {
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 0,
  },
  execTradeHeaderRow: {
    marginBottom: 4,
  },
  execTradeHeaderText: {
    fontSize: 11,
  },
  execTradeKvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 1,
  },
  execTradeKvK: {
    fontSize: 11,
    flex: 1,
  },
  execTradeKvV: {
    fontSize: 11,
    flex: 1,
    textAlign: "right",
  },
  openOrderCardLabel: {
    fontSize: 12,
    flex: 1,
  },
  openOrderCardValue: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  openOrderCardDivider: {
    height: 1,
    backgroundColor: "#ccc",
    marginTop: 14,
  },
  cancelActionBtn: {
    borderWidth: 1,
    borderColor: "#FF4F4F",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
});