import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  InteractionManager,
  AppState,
  Animated,
  ImageBackground,
  LayoutAnimation,
  ActivityIndicator,
  Platform,
  UIManager,
  Alert,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import React, { useCallback, useContext, useEffect, useRef, useState, useMemo, memo } from "react";
import Ionicons from "react-native-vector-icons/Ionicons";

import SpotHeader from "../../shared/components/spotHeader/SpotHeader";
import FastImage from "react-native-fast-image";
import Skeleton from "react-native-reanimated-skeleton";
import {
  BarTrading,
  binIcon,
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
  printIcon,
  REMOVE,
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
} from "../../helper/utility";
import { colors } from "../../theme/colors";
import CustomDropdown from "../../shared/components/CustomDropdown";
import RBSheet from "react-native-raw-bottom-sheet";
import { universalPaddingHorizontal, borderWidth } from "../../theme/dimens";

/** Same vertical space between Buy/Sell column sections (tabs → fields → slider → IOC → assets → CTA → footer). */
const SPOT_ORDER_V_GAP = 8;
import {
  AppText,
  Button,
  CommonModal,
  Input,
  SEMI_BOLD,
  THIRTEEN,
} from "../../shared";
import PercentQuickSelect from "../../shared/components/PercentQuickSelect";
import ReactNativeModal from "react-native-modal";
import { BASE_URL, placeHolderText, titleText } from "../../helper/Constants";
import {
  setBuyOrders,
  setCoinData,
  setOpenOrders,
  setPastOrders,
  setRandom,
  setSellOrders,
  setSocket,
  setSpotSelectedPair,
} from "../../slices/homeSlice";
import { setLoading } from "../../slices/authSlice";
import { useFocusEffect, useIsFocused, useRoute, useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import LinearGradient from "react-native-linear-gradient";
import {
  ACCOUNT_SCREEN,
  DEPOSIT_COIN_SCREEN,
  DEPOSIT_WALLET_SCREEN,
  KYC_STATUS_SCREEN,
  MARKET_SCREEN,
  SPOT_ORDER_HISTORY_DETAIL,
  SPOT_CHART_SCREEN,
  TRANSFER_SCREEN,
  WALLET_WITHDRAW_SCREEN,
  WITHDRAW_Coin_SCREEN,
} from "../../navigation/routes";
import { cancelOrder, placeOrder } from "../../actions/homeActions";
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

function matchesOpenOrderKind(item, kind) {
  if (kind === "all") return true;
  const t = String(item?.type || item?.order_type || "").toUpperCase();
  if (kind === "limit") return t === "LIMIT";
  if (kind === "market") return t === "MARKET";
  if (kind === "stop_limit") return t === "STOP_LIMIT";
  if (kind === "stop_market") return t === "STOP_MARKET";
  return true;
}

function tradeHistoryMarketLabel(item) {
  if (item?.pair != null && String(item.pair).trim() !== "") return String(item.pair).trim();
  return "---";
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
  const a = ratio;
  const b = Math.min(1, a + 1e-6);
  const handlePress = useCallback(() => { onPress(item?.price, item?.remaining); }, [onPress, item?.price, item?.remaining]);

  // Adjusted tints for better theme awareness
  const baseRed = isDark ? "#352933f7" : "#FFD9DB";

  return (
    <TouchableOpacity onPress={handlePress}>
      <LinearGradient
        style={styles.orderRow}
        colors={[baseRed, baseRed, "transparent", "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        locations={[0, a, b, 1]}
      >
        <AppText style={[styles.orderPrice, { color: themeColors.red }]}>{formatPrice(item?.price)}</AppText>
        <AppText style={[styles.orderSize, { color: themeColors.text }]}>{formatQuantity(item?.remaining)}</AppText>
      </LinearGradient>
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
  const a = ratio;
  const b = Math.min(1, a + 1e-6);
  const handlePress = useCallback(() => { onPress(item?.price, item?.remaining); }, [onPress, item?.price, item?.remaining]);

  // Adjusted tints for better theme awareness
  const baseGreen = isDark ? "#213438" : "#C6F9E9";

  return (
    <TouchableOpacity onPress={handlePress}>
      <LinearGradient
        style={styles.orderRow}
        colors={[baseGreen, baseGreen, "transparent", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        locations={[0, a, b, 1]}
      >
        <AppText style={[styles.orderPrice, { color: themeColors.green }]}>{formatPrice(item?.price)}</AppText>
        <AppText style={[styles.orderSize, { color: themeColors.text }]}>{formatQuantity(item?.remaining)}</AppText>
      </LinearGradient>
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
  orderBookDataEqual(prev.sellData, next.sellData) &&
  orderBookDataEqual(prev.buyData, next.buyData);

// Order book skeleton: shimmer rows (Price/Quantity columns). Wider strip + no shimmer on header text.
const ORDER_BOOK_SHIMMER_STRIP_WIDTH = 240;
const OrderBookSkeleton = () => {
  const { colors: themeColors, isDark } = useTheme();
  const ROWS = 8;
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

const ORDER_BOOK_LIST_STYLE = { maxHeight: 220, flexGrow: 0 };
const ORDER_BOOK_HEADER_ROW_STYLE = { flexDirection: "row", justifyContent: "space-between" };
const ORDER_BOOK_HEADER_LABEL_STYLE = { color: "#9D9D9D" };

// Memoized order book panel – re-renders only when order book data or price display changes.
// Header always shows Price/Quantity text (no shimmer on labels). Skeleton only in list + price box.
const OrderBookPanel = memo(({
  sellData,
  buyData,
  buy_price,
  change_percentage,
  quote_currency,
  base_currency,
  orderBookReady,
  showOrderBookSkeleton,
  styles,
  renderSellOrderItem,
  renderBuyOrderItem,
  sellKeyExtractor,
  buyKeyExtractor,
  getOrderItemLayout,
}) => {
  const { colors: themeColors, theme, isDark } = useTheme();
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
    [showOrderBookSkeleton, colors, styles.emptyOrderBook, theme]
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
    [showOrderBookSkeleton, themeColors, styles.emptyOrderBook, theme, isDark]
  );
  const currentPriceColor = change_percentage < 0 ? themeColors.red : themeColors.green;
  const bg = themeColors.themeElevationColor;
  return (
    <View style={styles.rightPanel}>
      {/* Price / Quantity header: always show text so shimmer doesn't cover labels */}
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
      <FlatList
        data={sellData}
        keyExtractor={sellKeyExtractor}
        renderItem={renderSellOrderItem}
        getItemLayout={getOrderItemLayout}
        removeClippedSubviews={true}
        initialNumToRender={7}
        maxToRenderPerBatch={7}
        windowSize={5}
        updateCellsBatchingPeriod={100}
        inverted={true}
        style={ORDER_BOOK_LIST_STYLE}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={sellData?.length === 0 ? styles.emptyListContainer : undefined}
        ListEmptyComponent={listEmptySell}
      />
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
      <FlatList
        data={buyData}
        keyExtractor={buyKeyExtractor}
        renderItem={renderBuyOrderItem}
        inverted={false}
        getItemLayout={getOrderItemLayout}
        removeClippedSubviews={true}
        initialNumToRender={7}
        maxToRenderPerBatch={7}
        windowSize={5}
        updateCellsBatchingPeriod={100}
        style={ORDER_BOOK_LIST_STYLE}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={buyData?.length === 0 ? styles.emptyListContainer : undefined}
        ListEmptyComponent={listEmptyBuy}
      />
    </View>
  );
}, orderBookPanelAreEqual);
OrderBookPanel.displayName = "OrderBookPanel";

// Isolated order book: subscribes to Redux here so Spot (and Open Orders / Order History tabs) does not re-render on every order book update → instant tab switching
const OrderBookSection = memo(({
  styles,
  buy_price,
  change_percentage,
  quote_currency,
  base_currency,
  orderBookReady,
  showOrderBookSkeleton,
  onOrderBookPress,
  formatPrice,
  formatQuantity,
}) => {
  const { colors: themeColors, theme, isDark } = useTheme();
  const buyOrders = useAppSelector((state) => state.home.buyOrders);
  const sellOrders = useAppSelector((state) => state.home.sellOrders);

  const lastSevenObjects = useMemo(() => {
    if (!sellOrders || sellOrders.length === 0) return [];
    return [...sellOrders].sort((a, b) => (parseFloat(a?.price) || 0) - (parseFloat(b?.price) || 0));
  }, [sellOrders]);

  const startingSevenObjects = useMemo(() => {
    if (!buyOrders || buyOrders.length === 0) return [];
    return buyOrders;
  }, [buyOrders]);

  const sellOrdersForDisplay = useMemo(
    () => (showOrderBookSkeleton ? [] : (orderBookReady ? lastSevenObjects : [])),
    [showOrderBookSkeleton, orderBookReady, lastSevenObjects]
  );
  const buyOrdersForDisplay = useMemo(
    () => (showOrderBookSkeleton ? [] : (orderBookReady ? startingSevenObjects : [])),
    [showOrderBookSkeleton, orderBookReady, startingSevenObjects]
  );

  const toFiniteLocal = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const maxBuyVolume = useMemo(() => {
    return Math.max(1, ...(buyOrders || []).map((o) => toFiniteLocal(o?.remaining)).filter(Number.isFinite));
  }, [buyOrders]);
  const maxSellVolume = useMemo(() => {
    return Math.max(1, ...(sellOrders || []).map((o) => toFiniteLocal(o?.remaining)).filter(Number.isFinite));
  }, [sellOrders]);

  const renderSellOrderItem = useCallback(
    ({ item }) => (
      <OrderBookSellRow
        item={item}
        maxVolume={maxSellVolume}
        theme={theme}
        onPress={onOrderBookPress}
        formatPrice={formatPrice}
        formatQuantity={formatQuantity}
        styles={styles}
      />
    ),
    [maxSellVolume, theme, onOrderBookPress, formatPrice, formatQuantity]
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
        styles={styles}
      />
    ),
    [maxBuyVolume, theme, onOrderBookPress, formatPrice, formatQuantity]
  );

  const sellKeyExtractor = useCallback((item) => {
    const p = item?.price != null ? String(Number(item.price)) : "";
    return `sell_${p}`;
  }, []);
  const buyKeyExtractor = useCallback((item) => {
    const p = item?.price != null ? String(Number(item.price)) : "";
    return `buy_${p}`;
  }, []);
  const ORDER_ROW_HEIGHT = 24;
  const getOrderItemLayout = useCallback((_, index) => ({
    length: ORDER_ROW_HEIGHT,
    offset: ORDER_ROW_HEIGHT * index,
    index,
  }), []);

  return (
    <OrderBookPanel
      sellData={sellOrdersForDisplay}
      buyData={buyOrdersForDisplay}
      buy_price={buy_price}
      change_percentage={change_percentage}
      quote_currency={quote_currency}
      base_currency={base_currency}
      orderBookReady={orderBookReady}
      showOrderBookSkeleton={showOrderBookSkeleton}
      styles={styles}
      renderSellOrderItem={renderSellOrderItem}
      renderBuyOrderItem={renderBuyOrderItem}
      sellKeyExtractor={sellKeyExtractor}
      buyKeyExtractor={buyKeyExtractor}
      getOrderItemLayout={getOrderItemLayout}
    />
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
  const buyOrders = useAppSelector((state) => state.home.buyOrders);
  const sellOrders = useAppSelector((state) => state.home.sellOrders);

  const [currency, setCurrency] = useState(null);
  const [currencyData, setCurrencyData] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [LocalBuyOrders, setLocalBuyOrders] = useState([]);
  const [LocalSellOrders, setLocalSellOrders] = useState([]);
  const [LocalRecentTrade, setLocalRecentTrade] = useState([]);
  const [orderFilter, setOrderFilter] = useState("All");
  const [pastOrderFilter, setPastOrderFilter] = useState("All");
  const [expandedRowIndex, setExpandedRowIndex] = useState(null);
  const [lastSocketData, setLastSocketData] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const isSpotFocused = useIsFocused();

  const rbSheetNumber = useRef();
  const rbSheetlimit = useRef();
  const appStateRef = useRef(AppState.currentState);
  const latestSocketDataRef = useRef(null);
  const latestLocalBuyOrdersRef = useRef([]);
  const latestLocalSellOrdersRef = useRef([]);
  const currentCurrencyRef = useRef(null);
  const SOCKET_UI_THROTTLE_MS = 500;
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

  const handleCandlePress = useCallback(() => {
    const pair = spotSelectedPair ?? currency ?? effectiveCurrency;
    if (!pair?.base_currency || !pair?.quote_currency) return;
    NavigationService.navigate(SPOT_CHART_SCREEN, {
      base_currency: pair.base_currency,
      quote_currency: pair.quote_currency,
      change_percentage: pair.change_percentage ?? 0,
      buy_price: pair.buy_price,
      high: pair.high,
      low: pair.low,
      volume: pair.volume,
    });
  }, [spotSelectedPair, currency, effectiveCurrency]);

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

  // Removed automatic restoration from Redux cache to ensure only fresh socket data is shown.
  // This satisfies the requirement: "if data comes from backend, show; otherwise don't".


  // When spotSelectedPair changes: sync local form + clear order book until new pair socket data arrives.
  useEffect(() => {
    if (!spotSelectedPair) return;

    if (currentCurrencyRef.current?.base_currency !== spotSelectedPair.base_currency ||
      currentCurrencyRef.current?.quote_currency !== spotSelectedPair.quote_currency) {
      setCurrency(spotSelectedPair);
      currentCurrencyRef.current = spotSelectedPair;
      setAmount("1");
      setPrice(formatPrice(spotSelectedPair.buy_price).toString());
      setActivePercentage("");
      setLastSocketData(null);
      setLocalBuyOrders([]);
      setLocalSellOrders([]);
      dispatch(setBuyOrders([]));
      dispatch(setSellOrders([]));
      setRecentTrades([]);
      setSpotMyTrades([]);
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



  const [activeTab, setActiveTab] = useState(1);
  activeTabRef.current = activeTab;
  const [tab, setTab] = useState("Buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("1");
  const [stopPrice, setStopPrice] = useState("");
  const [limitIoc, setLimitIoc] = useState(false);
  const [limitFok, setLimitFok] = useState(false);
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
  const isLimit = spotOrderType === "LIMIT" || spotOrderType === "STOP_LIMIT";
  const isMarketLikeOrder = spotOrderType === "MARKET" || spotOrderType === "STOP_MARKET";
  const showStopPriceField = spotOrderType === "STOP_LIMIT" || spotOrderType === "STOP_MARKET";
  const [openOrderKindTab, setOpenOrderKindTab] = useState("all");
  const [spotMyTrades, setSpotMyTrades] = useState([]);
  const [tradeHistorySideFilter, setTradeHistorySideFilter] = useState("All");
  const [activePercentage, setActivePercentage] = useState(0);
  const [balance, setBalance] = useState(0);
  const [_balance, _setBalance] = useState(0);
  const [numberSelect, setNumberSelect] = useState("0.0001");
  const [isConfirm, setIsConfirm] = useState(false);
  const [visible, setVisible] = useState(false);
  const [focusSettling, setFocusSettling] = useState(false);
  const focusSettlingTimeoutRef = useRef(null);

  const orderBookReady = !!lastSocketData || (buyOrders?.length > 0 || sellOrders?.length > 0);
  const showOrderBookSkeleton = !orderBookReady;
  /** Header shows skeleton until `coinData` row exists for the pair (LOCAL pairs skip list lookup). */
  const pairMetaReady =
    currencyData != null || effectiveCurrency?.available === "LOCAL";
  const pairHeaderLoading = !pairMetaReady;


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
          lastExchange &&
          `${lastExchange.base_currency_id}-${lastExchange.quote_currency_id}` === newKey;
        // Clear order book before subscribing so we don't show stale data during connection
        dispatch(setBuyOrders([]));
        dispatch(setSellOrders([]));
        setLastSocketData(null);
        setLocalBuyOrders([]);
        setLocalSellOrders([]);

        if (!alreadySubscribed) {
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

        // Unsubscribe from exchange when leaving Spot to avoid unnecessary updates
        const last = lastSubscribedExchangeRef.current;
        if (last?.base_currency_id != null && last?.quote_currency_id != null) {
          unsubscribeFromExchange(last.base_currency_id, last.quote_currency_id);
          lastSubscribedExchangeRef.current = null;
        }

        // Clear order book data when leaving the screen so "last saved data" is never shown on return.
        // Data will only reappear once the next socket update is received.
        dispatch(setBuyOrders([]));
        dispatch(setSellOrders([]));
        setLastSocketData(null);
        setLocalBuyOrders([]);
        setLocalSellOrders([]);
        lastFlushedBuyRef.current = null;
        lastFlushedSellRef.current = null;
      };
    }, [subscribeToExchange, unsubscribeFromExchange, currency, dispatch])
  );

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
    if (payload.recentTrades !== undefined) setLocalRecentTrade(payload.recentTrades ?? []);
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
  }, [dispatch]);
  flushSocketToStateRef.current = flushSocketToState;

  // Socket listener only when Spot is focused - when blurred we remove listeners so no work in background
  useEffect(() => {
    if (!socket || !isSpotFocused) return;

    const transformLocalOrder = (order, index) => {
      const price = parseFloat(order.price);
      const quantity = parseFloat(order.quantity ?? order.remaining ?? 0);
      const remaining = parseFloat(order.remaining ?? order.quantity ?? 0);
      return {
        _id: `local_${order.price}_${remaining}_${index}`,
        side: order.side,
        price,
        quantity,
        filled: 0,
        remaining,
        total: parseFloat(order.total ?? price * remaining),
        status: "PENDING",
        transaction_fee: 0,
        tds: 0,
        __v: 0,
      };
    };

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

      if (data?.open_orders && Array.isArray(data.open_orders)) {
        dispatch(setOpenOrders(data.open_orders));
      }
      if (data?.executed_order && Array.isArray(data.executed_order)) {
        dispatch(setPastOrders(data.executed_order));
      }
      if (data?.trade_history !== undefined) {
        setSpotMyTrades(Array.isArray(data.trade_history) ? data.trade_history : []);
      }

      if (data?.buy_order || data?.sell_order) {
        const transformedBuyOrders = (data?.buy_order || []).map(transformLocalOrder);
        const transformedSellOrders = (data?.sell_order || []).map(transformLocalOrder);
        latestLocalBuyOrdersRef.current = transformedBuyOrders;
        latestLocalSellOrdersRef.current = transformedSellOrders;
        scheduleFlush({
          data,
          buyOrders: transformedBuyOrders,
          sellOrders: transformedSellOrders,
          recentTrades: data?.recent_trades ?? [],
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
      setRecentTrades(LocalRecentTrade);
    }
  }, [LocalBuyOrders, LocalSellOrders, LocalRecentTrade, currency, dispatch]);

  // Order history now comes from socket (executed_order), so we removed the API call here
  // This matches the website implementation where order history comes from socket messages




  useEffect(() => {
    if (base_currency) {
      let data = { currency_id: base_currency_id };
    }
  }, [base_currency_id]);

  const handleAmount = (text) => {
    setPrice(text?.toString());
    setTotal(multiply(text, amount));
  };

  const handleOrderBookClick = useCallback((itemPrice, itemQuantity) => {
    if (isLimit) {
      setPrice(formatPrice(itemPrice).toString());
    }
    setAmount(formatQuantity(itemQuantity).toString());
  }, [isLimit, formatPrice, formatQuantity]);

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
    setAmount(val);
  };

  const handleStopPriceStep = (delta) => {
    const current = parseFloat(stopPrice || buy_price || "0") || 0;
    const next = Math.max(0, current + delta * tickSize);
    const prec = getPricePrecision();
    setStopPrice(parseFloat(next.toFixed(prec)).toString());
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

      setAmount(finalQuantity.toString() || '0');
      // handleTotal(percentCalculation(coinBalance?.quote_currency_balance || 0, value));
    } else {
      const finalQuantity = toFixed8(
        percentCalculation(coinBalance?.base_currency_balance || 0, value)
      );
      setAmount(finalQuantity.toString() || '0');
    }
  };

  const handleTotal = (text) => {
    const qty = Number(text) / Number(price);
    setAmount(qty?.toString());
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
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.newThemeColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
           <FastImage source={item.icon} tintColor={colors.white} style={{width:20,height:20}} resizeMode="contain"/>
          </View>
          <View style={{ flex: 1, marginLeft: 12, paddingRight: 8 }}>
            <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 16, marginBottom: 4 }}>
              {item.name}
            </AppText>
            <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, fontSize: 12, lineHeight: 17 }}>
              {item.description}
            </AppText>
          </View>
          {selected ? (
            <View style={{width:16,height:16,borderRadius:10,backgroundColor:colors.black,alignItems:"center",justifyContent:"center"}}>
            <FastImage source={tick} tintColor={colors.white} style={{width:8,height:8}} resizeMode="contain"/>
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
          <AppText weight={SEMI_BOLD} style={{ fontSize: 18, color: themeColors.text }}>
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
           <FastImage source={REMOVE} style={{width:22,height:22}} resizeMode="contain" tintColor={colors.black}/>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 6 }}>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 14, color: themeColors.text }}>
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
              style={{ marginLeft: 4,top:2 }}
            >
               <FastImage source={INFO} style={{width:12,height:12}} resizeMode="contain"/>
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
              style={{ marginLeft: 4 ,top:2}}
            >
               <FastImage source={INFO} style={{width:12,height:12}} resizeMode="contain"/>
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

  // Stable keyExtractors for order FlatLists (avoid inline functions)
  const openOrderKeyExtractor = useCallback((item, idx) => item?._id ?? `open_${idx}`, []);
  const pastOrderKeyExtractor = useCallback((item, idx) => item?._id ?? `past_${idx}`, []);

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

  // Memoize filtered past orders for better performance
  const filteredPastOrders = useMemo(() => {
    if (!pastOrders?.length) return [];
    const filtered = pastOrderFilter === "All"
      ? [...pastOrders]
      : pastOrders.filter((item) => item?.side === pastOrderFilter);
    return filtered.sort((a, b) => {
      const dateA = new Date(a?.created_at || a?.createdAt || a?.updated_at || a?.updatedAt || 0).getTime();
      const dateB = new Date(b?.created_at || b?.createdAt || b?.updated_at || b?.updatedAt || 0).getTime();
      return dateB - dateA;
    });
  }, [pastOrders, pastOrderFilter]);

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

  const myTradesSlice = useMemo(() => filteredMyTrades.slice(0, 5), [filteredMyTrades]);
  const tradeHistoryKeyExtractor = useCallback((item, idx) => item?._id ?? `th_${idx}`, []);

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
  const pastOrdersSlice = useMemo(() => (filteredPastOrders ?? []).slice(0, 5), [filteredPastOrders]);

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

  // Memoized render function for open orders - Card Format (same design as OpenOrder.js screen)
  const renderOpenOrderItem = useCallback(({ item: inv, index: idx }) => {
    const currencyPair = inv?.side === "BUY"
      ? `${inv?.base_currency_short_name || inv?.ask_currency || inv?.base_currency}/${inv?.quote_currency_short_name || inv?.pay_currency || inv?.quote_currency}`
      : `${inv?.quote_currency_short_name || inv?.pay_currency || inv?.quote_currency}/${inv?.base_currency_short_name || inv?.ask_currency || inv?.base_currency}`;
    const qty = Number(inv?.quantity ?? inv?.filled ?? 0) || 0;
    const remaining = Number(inv?.remaining) ?? 0;
    const filled = qty > 0 ? qty - remaining : (Number(inv?.filled) || 0);
    const totalQty = qty || filled || 0;
    const price = Number(inv?.price) || 0;
    const avgPrice = Number(inv?.avg_execution_price) || price;
    const status = inv?.status || "";
    const isFilled = status === "FILLED";
    const orderTypeLabel = (inv?.order_type === "MARKET" ? "Market" : "Limit") + " / " + (inv?.side === "BUY" ? "Buy" : "Sell");
    const statusLabel = status === "FILLED" ? "Filled" : (status === "CANCELLED" || status === "CANCELED" ? "Canceled" : (status === "OPEN" ? "Open" : (status === "PARTIAL" ? "Partial" : status)));

    const statusUpper = String(status).toUpperCase().trim();
    const orderId = inv?._id || inv?.id;
    const canCancel = !!orderId && !["FILLED", "CANCELLED", "CANCELED", "COMPLETED", "EXECUTED", "REJECTED"].includes(statusUpper);

    const textColor = themeColors.text;
    const labelColor = themeColors.secondaryText;

    return (
      <View
        style={[styles.openOrderCard, { backgroundColor: themeColors.background }]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { order: inv })}
        >
          <View style={styles.openOrderTopRow}>
            <View style={styles.pairRow}>
              <AppText style={[styles.openOrderCardTitle, { color: textColor }]}>{currencyPair}</AppText>
            </View>
            <AppText style={[styles.openOrderCardDate, { color: labelColor }]}>
              {formatDateTimeCard(inv?.updatedAt || inv?.createdAt)}
            </AppText>
          </View>

          <AppText
            style={[
              styles.openOrderTypeLabel,
              { color: inv?.side === "BUY" ? themeColors.green : themeColors.red },
            ]}
          >
            {orderTypeLabel}
          </AppText>

          <View style={styles.openOrderCardRow}>
            <AppText style={[styles.openOrderCardLabel, { color: labelColor }]}>Amount:</AppText>
            <AppText style={[styles.openOrderCardValue, { color: textColor }]}>
              {toFixedEight(filled)} / {toFixedEight(totalQty)}
            </AppText>
          </View>

          <View style={styles.openOrderCardRow}>
            <AppText style={[styles.openOrderCardLabel, { color: labelColor }]}>Avg. / Price:</AppText>
            <AppText style={[styles.openOrderCardValue, { color: textColor }]}>
              {isFilled ? `${toFixedSix(avgPrice)} / ${toFixedSix(price)} (Counterparty 1)` : `0 / ${toFixedSix(price)}`}
            </AppText>
          </View>

          <View style={styles.openOrderCardRow}>
            <AppText style={[styles.openOrderCardLabel, { color: labelColor }]}>Status:</AppText>
            <AppText style={[styles.openOrderCardValue, { color: getStatusColor(inv?.status) }]}>{statusLabel}</AppText>
          </View>
        </TouchableOpacity>

        {canCancel && (
          <View style={[styles.openOrderCardRow, { marginTop: 8 }]}>
            <AppText style={[styles.openOrderCardLabel, { color: labelColor }]}>Action:</AppText>
            <TouchableOpacity
              style={styles.cancelActionBtn}
              onPress={() => {
                setOrderToCancel(inv);
                setIsCancelModalVisible(true);
              }}
            >
              <AppText style={{ color: themeColors.red, fontWeight: "600", fontSize: 13 }}>Cancel</AppText>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.openOrderCardDivider, { backgroundColor: themeColors.themeBorderColor }]} />
      </View>
    );
  }, [themeColors, formatDateTimeCard, getStatusColor]);

  // Format currency pair for past orders
  const formatCurrencyPair = useCallback((trade) => {
    if (trade?.side === "BUY") {
      return `${trade.ask_currency || base_currency}/${trade.pay_currency || quote_currency}`;
    }
    return `${trade.pay_currency || base_currency}/${trade.ask_currency || quote_currency}`;
  }, [base_currency, quote_currency]);

  // Format date for history card: "2026-01-30 18:51:16"
  const formatDateTimeCard = useCallback((dateString) => {
    if (!dateString) return "---";
    return moment(dateString).format("YYYY-MM-DD HH:mm:ss");
  }, []);

  // Memoized render function for past orders - same card UI as Open Orders; tap → SPOT_ORDER_HISTORY_DETAIL with full order data
  const renderPastOrderItem = useCallback(({ item: inv, index: idx }) => {
    const currencyPair = inv?.side === "BUY"
      ? `${inv?.base_currency_short_name || inv?.ask_currency || inv?.base_currency}/${inv?.quote_currency_short_name || inv?.pay_currency || inv?.quote_currency}`
      : `${inv?.quote_currency_short_name || inv?.pay_currency || inv?.quote_currency}/${inv?.base_currency_short_name || inv?.ask_currency || inv?.base_currency}`;
    const qty = Number(inv?.quantity ?? inv?.filled ?? 0) || 0;
    const remaining = Number(inv?.remaining) ?? 0;
    const filled = qty > 0 ? qty - remaining : (Number(inv?.filled) || 0);
    const totalQty = qty || filled || 0;
    const price = Number(inv?.price) || 0;
    const avgPrice = Number(inv?.avg_execution_price) || price;
    const status = inv?.status || "";
    const isFilled = status === "FILLED";
    const orderTypeLabel = (inv?.order_type === "MARKET" ? "Market" : "Limit") + " / " + (inv?.side === "BUY" ? "Buy" : "Sell");
    const statusLabel = status === "FILLED" ? "Filled" : (status === "CANCELLED" || status === "CANCELED" ? "Cancelled" : (status === "OPEN" ? "Open" : (status === "PARTIAL" ? "Partial" : status)));
    const statusUpper = String(status).toUpperCase().trim();
    const orderId = inv?._id || inv?.id;
    const canCancel = !!orderId && !["FILLED", "CANCELLED", "CANCELED", "COMPLETED", "EXECUTED", "REJECTED"].includes(statusUpper);

    const textColor = themeColors.text;
    const labelColor = themeColors.secondaryText;

    return (
      <View
        style={[styles.openOrderCard, { backgroundColor: themeColors.background }]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { order: inv })}
        >
          <View style={styles.openOrderTopRow}>
            <View style={styles.pairRow}>
              <AppText style={[styles.openOrderCardTitle, { color: textColor }]}>{currencyPair}</AppText>
            </View>
            <AppText style={[styles.openOrderCardDate, { color: labelColor }]}>
              {formatDateTimeCard(inv?.updatedAt || inv?.createdAt)}
            </AppText>
          </View>

          <AppText
            style={[
              styles.openOrderTypeLabel,
              { color: inv?.side === "BUY" ? themeColors.green : themeColors.red },
            ]}
          >
            {orderTypeLabel}
          </AppText>

          <View style={styles.openOrderCardRow}>
            <AppText style={[styles.openOrderCardLabel, { color: labelColor }]}>Amount:</AppText>
            <AppText style={[styles.openOrderCardValue, { color: textColor }]}>
              {toFixedEight(filled)} / {toFixedEight(totalQty)}
            </AppText>
          </View>

          <View style={styles.openOrderCardRow}>
            <AppText style={[styles.openOrderCardLabel, { color: labelColor }]}>Avg. / Price:</AppText>
            <AppText style={[styles.openOrderCardValue, { color: textColor }]}>
              {isFilled ? `${toFixedSix(avgPrice)} / ${toFixedSix(price)} (Counterparty 1)` : `0 / ${toFixedSix(price)}`}
            </AppText>
          </View>

          <View style={styles.openOrderCardRow}>
            <AppText style={[styles.openOrderCardLabel, { color: labelColor }]}>Status:</AppText>
            <AppText style={[styles.openOrderCardValue, { color: getStatusColor(inv?.status) }]}>{statusLabel}</AppText>
          </View>
        </TouchableOpacity>

        {canCancel && (
          <View style={[styles.openOrderCardRow, { marginTop: 8 }]}>
            <AppText style={[styles.openOrderCardLabel, { color: labelColor }]}>Action:</AppText>
            <TouchableOpacity
              style={styles.cancelActionBtn}
              onPress={() => {
                setOrderToCancel(inv);
                setIsCancelModalVisible(true);
              }}
            >
              <AppText style={{ color: themeColors.red, fontWeight: "600", fontSize: 13 }}>Cancel</AppText>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.openOrderCardDivider, { backgroundColor: themeColors.themeBorderColor }]} />
      </View>
    );
  }, [themeColors, formatDateTimeCard, getStatusColor]);

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <ScrollView
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
          />

          <View style={styles.secondcontainer}>
            <View style={styles.leftPanel}>

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

              {isLimit && (
                <View style={styles.spotOrderInputBlock}>
                  <View
                    style={[
                      styles.spotOrderFieldCard,
                      {
                        backgroundColor: themeColors.input,
                        borderColor: themeColors.themeBorderColor,
                      },
                    ]}
                  >
                    <View style={styles.spotOrderFieldStack}>
                      <AppText
                        style={[
                          styles.spotOrderInputLabel,
                          {
                            color: themeColors.secondaryText,
                            textAlign: "center",
                            alignSelf: "stretch",
                            top:5
                          },
                        ]}
                      >
                        Price ({quote_currency})
                      </AppText>
                      <View
                        style={[
                          styles.spotOrderInputBox,
                          {
                            backgroundColor: "transparent",
                            paddingHorizontal: 0,
                            paddingVertical: 0,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => handlePriceStep(-1)}
                          style={styles.spotOrderStepBtn}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <AppText style={[styles.spotOrderStepBtnText, { color: themeColors.secondaryText }]}>−</AppText>
                        </TouchableOpacity>
                        <TextInput
                          placeholder={String(buy_price)}
                          placeholderTextColor={themeColors.secondaryText}
                          value={price || formatTotal(buy_price)}
                          onChangeText={(text) => handlePriceInput(text, setPrice)}
                          onBlur={() => handlePriceBlur(price, setPrice)}
                          keyboardType="numeric"
                          style={[
                            styles.spotOrderInputValue,
                            {
                              color: themeColors.text,
                              textAlign: "center",
                              ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                            },
                          ]}
                          editable={isLimit}
                        />
                        <TouchableOpacity
                          onPress={() => handlePriceStep(1)}
                          style={styles.spotOrderStepBtn}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <AppText style={[styles.spotOrderStepBtnText, { color: themeColors.secondaryText }]}>+</AppText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {showStopPriceField && (
                <View style={styles.spotOrderInputBlock}>
                  <View
                    style={[
                      styles.spotOrderFieldCard,
                      {
                        backgroundColor: themeColors.input,
                        borderColor: themeColors.themeBorderColor,
                      },
                    ]}
                  >
                    <View style={styles.spotOrderFieldStack}>
                      <AppText
                        style={[
                          styles.spotOrderInputLabel,
                          {
                            color: themeColors.secondaryText,
                            textAlign: "center",
                            alignSelf: "stretch",
                          },
                        ]}
                      >
                        Stop ({quote_currency})
                      </AppText>
                      <View
                        style={[
                          styles.spotOrderInputBox,
                          {
                            backgroundColor: "transparent",
                            paddingHorizontal: 0,
                            paddingVertical: 0,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => handleStopPriceStep(-1)}
                          style={styles.spotOrderStepBtn}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <AppText style={[styles.spotOrderStepBtnText, { color: themeColors.secondaryText }]}>−</AppText>
                        </TouchableOpacity>
                        <TextInput
                          placeholder={String(buy_price)}
                          placeholderTextColor={themeColors.secondaryText}
                          value={stopPrice}
                          onChangeText={(text) => handlePriceInput(text, setStopPrice)}
                          onBlur={() => handlePriceBlur(stopPrice, setStopPrice)}
                          keyboardType="numeric"
                          style={[
                            styles.spotOrderInputValue,
                            {
                              color: themeColors.text,
                              textAlign: "center",
                              ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                            },
                          ]}
                        />
                        <TouchableOpacity
                          onPress={() => handleStopPriceStep(1)}
                          style={styles.spotOrderStepBtn}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <AppText style={[styles.spotOrderStepBtnText, { color: themeColors.secondaryText }]}>+</AppText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.spotOrderInputBlock}>
                <View
                  style={[
                    styles.spotOrderFieldCard,
                    {
                      backgroundColor: themeColors.input,
                      borderColor: themeColors.themeBorderColor,
                    },
                  ]}
                >
                  <View style={styles.spotOrderFieldStack}>
                    <AppText
                      style={[
                        styles.spotOrderInputLabel,
                        {
                          color: themeColors.secondaryText,
                          textAlign: "center",
                          alignSelf: "stretch",
                          top:5
                        },
                      ]}
                    >
                      Amount ({base_currency})
                    </AppText>
                    <View
                      style={[
                        styles.spotOrderInputBox,
                        {
                          backgroundColor: "transparent",
                          paddingHorizontal: 0,
                          paddingVertical: 0,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => handleAmountStep(-1)}
                        style={styles.spotOrderStepBtn}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <AppText style={[styles.spotOrderStepBtnText, { color: themeColors.secondaryText }]}>−</AppText>
                      </TouchableOpacity>
                      <TextInput
                        placeholder={"Amount"}
                        placeholderTextColor={themeColors.secondaryText}
                        value={amount}
                        onChangeText={(text) => handleQty(text)}
                        onBlur={() => handleQuantityBlur(amount, setAmount)}
                        keyboardType="numeric"
                        style={[
                          styles.spotOrderInputValue,
                          {
                            color: themeColors.text,
                            textAlign: "center",
                            ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                          },
                        ]}
                      />
                      <TouchableOpacity
                        onPress={() => handleAmountStep(1)}
                        style={styles.spotOrderStepBtn}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <AppText style={[styles.spotOrderStepBtnText, { color: themeColors.secondaryText }]}>+</AppText>
                      </TouchableOpacity>
                    </View>
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

              <View style={styles.spotOrderInputBlock}>
                <View
                  style={[
                    styles.spotOrderFieldCard,
                    {
                      backgroundColor: themeColors.input,
                      borderColor: themeColors.themeBorderColor,
                    },
                  ]}
                >
                  <View style={styles.spotOrderFieldStack}>
                    <AppText
                      style={[
                        styles.spotOrderInputLabel,
                        {
                          color: themeColors.secondaryText,
                          textAlign: "center",
                          alignSelf: "stretch",
                          marginTop:3
                        },
                      ]}
                    >
                      Total ({quote_currency})
                    </AppText>
                    <View
                      style={{
                        width: "100%",
                        minHeight: 20,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <AppText
                        style={[
                          styles.spotOrderInputValue,
                          {
                            flex: 0,
                            color: themeColors.text,
                            textAlign: "center",
                            width: "100%",
                            paddingVertical: 0,
                            lineHeight: 11,
                            minHeight: 0,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {formatTotal(totalDisplayValue) ?? "0"}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>

              {isLimit && (
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
                    <View
                      style={[
                        styles.spotOrderTifBox,
                        {
                          borderColor: limitIoc
                            ? (themeColors.spotTradeBuy ?? colors.spotTradeBuy)
                            : themeColors.themeBorderColor,
                          backgroundColor: limitIoc
                            ? `${themeColors.spotTradeBuy ?? colors.spotTradeBuy}22`
                            : "transparent",
                        },
                      ]}
                    />
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
                    <View
                      style={[
                        styles.spotOrderTifBox,
                        {
                          borderColor: limitFok
                            ? (themeColors.spotTradeBuy ?? colors.spotTradeBuy)
                            : themeColors.themeBorderColor,
                          backgroundColor: limitFok
                            ? `${themeColors.spotTradeBuy ?? colors.spotTradeBuy}22`
                            : "transparent",
                        },
                      ]}
                    />
                    <AppText style={[styles.spotOrderTifText, { color: themeColors.text }]}>FOK</AppText>
                  </TouchableOpacity>
                </View>
              )}

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
                  <Ionicons name="chevron-forward" size={16} color={themeColors.secondaryText} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Section (Order Book) – isolated so its updates do not re-render Spot or tabs */}
            <OrderBookSection
              theme={theme}
              colors={colors}
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
            />
          </View>
        </>

        {/* Bottom tabs: Open Orders / Order History / Trade History / Bots (aligned with web TradePage) */}
        {orderBookReady && (
          <View
            style={{
              flexDirection: "row",
              marginTop: 20,
              alignItems: "center",
              marginHorizontal: 8,
              justifyContent: "space-between",
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: "row", alignItems: "center", gap: 14, paddingRight: 8 }}
              style={{ flex: 1 }}
            >
              {[
                { id: 1, label: "Open Orders", count: openOrders?.length },
                { id: 2, label: "Order History", count: pastOrders?.length },
                { id: 3, label: "Trade History", count: spotMyTrades?.length },
                { id: 4, label: "Bots", count: 0 },
              ].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (activeTab === t.id) return;
                    LayoutAnimation.configureNext({
                      duration: 280,
                      update: { type: LayoutAnimation.Types.easeInEaseOut },
                      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
                    });
                    setExpandedRowIndex(null);
                    setActiveTab(t.id);
                  }}
                  style={{ alignItems: "center", minHeight: 36, justifyContent: "center", paddingHorizontal: 2 }}
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
                    {typeof t.count === "number" && t.count > 0 ? ` (${t.count})` : t.id === 4 ? " (0)" : ""}
                  </AppText>
                  <View
                    style={{
                      minWidth: 28,
                      height: 2,
                      marginTop: 4,
                      backgroundColor: activeTab === t.id ? colors.buttonBg : "transparent",
                      borderRadius: 1,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => NavigationService.navigate("Trade_History")}
              style={{ paddingVertical: 8, paddingLeft: 4, justifyContent: "center" }}
            >
              <FastImage
                source={printIcon}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
                tintColor={themeColors.text}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Tab content: both panels always mounted for smooth tab switch (like Futures); inactive panel hidden with position + opacity */}
        {orderBookReady && (
          <View
            style={[
              styles.ordersTabContentWrapper,
              {
                minHeight: 200,
                paddingBottom: 60,
              },
            ]}
          >
            {/* Open Orders Tab - always rendered; visible when activeTab === 1 */}
            <View
              style={[
                styles.ordersTabPanel,
                activeTab !== 1 && {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  opacity: 0,
                  pointerEvents: "none",
                },
              ]}
            >
              <View style={{ marginBottom: 10, paddingHorizontal: 4 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: "center", paddingVertical: 4 }}>
                  {SPOT_OPEN_ORDER_KINDS.map((k) => (
                    <TouchableOpacity
                      key={k.id}
                      activeOpacity={0.85}
                      onPress={() => setOpenOrderKindTab(k.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: openOrderKindTab === k.id ? colors.buttonBg : themeColors.themeBorderColor,
                        backgroundColor: openOrderKindTab === k.id ? `${colors.buttonBg}22` : themeColors.themeElevationColor,
                      }}
                    >
                      <AppText style={{ fontSize: 11, color: themeColors.text, fontWeight: "600" }}>{k.label}</AppText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {["All", "BUY", "SELL"].map((s) => {
                      const val = s === "All" ? "All" : s;
                      const active = orderFilter === val;
                      return (
                        <TouchableOpacity
                          key={s}
                          onPress={() => setOrderFilter(val)}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 8,
                            backgroundColor: active ? themeColors.green + "22" : themeColors.themeElevationColor,
                            borderWidth: 1,
                            borderColor: active ? themeColors.green : themeColors.themeBorderColor,
                          }}
                        >
                          <AppText style={{ fontSize: 11, color: active ? themeColors.green : themeColors.secondaryText, fontWeight: "600" }}>{s}</AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setOpenOrderKindTab("all");
                      setOrderFilter("All");
                    }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8 }}
                  >
                    <Ionicons name="refresh" size={16} color={themeColors.secondaryText} />
                    <AppText style={{ fontSize: 11, color: themeColors.secondaryText }}>Reset</AppText>
                  </TouchableOpacity>
                </View>
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
                      onPress={() => NavigationService.navigate('Open_Order')}
                    >
                      <AppText
                        style={[
                          styles.viewAllText,
                          { color: colors.buttonBg },
                        ]}
                      >
                        View More
                      </AppText>
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
                  <AppText style={{ color: themeColors.secondaryText, marginTop: 8, fontSize: 13 }}>No data</AppText>
                </View>
              )}
            </View>

            {/* Order History Tab - always rendered; visible when activeTab === 2 */}
            <View
              style={[
                styles.ordersTabPanel,
                activeTab !== 2 && {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  opacity: 0,
                  pointerEvents: "none",
                },
              ]}
            >
              {pastOrders?.length > 0 ? (
                <>
                  <View style={styles.scrollContent}>
                    {(pastOrdersSlice ?? []).map((item, index) => (
                      <View key={pastOrderKeyExtractor(item)}>
                        {renderPastOrderItem({ item, index })}
                      </View>
                    ))}
                  </View>
                  {filteredPastOrders?.length > 5 && (
                    <TouchableOpacityView
                      style={styles.viewAllButton}
                      onPress={() => NavigationService.navigate('Trade_History')}
                    >
                      <AppText
                        style={[
                          styles.viewAllText,
                          { color: colors.buttonBg },
                        ]}
                      >
                        View More
                      </AppText>
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

            {/* Trade History (socket trade_history) — tab 3 */}
            <View
              style={[
                styles.ordersTabPanel,
                activeTab !== 3 && {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  opacity: 0,
                  pointerEvents: "none",
                },
              ]}
            >
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, paddingHorizontal: 4 }}>
                {["All", "BUY", "SELL"].map((s) => {
                  const val = s === "All" ? "All" : s;
                  const active = tradeHistorySideFilter === val;
                  return (
                    <TouchableOpacity
                      key={`th_${s}`}
                      onPress={() => setTradeHistorySideFilter(val)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: active ? themeColors.green + "22" : themeColors.themeElevationColor,
                        borderWidth: 1,
                        borderColor: active ? themeColors.green : themeColors.themeBorderColor,
                      }}
                    >
                      <AppText style={{ fontSize: 11, color: active ? themeColors.green : themeColors.secondaryText, fontWeight: "600" }}>{s}</AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {filteredMyTrades?.length > 0 ? (
                <View style={styles.scrollContent}>
                  {myTradesSlice.map((item) => (
                    <View
                      key={tradeHistoryKeyExtractor(item)}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 8,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: themeColors.themeBorderColor,
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <AppText style={{ color: themeColors.text, fontWeight: "700", fontSize: 13 }}>{tradeHistoryMarketLabel(item)}</AppText>
                        <AppText
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: String(item?.side).toUpperCase() === "BUY" ? themeColors.green : themeColors.red,
                          }}
                        >
                          {String(item?.side || "").toUpperCase()}
                        </AppText>
                      </View>
                      <AppText style={{ color: themeColors.secondaryText, fontSize: 11, marginTop: 4 }}>
                        {(() => {
                          const ts = item?.executed_at || item?.executedAt || item?.created_at;
                          if (!ts) return "—";
                          const m = moment(ts);
                          return m.isValid() ? m.format("DD/MM/YYYY HH:mm:ss") : "—";
                        })()}
                      </AppText>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                        <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Price</AppText>
                        <AppText style={{ color: themeColors.text, fontSize: 12 }}>{item?.price ?? "—"}</AppText>
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                        <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Qty</AppText>
                        <AppText style={{ color: themeColors.text, fontSize: 12 }}>{item?.quantity ?? "—"}</AppText>
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                        <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Role</AppText>
                        <AppText style={{ color: themeColors.text, fontSize: 12 }}>
                          {item?.is_maker === true ? "Maker" : item?.is_maker === false ? "Taker" : "—"}
                        </AppText>
                      </View>
                    </View>
                  ))}
                  {filteredMyTrades?.length > 5 && (
                    <TouchableOpacityView
                      style={styles.viewAllButton}
                      onPress={() => NavigationService.navigate("Trade_History")}
                    >
                      <AppText style={[styles.viewAllText, { color: colors.buttonBg }]}>View More</AppText>
                    </TouchableOpacityView>
                  )}
                </View>
              ) : (
                <View style={styles.noDataRow}>
                  <FastImage
                    source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
                    resizeMode="contain"
                    style={{ width: 80, height: 80 }}
                  />
                  <AppText style={{ color: themeColors.secondaryText, marginTop: 8, fontSize: 13 }}>No data</AppText>
                </View>
              )}
            </View>

            {/* Bots — placeholder (web shows Bots(0)) */}
            <View
              style={[
                styles.ordersTabPanel,
                activeTab !== 4 && {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  opacity: 0,
                  pointerEvents: "none",
                },
              ]}
            >
              <View style={[styles.noDataRow, { paddingVertical: 24 }]}>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 14, textAlign: "center" }}>
                  Bots are not available in the app yet.
                </AppText>
              </View>
            </View>
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
          animationType="fade"
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
    flex: 6,
    paddingRight: 6,
  },
  rightPanel: {
    flex: 4,
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
    minHeight: 180,
    marginVertical: 20,
    marginHorizontal: 5,
    position: "relative",
    paddingBottom: 100,
  },
  ordersTabPanel: {
    paddingVertical: 10,
    paddingHorizontal: 4,
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
    paddingVertical: 1,
    paddingHorizontal: 3,
    minHeight: 26,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  /** Inner: label + row treated as one block (centered inside spotOrderFieldCard). */
  spotOrderFieldStack: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
  },
  spotOrderInputLabel: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 0,
    lineHeight: 9,
  },
  spotOrderInputBox: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    borderRadius: 6,
    paddingHorizontal: 2,
    minHeight: 20,
  },
  spotOrderStepBtn: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: 22,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    bottom:5
  },
  spotOrderStepBtnText: {
    fontSize: 11,
    fontWeight: "400",
  },
  spotOrderInputValue: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    textAlignVertical: "center",
    paddingVertical: 0,
    paddingHorizontal: 2,
    minHeight: 20,
    alignSelf: "stretch",
  },
  spotOrderTotalValue: {
    flex: 1,
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
    marginTop: 0,
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
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // alignItems: "flex-end",
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
  pairRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
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