import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  Platform,
} from "react-native";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState, memo } from "react";
import { useRoute, useIsFocused, useFocusEffect, useNavigation } from "@react-navigation/native";

import WebView from "react-native-webview";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate
} from "react-native-reanimated";

import FastImage from "react-native-fast-image";
import {
  back_ic,
  candle,
  checkIc,
  downIcon,
  folder,
  futureTransferIcon,
  NO_NOTIFICATION_ICON,
  NO_NOTIFICATION_ICON_LIGHT,
  printIcon,
  shareIcon,
  upIcon,
} from "../../helper/ImageAssets";
import { useAppSelector } from "../../store/hooks";
import {
  multiply,
  percentCalculation,
  toFixedFive,
  toFixedSix,
  twoFixedZero,
} from "../../helper/utility";
import HeaderTop from "../../shared/components/HeaderTop";
import { SocketContext } from "../../SocketProvider";
import RBSheet from "react-native-raw-bottom-sheet";
import { borderWidth, universalPaddingHorizontal } from "../../theme/dimens";
import {
  AppText,
  BLACK,
  BOLD,
  Button,
  CommonModal,
  EIGHT,
  ELEVEN,
  FIFTEEN,
  FOURTEEN,
  Input,
  MEDIUM,
  NINE,
  SEMI_BOLD,
  TEN,
  THIRTEEN,
  TWELVE,
  TWENTY,
  TWENTY_FOUR,
} from "../../shared";
import {
  setBuyOrders,
  setSellOrders,
  setFutureOrders,
  setFuturePositions,
  setFuturesSelectedPair,
} from "../../slices/homeSlice";
import { useDispatch } from "react-redux";
import LinearGradient from "react-native-linear-gradient";
import { placeOrder } from "../../actions/homeActions";
import { SpinnerSecond } from "../../shared/components/SpinnerSecond";
import FutureSheet1 from "./FutureSheet1";
import AdjustLeverage from "./AdjustLeverage";
import FutureSheet3 from "./FutureSheet3";
import { useFuturesSocket } from "./useFuturesSocket";
import FuturePairList from "./FuturePairList";
import NavigationService from "../../navigation/NavigationService";
import * as routes from "../../navigation/routes";
import { showError } from "../../helper/logger";
import { appOperation } from "../../appOperation";
import {
  formatPriceByTick,
  formatQtyByStep,
  normalizeOrderbookOrders,
  validateFuturesOrderInputs,
} from "../../helper/futuresUtils";
import { setLoading } from "../../slices/authSlice";
import OptionsScreen from "../Options";
import { fontFamilyBold, fontFamilySemiBold } from "../../theme/typography";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";

const Width = Dimensions.get("window").width;
const CHART_HEIGHT = 300;
const CHART_BG_FALLBACK = "transparent";
const SHIMMER_STRIP_WIDTH_DEFAULT = 100;
const ORDER_BOOK_SHIMMER_STRIP_WIDTH = 240;

/**
 * Web → App mapping (source of truth: zillion_exchange_web UsdMFutures.js)
 * - Socket: useFuturesSocket() replaces SocketContext (subscribeToFutures, unsubscribeFromFutures, setFuturesHistoryTab).
 * - Data flow: futuresData from hook → single useEffect updates pairData, openPositions, BuyOrders, SellOrders, etc.
 * - Tabs: activePositionTab + historySkip drive setFuturesHistoryTab(orders|trades|positions); handleHistoryPagination for prev/next.
 * - Order book / recent trades: normalizeOrderbookOrders + (remaining ?? size ?? sum); maxBuyVolume/maxSellVolume for depth bar.
 */

// ShimmerBox – same as Spot (wider strip for order book via shimmerStripWidth)
const ShimmerBox = ({
  width, height, borderRadius = 8, colors: colorsProp, style,
  shimmerStripWidth = SHIMMER_STRIP_WIDTH_DEFAULT,
  shimmerDuration = 700,
  shimmerToValue,
  shimmerColorsOverride
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const stripW = typeof shimmerStripWidth === "number" ? shimmerStripWidth : SHIMMER_STRIP_WIDTH_DEFAULT;
  const boneColor = isDark ? "#2A2A2A" : "#E1E9EE";
  const shimmerColors = shimmerColorsOverride || (isDark
    ? ["transparent", "rgba(255,255,255,0.06)", "transparent"]
    : ["transparent", "rgba(255,255,255,0.6)", "transparent"]);
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

const ChartSkeleton = ({ height = CHART_HEIGHT, width = Width }) => {
  const { colors: themeColors, isDark } = useTheme();
  const bg = themeColors.background;
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
              const candleShimmers = ["transparent", isDark ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.8)", "transparent"];
              return (
                <View key={i} style={{ alignItems: 'center', width: 8, height: '100%', justifyContent: 'flex-end' }}>
                  <ShimmerBox
                    width={1.5} height={candle.wickH} borderRadius={1}
                    style={{ position: 'absolute', bottom: candle.wickBot }}
                    shimmerDuration={1500} shimmerToValue={60} shimmerStripWidth={60} shimmerColorsOverride={candleShimmers}
                  />
                  <ShimmerBox
                    width={6} height={candle.bodyH} borderRadius={2}
                    style={{ position: 'absolute', bottom: candle.bodyBot }}
                    shimmerDuration={1500} shimmerToValue={60} shimmerStripWidth={60} shimmerColorsOverride={candleShimmers}
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
};

// Same chart pattern as Spot: memoized WebView + theme bg (no black flash)
const FuturesChartWebView = memo(
  React.forwardRef(({ uri, onChartLoaded, backgroundColor }, ref) => {
    const source = useMemo(() => (uri ? { uri } : null), [uri]);
    const bg = backgroundColor || "transparent";
    const style = useMemo(
      () => ({ width: Width, height: CHART_HEIGHT, backgroundColor: "transparent" }),
      []
    );
    const containerStyle = useMemo(
      () => ({ backgroundColor: "transparent" }),
      []
    );
    const handleLoadEnd = useCallback(() => {
      onChartLoaded?.();
    }, [onChartLoaded]);
    if (!uri) return <View style={style} />;
    return (
      <WebView
        ref={ref}
        source={source}
        style={style}
        containerStyle={containerStyle}
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
        onLoadEnd={handleLoadEnd}
      />
    );
  })
);
FuturesChartWebView.displayName = "FuturesChartWebView";

// Chart section with skeleton (Spot-style): skeleton until webViewReady + delay, then reveal chart
const FuturesChartSection = memo(
  ({ chartUri, webViewReady, chartRevealed, onChartLoaded, chartRef }) => {
    const showChartSkeleton = !chartRevealed;
    const { colors: themeColors, isDark } = useTheme();
    const bg = themeColors.background;
    return (
      <View style={{ position: "relative", backgroundColor: bg, overflow: "hidden" }}>
        {!isDark ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              backgroundColor: bg,
              zIndex: 10,
            }}
          />
        ) : null}
        {showChartSkeleton ? (
          <View style={{ width: Width, height: CHART_HEIGHT, backgroundColor: bg }} pointerEvents="none">
            <ChartSkeleton height={CHART_HEIGHT} width={Width} />
          </View>
        ) : null}
        <View
          style={{
            position: showChartSkeleton ? "absolute" : "relative",
            top: showChartSkeleton ? 0 : undefined,
            left: showChartSkeleton ? 0 : undefined,
            width: Width,
            height: CHART_HEIGHT,
            opacity: showChartSkeleton ? 0 : 1,
            pointerEvents: showChartSkeleton ? "none" : "auto",
            backgroundColor: bg,
          }}
        >
          <FuturesChartWebView
            ref={chartRef}
            uri={chartUri}
            onChartLoaded={onChartLoaded}
            backgroundColor={bg}
          />
        </View>
      </View>
    );
  }
);
FuturesChartSection.displayName = "FuturesChartSection";

function SecondContainerView({ children, style }) {
  return <View style={[styles.secondcontainer, style]}>{children}</View>;
}

// Order book skeleton: ShimmerBox rows (Spot-style), Price/Quantity text shown by parent
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
          <ShimmerBox width="43%" height={BONE_HEIGHT} borderRadius={BONE_RADIUS} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} />
          <ShimmerBox width="43%" height={BONE_HEIGHT} borderRadius={BONE_RADIUS} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} style={{ marginLeft: 3 }} />
        </View>
      ))}
    </View>
  );
};

export const DataLimit = [
  {
    id: "0.1",
    name: "Limit",
  },
  {
    id: "0.1",
    name: "Market",
  },
];

export const Data = [
  {
    label: "0.1",
    value: "0.1",
  },
  {
    label: "0.01",
    value: "0.01",
  },
  {
    label: "0.001",
    value: "0.001",
  },
  {
    label: "0.0001",
    value: "0.0001",
  },
  {
    label: "0.00001",
    value: "0.00001",
  },
  {
    label: "0.000001",
    value: "0.000001",
  },
];

// Helper functions for order display
const formatOrderNumber = (value, digits = 5) => {
  if (value === null || value === undefined) return "--";
  if (typeof value === "string" && value.trim() === "") return "--";
  const num = Number(value);
  if (Number.isFinite(num)) {
    return digits > 0 ? num.toFixed(digits) : `${Math.round(num)}`;
  }
  return String(value);
};

const formatOrderDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "--";
  }
  return date.toLocaleString("en-GB", { hour12: false });
};

const formatOrderPair = (item) => {
  if (item?.symbol) return item.symbol;
  if (item?.pair) return item.pair;
  const base =
    item?.baseCurrency ??
    item?.base_currency ??
    item?.coin ??
    item?.instrument ??
    "";
  const quote =
    item?.marginAsset ??
    item?.quoteCurrency ??
    item?.quote_currency ??
    item?.settleAsset ??
    "";
  const combined = [base, quote].filter(Boolean).join("/");
  if (combined) return combined;
  if (item?.name) return item.name;
  return "--";
};

const getOrderSideColor = (side, isDark = true) => {
  if (!side) return isDark ? "#fff" : "#222";
  const normalized = side.toString().toLowerCase();
  if (normalized.includes("buy") || normalized.includes("long")) {
    return colors.green;
  }
  if (normalized.includes("sell") || normalized.includes("short")) {
    return colors.red;
  }
  return isDark ? "#fff" : "#222";
};

const getOrderStatusColor = (status, fallback = colors.white) => {
  if (!status) return fallback;
  const normalized = status.toString().toLowerCase();
  if (
    normalized.includes("filled") ||
    normalized.includes("success") ||
    normalized.includes("completed")
  ) {
    return colors.green;
  }
  if (
    normalized.includes("cancel") ||
    normalized.includes("reject") ||
    normalized.includes("fail")
  ) {
    return colors.red;
  }
  return fallback;
};

const Futures = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const dispatch = useDispatch();
  const socketContextVars = useContext(SocketContext) || {};
  const { unsubscribeFromMarket, unsubscribeFromExchange } = socketContextVars;
  const webview = useRef(null);
  const routePair = route?.params?.pair ?? null;
  const rbSheetNumber = useRef();
  const rbSheetFuture1 = useRef();
  const rbSheetFuture2 = useRef();
  const rbSheetFuturePairList = useRef();
  const rbSheetFuture3 = useRef();
  const rbSheetlimit = useRef();
  const { colors: themeColors, isDark } = useTheme();
  const theme = isDark ? "Dark" : "Light";
  const coinData = useAppSelector((state) => state.home.coinData);
  const coinBalance = useAppSelector((state) => state.home.coinBalance);
  const [currency, setCurrency] = useState(null);
  const [currencyData, setCurrencyData] = useState(null);

  // console.log(coinData, "coinData futures");

  // const [chartUri, setChartUri] = useState("");
  // const [initialLoadDone, setInitialLoadDone] = useState(false);

  // --- Keep selected currency updated with socket ---
  useEffect(() => {
    if (!currency || !coinData) return;

    // Build symbol if not present (navigation / manual objects)
    const symbol =
      currency.symbol ?? `${currency.base_currency}${currency.quote_currency}`;

    const updated = coinData.find(
      (c) => c.base_currency === currency.base_currency
    );

    if (updated) {
      setCurrencyData(updated);
    }
  }, [coinData, currency]);

  const {
    base_currency,
    base_currency_id,
    quote_currency,
    quote_currency_id,
    change_percentage,
    buy_price,
    high,
    low,
  } = currencyData ?? {};

  const [mainTab, setMainTab] = useState("Futures"); // "Futures" or "Options"
  const [activeTab, setActiveTab] = useState(2);
  const [tab, setTab] = useState("Buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [isLimit, setIsLimit] = useState(true);
  const [isBuy, setIsBuy] = useState(true);
  const [total, setTotal] = useState("");
  const [numberSelectLimit, setNumberLimit] = useState("Limit");
  const [activePercentage, setActivePercentage] = useState("");
  const [_balance, _setBalance] = useState(0);
  const [numberSelect, setNumberSelect] = useState("0.0001");
  const [isConfirm, setIsConfirm] = useState(false);
  const [visible, setVisible] = useState(false);

  // const handleAmount = (text) => {
  //   setPrice(text?.toString());
  //   setTotal(multiply(text, amount));
  // };

  const handleQty = (text) => {
    if (/^\d{0,8}(\.\d{0,8})?$/.test(text) || text === "") {
      setAmount(text?.toString());
      // setTotal(multiply(text, price));
    }

    // setAmount(text?.toString());
  };

  const handleTotalPercentage = (value) => {
    setActivePercentage(value);
    if (isBuy) {
      const val = percentCalculation(
        coinBalance?.quote_currency_balance || 0,
        value
      );
      const finalQuantity = toFixedSix(
        val / (isLimit ? price || buy_price : buy_price)
      );

      handleQty(finalQuantity || 0);
      // handleTotal(percentCalculation(coinBalance?.quote_currency_balance || 0, value));
    } else {
      handleQty(
        percentCalculation(coinBalance?.base_currency_balance || 0, value)
      );
    }
  };

  const selectNumberLimitOn = (item) => {
    setNumberLimit(item.name);
    if (item.name == "Limit") {
      setIsLimit(true);
    } else {
      setIsLimit(false);
    }
  };

  const onConfirm = () => {
    const t = isLimit ? "LIMIT" : "MARKET";
    const baseSym = String(base_currency ?? "").trim().toUpperCase();
    const quoteSym = String(quote_currency ?? "").trim().toUpperCase();
    const pair = baseSym && quoteSym ? `${baseSym}${quoteSym}` : "";
    const priceForApi = !isLimit ? buy_price : isLimit && price ? price : buy_price;
    const data = {
      pair,
      type: t,
      side: isBuy ? "BUY" : "SELL",
      quantity: String(amount),
    };
    if (t === "LIMIT") {
      data.price = String(priceForApi);
    }
    dispatch(placeOrder(data, setVisible));
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
          style={styles.selectContainer}
        >
          <AppText style={{ color: themeColors.text }}>{item.label}</AppText>
          {numberSelect == item.label ? (
            <FastImage
              source={checkIc}
              tintColor={colors.green}
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

  const renderLimit = () => {
    return DataLimit?.map((item) => {
      return (
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => selectNumberLimitOn(item)}
          style={styles.selectContainer}
        >
          <AppText type={THIRTEEN} weight={BOLD} style={{ color: themeColors.text }}>
            {item.name}
          </AppText>
          {numberSelectLimit == item.name ? (
            <FastImage
              source={checkIc}
              tintColor={themeColors.text}
              resizeMode="contain"
              style={styles.checkImage}
            />
          ) : (
            <></>
          )}
        </TouchableOpacity>
      );
    });
  };
  // helpers
  const toFinite = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  const changeSymbolChart = useCallback((symbol) => {
    if (webview.current) {
      webview.current.postMessage(
        JSON.stringify({ type: "CHANGE_SYMBOL", symbol: symbol }) // dynamic symbol
      );
    }
  }, []);

  //new code
  const userData = useAppSelector((state) => state.auth.userData);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const futuresSelectedPair = useAppSelector((state) => state.home.futuresSelectedPair);
  const { _id } = userData ?? "";
  const userId = _id;
  const orderBookColor = { buy: "#1c2a2b", sell: "#301e27" };

  const wsRef = useRef(null);
  const reconnectIntervalRef = useRef(null);

  // Updated base URL for mobile chart (web: same chart base)
  const CHART_BASE_URL = isDark ? "https://zillion.wrathcode.com/futures-chart/dark/" : "https://zillion.wrathcode.com/futures-chart/light/";
  const [chartUri, setChartUri] = useState("");
  const [webViewReady, setWebViewReady] = useState(false);
  const [chartRevealed, setChartRevealed] = useState(false);
  const chartReadyDelayRef = useRef(null);
  const chartRevealDelayRef = useRef(null);
  const [chartVisible, setChartVisible] = useState(false);
  const chartProgress = useSharedValue(0);

  const animatedChartContainerStyle = useAnimatedStyle(() => ({
    height: chartProgress.value * CHART_HEIGHT,
    opacity: interpolate(chartProgress.value, [0, 0.1, 1], [0, 1, 1]),
    overflow: "hidden",
  }));

  const animatedChartContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(chartProgress.value, [0, 1], [-CHART_HEIGHT, 0]) }],
  }));

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [orderBookFocusSkeleton, setOrderBookFocusSkeleton] = useState(false);
  const orderBookFocusSkeletonRef = useRef(null);

  // --- Isolated Futures socket: connect on focus, disconnect on blur (useFuturesSocket) ---
  const {
    isConnected,
    futuresData,
    subscribeToFutures,
    unsubscribeFromFutures,
    setFuturesHistoryTab,
    socket,
  } = useFuturesSocket();

  const [pairData, setPairData] = useState([]);
  const [topPairs, setTopPairs] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState({});
  const [BuyOrders, setBuyOrders] = useState([]);
  const [RecentTrade, setRecentTrade] = useState([]);
  const [SellOrders, setSellOrders] = useState([]);
  const [isPricePositive, setIsPricePositive] = useState(true);
  const [balance, setBalance] = useState({ baseCurrency: 0, quoteCurrency: 0 });
  const [estimatedportfolio, setEstimatedportfolio] = useState(0);
  const [leverageOptions, setLeverageOptions] = useState([]);

  const [showTpSlOption, setShowTpSlOption] = useState(false);
  const [Leverage, setLeverage] = useState(1);
  const [limitPrice, setLimitPrice] = useState(0);
  const [limitPriceInput, setLimitPriceInput] = useState("");
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState("Limit");
  const [takeProfit, setTakeProfit] = useState("");
  const [takeProfit2, setTakeProfit2] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [stopLoss2, setStopLoss2] = useState("");

  const [OpenOrders, setOpenOrders] = useState([]);
  const [openPositions, setOpenPositions] = useState([]);
  const [totalMaintenanceMargin, setTotalMaintenanceMargin] = useState(0);
  const [totalUnrealizedPnl, setTotalUnrealizedPnl] = useState(0);
  const [totalIsolatedMargin, setTotalIsolatedMargin] = useState(0);
  const [ordersHistory, setOrdersHistory] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [closePositions, setClosePositions] = useState([]);
  const [historySkip, setHistorySkip] = useState(0);
  const [totalOrderHistory, setTotalOrderHistory] = useState(0);
  const [totalTradeHistory, setTotalTradeHistory] = useState(0);
  const [totalPositionHistory, setTotalPositionHistory] = useState(0);
  const HISTORY_LIMIT = 20;
  const [futureSocketDataReceived, setFutureSocketDataReceived] = useState(false);

  // --- Web parity: activePositionTab for Positions / Order history / Trade history / Position history ---
  const [activePositionTab, setActivePositionTab] = useState("positions");
  const prevHistoryTabRef = useRef(null);

  // --- Data flow from socket (web: useEffect(() => { if (!futuresData) return; ... }, [futuresData]) ---
  useEffect(() => {
    if (!futuresData) return;

    if (futuresData?.pairs) {
      setPairData(futuresData.pairs);
      const filtered =
        futuresData.pairs?.filter(
          (item) =>
            item?.short_name === "BTC" ||
            item?.short_name === "ETH" ||
            item?.short_name === "BNB"
        ) || [];
      setTopPairs(filtered);
    }

    const positions = futuresData?.open_position || [];
    setOpenPositions(positions);
    dispatch(setFuturePositions(positions));
    setOpenOrders(futuresData?.open_orders || []);

    if (futuresData?.orders_history !== undefined) {
      const arr = futuresData.orders_history || [];
      setOrdersHistory(arr);
      setTotalOrderHistory(
        futuresData.orders_history_total ?? Math.max(arr.length, historySkip + arr.length)
      );
    }
    if (futuresData?.trade_history !== undefined) {
      const arr = futuresData.trade_history || [];
      setTradeHistory(arr);
      setTotalTradeHistory(
        futuresData.trade_history_total ?? Math.max(arr.length, historySkip + arr.length)
      );
    }
    if (futuresData?.close_position !== undefined) {
      const arr = futuresData.close_position || [];
      setClosePositions(arr);
      setTotalPositionHistory(
        futuresData.close_position_total ?? (historySkip + arr.length)
      );
    }

    if (futuresData?.buy_order !== undefined) {
      setBuyOrders(futuresData.buy_order || []);
    }
    if (futuresData?.sell_order !== undefined) {
      setSellOrders(futuresData.sell_order || []);
    }
    if (futuresData?.recent_trades !== undefined) {
      setRecentTrade(futuresData.recent_trades || []);
    }

    const totalMaint = positions.reduce((sum, pos) => sum + (pos.maintenanceMargin || 0), 0);
    const totalPnl = positions.reduce((sum, pos) => sum + (pos.unrealizedPnl || 0), 0);
    const totalIM = positions.reduce((sum, pos) => sum + (pos.isolatedMargin || 0), 0);
    setTotalMaintenanceMargin(toFixedFive(totalMaint));
    setTotalUnrealizedPnl(toFixedFive(totalPnl));
    setTotalIsolatedMargin(toFixedFive(totalIM));

    setBalance({
      baseCurrency: toFixedFive(futuresData?.balance?.base_currency_balance) || 0,
      quoteCurrency: toFixedFive(futuresData?.balance?.quote_currency_balance) || 0,
    });

    dispatch(setFutureOrders({
      openOrders: futuresData?.open_orders || [],
      ordersHistory: futuresData?.orders_history || [],
      closePositions: futuresData?.close_position || [],
      tradeHistory: futuresData?.trade_history || [],
    }));

    setFutureSocketDataReceived(true);
  }, [futuresData, historySkip, dispatch]);

  // --- Subscribe to pair when selected (web: useEffect selectedCoin base/quote) ---
  useEffect(() => {
    if (!isFocused) return;
    if (!selectedCoin?.base_currency_id || !selectedCoin?.quote_currency_id) return;
    subscribeToFutures(selectedCoin.base_currency_id, selectedCoin.quote_currency_id);
    return () => {
      unsubscribeFromFutures(selectedCoin.base_currency_id, selectedCoin.quote_currency_id);
    };
  }, [
    isFocused,
    selectedCoin?.base_currency_id,
    selectedCoin?.quote_currency_id,
    subscribeToFutures,
    unsubscribeFromFutures,
  ]);

  // --- Request futures pairs list when tab focused and no pairs yet; retry once after delay if socket was not ready ---
  useEffect(() => {
    if (!isFocused || pairData?.length > 0) return;
    subscribeToFutures();
    const t = setTimeout(() => subscribeToFutures(), 800);
    return () => clearTimeout(t);
  }, [isFocused, isConnected, pairData?.length, subscribeToFutures]);

  // --- Web: futures:set_history_tab – request history when user opens that tab ---
  useEffect(() => {
    const tabMap = {
      order_history: "orders",
      exercise_history: "trades",
      position_history: "positions",
    };
    if (["positions", "open"].includes(activePositionTab)) {
      setFuturesHistoryTab(null);
      prevHistoryTabRef.current = null;
    } else if (tabMap[activePositionTab]) {
      const isSameTab = prevHistoryTabRef.current === activePositionTab;
      const skip = isSameTab ? historySkip : 0;
      if (!isSameTab) setHistorySkip(0);
      prevHistoryTabRef.current = activePositionTab;
      setFuturesHistoryTab(tabMap[activePositionTab], skip, HISTORY_LIMIT);
    }
  }, [activePositionTab, historySkip, setFuturesHistoryTab]);

  const handleHistoryPagination = useCallback(
    (action) => {
      const tabMap = {
        order_history: "orders",
        exercise_history: "trades",
        position_history: "positions",
      };
      const totalMap = {
        order_history: totalOrderHistory,
        exercise_history: totalTradeHistory,
        position_history: totalPositionHistory,
      };
      const total = totalMap[activePositionTab] ?? 0;
      let newSkip = historySkip;
      if (action === "prev" && historySkip >= HISTORY_LIMIT) {
        newSkip = historySkip - HISTORY_LIMIT;
      } else if (action === "next") {
        if (historySkip + HISTORY_LIMIT < total) newSkip = historySkip + HISTORY_LIMIT;
        else if (total === HISTORY_LIMIT && historySkip === 0) newSkip = HISTORY_LIMIT;
      } else if (action === "first") {
        newSkip = 0;
      } else if (action === "last" && total > 0) {
        newSkip = Math.max(0, total - HISTORY_LIMIT);
      }
      if (newSkip === historySkip) return;
      setHistorySkip(newSkip);
      const tab = tabMap[activePositionTab];
      if (tab) setFuturesHistoryTab(tab, newSkip, HISTORY_LIMIT);
    },
    [
      activePositionTab,
      historySkip,
      totalOrderHistory,
      totalTradeHistory,
      totalPositionHistory,
      setFuturesHistoryTab,
    ]
  );

  /* Removed old polling interval */

  // When navigating from Home with a new pair: set selected pair and show skeleton until new data loads (no UI fluctuation)
  useEffect(() => {
    const navPair = route?.params?.pair;
    if (!navPair?.short_name || !navPair?.margin_asset) return;
    const isSamePair =
      selectedCoin?.short_name === navPair.short_name &&
      selectedCoin?.margin_asset === navPair.margin_asset;
    if (isSamePair) return;
    let Pair = navPair;
    if (pairData?.length > 0) {
      const found = pairData.find(
        (p) =>
          p?.short_name === navPair.short_name &&
          p?.margin_asset === navPair.margin_asset
      );
      if (found) Pair = found;
    }
    setSelectedCoin(Pair);
    dispatch(setFuturesSelectedPair(Pair));
    setFutureSocketDataReceived(false);
    setLimitPrice(Pair?.buy_price);
    setLimitPriceInput("");
    navigation.setParams({ pair: undefined });
  }, [
    route?.params?.pair,
    pairData,
    selectedCoin?.short_name,
    selectedCoin?.margin_asset,
    dispatch,
    navigation,
  ]);

  // ********* Auto Select Coin Pair: restore from Redux (same as Spot), else route, else default ********** //
  useEffect(() => {
    if (Object.keys(selectedCoin)?.length === 0 && pairData?.length > 0) {
      var Pair;
      // Same as Spot: restore last selected pair when returning to Futures tab
      if (futuresSelectedPair?.short_name && futuresSelectedPair?.margin_asset) {
        const restored = pairData?.filter?.(
          (item) =>
            item?.short_name === futuresSelectedPair?.short_name &&
            item?.margin_asset === futuresSelectedPair?.margin_asset
        );
        Pair = restored?.length > 0 ? restored[0] : null;
      }
      if (!Pair && routePair?.short_name && routePair?.margin_asset) {
        const filtered = pairData?.filter?.(
          (item) =>
            item?.short_name === routePair?.short_name &&
            item?.margin_asset === routePair?.margin_asset
        );
        Pair = filtered?.length > 0 ? filtered[0] : pairData[0];
      }
      if (!Pair) {
        const defaultPair = pairData.find(
          (p) => p?.short_name === "BTC" && p?.margin_asset === "USDT"
        );
        Pair = defaultPair || pairData[0];
      }

      setSelectedCoin(Pair);
      dispatch(setFuturesSelectedPair(Pair));
      // Chart URI updated via useEffect
      setFutureSocketDataReceived(false);
      // if (webview.current && initialLoadDone) {
      //   console.log("🚀 ~ Futures ~ initialLoadDone:", initialLoadDone);
      //   // console.log("🚀 ~ Futures ~ Pair:", Pair?.short_name, Pair?.margin_asset);
      //   changeSymbolChart(`${Pair?.short_name}_${Pair?.margin_asset}`)
      // }else{
      //   console.log("🚀 ~ Futures ~ else:", Pair);
      //   setChartUri(`${_url}${Pair?.short_name}_${Pair?.margin_asset}`);

      // }
      const steps = 6;
      const options = [];

      for (let i = 0; i < steps; i++) {
        const val = Math.round((Pair?.max_leverage / (steps - 1)) * i);
        options.push(val < 1 ? 1 : val); // ensure minimum 1x
      }

      setLeverageOptions(options.slice(0, 6));
      setLimitPrice(Pair?.buy_price);
      setLimitPriceInput("");
      setFutureSocketDataReceived(false);
    } else if (Object.keys(selectedCoin)?.length > 0 && pairData?.length > 0) {
      let selectedItem =
        pairData?.filter?.((item) => {
          return (
            selectedCoin?.short_name === item?.short_name &&
            selectedCoin?.margin_asset === item?.margin_asset
          );
        })[0] || {};

      if (selectedItem?.buy_price >= selectedCoin?.buy_price) {
        setIsPricePositive(true);
      } else {
        setIsPricePositive(false);
      }

      setSelectedCoin(selectedItem);
      dispatch(setFuturesSelectedPair(selectedItem));
    }
  }, [pairData, futuresSelectedPair, dispatch]);

  // Pair change: persist to Redux (same as Spot) so same pair when user returns to Futures tab
  const handleSelectCoin = (data) => {
    setSelectedCoin(data);
    dispatch(setFuturesSelectedPair(data));
    setLimitPrice(data?.buy_price);
    setLimitPriceInput("");
    setFutureSocketDataReceived(false);
  };

  const lastChartPairRef = useRef(null);
  const lastChartThemeRef = useRef(theme);

  // Update Chart URL when theme or coin changes
  useEffect(() => {
    if (!selectedCoin?.short_name || !selectedCoin?.margin_asset) return;

    const pair = `${selectedCoin.short_name}_${selectedCoin.margin_asset}`;
    const url = `${CHART_BASE_URL}${pair}`;

    if (lastChartPairRef.current === pair && lastChartThemeRef.current === theme) return;

    if (lastChartThemeRef.current === theme && webview.current && initialLoadDone) {
      lastChartPairRef.current = pair;
      changeSymbolChart(pair);
    } else {
      lastChartPairRef.current = pair;
      lastChartThemeRef.current = theme;
      setWebViewReady(false);
      setChartRevealed(false);
      setChartUri(url);
    }
  }, [selectedCoin?.short_name, selectedCoin?.margin_asset, theme, initialLoadDone, changeSymbolChart, CHART_BASE_URL]);

  const onChartLoaded = useCallback(() => {
    if (chartReadyDelayRef.current) clearTimeout(chartReadyDelayRef.current);
    setInitialLoadDone(true);
    chartReadyDelayRef.current = setTimeout(() => {
      chartReadyDelayRef.current = null;
      setWebViewReady(true);
    }, 1000);
  }, []);

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

  // Open chart: Progress animation handled via Reanimated (smooth, no JS thread layout)
  useEffect(() => {
    if (chartVisible) {
      chartProgress.value = withTiming(1, {
        duration: 350,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    } else {
      chartProgress.value = withTiming(0, {
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }
  }, [chartVisible]);


  const handleCandlePress = useCallback(() => {
    setChartVisible((prev) => !prev);
  }, []);


  const futureSocketDataReceivedRef = useRef(false);
  useEffect(() => {
    futureSocketDataReceivedRef.current = futureSocketDataReceived;
  }, [futureSocketDataReceived]);

  // On focus: clear global loader; only show order book skeleton when no data yet (first load), not on every tab return
  useFocusEffect(
    useCallback(() => {
      if (unsubscribeFromMarket) unsubscribeFromMarket();
      if (unsubscribeFromExchange) unsubscribeFromExchange(null, null);

      dispatch(setLoading(false));
      if (!futureSocketDataReceivedRef.current) {
        setOrderBookFocusSkeleton(true);
        if (orderBookFocusSkeletonRef.current) clearTimeout(orderBookFocusSkeletonRef.current);
        orderBookFocusSkeletonRef.current = setTimeout(() => {
          orderBookFocusSkeletonRef.current = null;
          setOrderBookFocusSkeleton(false);
        }, 600);
      }
      return () => {
        setOrderBookFocusSkeleton(false);
        if (orderBookFocusSkeletonRef.current) {
          clearTimeout(orderBookFocusSkeletonRef.current);
          orderBookFocusSkeletonRef.current = null;
        }
      };
    }, [dispatch])
  );

  const showOrderBookSkeleton = !futureSocketDataReceived || orderBookFocusSkeleton;

  // Separate effect for cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(reconnectIntervalRef.current);
      if (chartReadyDelayRef.current) clearTimeout(chartReadyDelayRef.current);
      if (chartRevealDelayRef.current) clearTimeout(chartRevealDelayRef.current);
    };
  }, []);

  const estimatedPortfolio = async () => {
    try {
      const result = { success: true, data: { dollarPrice: 1000 } };
      if (result?.success) {
        setEstimatedportfolio(result?.data?.dollarPrice);
      }
    } catch (e) {
      console.error("Estimated portfolio error:", e);
    } finally { }
  };

  useEffect(() => {
    estimatedPortfolio();
  }, []);

  const toFixedFive = (data) => {
    if (typeof data === "number" && Number.isFinite(data)) {
      return parseFloat(data.toFixed(5));
    }
    return data ?? "--";
  };
  const toFixedThree = (data) => {
    if (typeof data === "number" && Number.isFinite(data)) {
      return parseFloat(data.toFixed(5));
    }
    return data ?? "--";
  };
  const safeNum = (val, fixed = 2) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return "0";
    return fixed === 0 ? n.toFixed(0) : n.toFixed(fixed);
  };

  const qunaityPrecision = (data) => {
    if (typeof data === "number" && selectedCoin) {
      return formatQtyByStep(data, selectedCoin);
    }
    return data;
  };

  const handleAmount = (text, size) => {
    setLimitPrice(text);
    // setTotal(multiply(text, amount));
    // setQuantity(size);
    setPercentage(0);
  };

  const pricePrecision = (data) => {
    const num = parseFloat(data);
    if (typeof num === "number" && selectedCoin) {
      return formatPriceByTick(num, selectedCoin);
    }
    return data;
  };

  const maxBuyVolume = Math.max(
    ...BuyOrders.map((o) => o.remaining ?? o.size ?? o.sum ?? 0),
    1
  );
  const maxSellVolume = Math.max(
    ...SellOrders.map((o) => o.remaining ?? o.size ?? o.sum ?? 0),
    1
  );

  const minValue = 1;
  const maxValue = selectedCoin?.max_leverage;

  const handleDecrease = () => {
    setLeverage((prev) => (prev > minValue ? prev - 1 : prev));
    setPercentage(0);
  };

  const handleIncrease = () => {
    setLeverage((prev) => (prev < maxValue ? prev + 1 : prev));
    setPercentage(0);
  };

  const handleInputChange = (e) => {
    let val = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
    if (val > maxValue) val = maxValue;
    if (val < minValue) val = minValue;
    setLeverage(val);
    setPercentage(0);
  };

  const handleSelectClick = (val) => {
    setLeverage(val);
    setPercentage(0);
  };

  // Drag handle for circle
  const handleDrag = (e) => {
    const bar = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - bar.left) / bar.width) * 100;
    const newVal = Math.round(
      (percent / 100) * (maxValue - minValue) + minValue
    );
    if (newVal >= minValue && newVal <= maxValue) setLeverage(newVal);
  };

  const [searchTerm, setSearchTerm] = useState("");

  // Filter pairs based on search term
  const filteredPairs = pairData?.filter((pair) => {
    const term = searchTerm.toLowerCase();
    return (
      pair?.short_name?.toLowerCase().includes(term) ||
      pair?.margin_asset?.toLowerCase().includes(term) ||
      pair?.name?.toLowerCase().includes(term)
    );
  });

  const handlePairListSelect = (pair) => {
    handleSelectCoin(pair);
    rbSheetFuturePairList.current?.close();
    setSearchTerm("");
    // Chart URI updated via useEffect
  };

  function computeFuturesRisk(
    entryPrice = 0,
    qty = 0,
    leverage = 0,
    maintRate = 0.005
  ) {
    if (!entryPrice || !qty || !leverage) {
      return { cost: 0, longLiq: 0, shortLiq: 0 };
    }

    // Use entry price for Limit, or selectedCoin price for Market
    let currentPrice =
      orderType === "Limit" ? entryPrice : selectedCoin?.buy_price || 0;

    // Add +0.1%
    const fractionPer = orderType === "Market" ? 1.001 : 1; // 0.1%
    currentPrice = currentPrice * fractionPer;

    entryPrice = currentPrice;

    const notional = entryPrice * qty;
    const cost = notional / leverage;

    const maintenance = notional * maintRate;
    const maintFraction = maintenance / notional;

    const longLiq = entryPrice * (1 - 1 / leverage + maintFraction);
    const shortLiq = entryPrice * (1 + 1 / leverage - maintFraction);

    return {
      cost: toFixedFive(cost),
      longLiq: pricePrecision(longLiq || 0),
      shortLiq: pricePrecision(shortLiq || 0),
    };
  }

  const [percentage, setPercentage] = useState(0);

  function computeQuantityFromBalance(percentage) {
    const fractionPer = orderType === "Market" ? 1.001 : 1; // 0.1%
    const price =
      orderType === "Limit"
        ? pricePrecision(limitPrice)
        : pricePrecision(selectedCoin?.buy_price * fractionPer) || 0;

    const marginBalance = balance?.quoteCurrency;
    const leverage = Leverage;

    if (!marginBalance || !percentage || !leverage || !price) return 0;

    // Step 1: balance % user selected
    const usableBalance = (marginBalance * percentage) / 100;

    // Step 2: max notional possible with leverage
    const maxNotional = usableBalance * leverage;

    // Step 3: qty = notional / price
    const qty = maxNotional / price;

    setQuantity(qunaityPrecision(qty || 0));
    setPercentage(percentage);
  }

  const [futuresRisk, setFuturesRisk] = useState({
    cost: 0,
    longLiq: 0,
    shortLiq: 0,
  });

  useEffect(() => {
    if (orderType === "Market") return;
    const riskData = computeFuturesRisk(
      limitPrice || 0,
      quantity || 0,
      Leverage || 0
    );
    setFuturesRisk(riskData);
  }, [limitPrice, quantity, Leverage, orderType]);

  useEffect(() => {
    if (orderType !== "Market") return;
    const riskData = computeFuturesRisk(
      limitPrice || 0,
      quantity || 0,
      Leverage || 0
    );
    setFuturesRisk(riskData);
  }, [limitPrice, quantity, Leverage, selectedCoin, orderType]);

  function validateOrder({
    balance,
    futuresRisk,
    quantity,
    orderType,
    limitPrice,
  }) {
    if (balance < futuresRisk?.cost) {
      showError("Insufficient balance");
    }
    if (quantity <= 0) {
      showError("Quantity must be greater than 0");
      return { valid: false, message: "Quantity must be greater than 0" };
    }

    if (orderType === "Limit" && limitPrice <= 0) {
      showError("Limit price must be greater than 0");
    }

    return { valid: true };
  }

  const placeFutureOrder = async (side) => {
    try {
      dispatch(setLoading(true));
      // ====== Validation ======
      if (side !== "LONG" && side !== "SHORT") {
        return showError("Invalid side. Must be LONG or SHORT.");
      }

      if (!selectedCoin) {
        return showError("No trading pair selected.");
      }

      if (!orderType) {
        return showError("Please select order type (Limit/Market).");
      }

      if (Leverage <= 0) {
        return showError("Invalid leverage selected.");
      }

      // Ensure balance is available
      if (!balance?.quoteCurrency || balance?.quoteCurrency <= 0) {
        return showError("Insufficient balance.");
      }

      // Price validations
      if (orderType === "Limit") {
        if (!limitPrice || limitPrice <= 0) {
          return showError("Please enter a valid limit price.");
        }
      }

      // Quantity validation
      if (!quantity || quantity <= 0) {
        return showError("Please enter a valid quantity.");
      }

      // Cost check
      if (balance?.quoteCurrency < futuresRisk?.cost) {
        return showError("Insufficient balance for this order.");
      }

      const finalOrderType = orderType.toUpperCase();

      if (finalOrderType !== "LIMIT" && finalOrderType !== "MARKET") {
        return showError("Invalid order type. Must be LIMIT or MARKET.");
      }

      // ====== Prepare data with precision ======
      const finalPrice =
        finalOrderType === "LIMIT"
          ? pricePrecision(limitPrice)
          : pricePrecision(selectedCoin?.buy_price);

      if (!finalPrice || finalPrice <= 0) {
        return showError("Please enter a valid limit price.");
      }

      const finalQuantity = qunaityPrecision(quantity);

      const validation = validateFuturesOrderInputs({
        price: finalOrderType === "LIMIT" ? limitPrice : selectedCoin?.buy_price,
        quantity: finalQuantity,
        pair: selectedCoin,
        orderType: finalOrderType,
      });
      if (!validation.valid) {
        return showError(validation.message);
      }

      const params = {
        baseCurrency: selectedCoin?.short_name,
        quoteCurrency: selectedCoin?.margin_asset,
        marketType: finalOrderType,
        side: side,
        quantity: +finalQuantity,
        leverage: +Leverage,
      };

      if (finalOrderType === "LIMIT") {
        params.price = +finalPrice;
      }

      if (showTpSlOption) {
        if (takeProfit > 0) {
          params.takeProfit = +takeProfit;
        }
        if (stopLoss < 0) {
          params.stopLoss = +stopLoss;
        }
      }

      // ====== Send to backend ======
      const result = await appOperation.customer.place_reverse_order(params);

      if (!result?.success) {
        return showError(result?.message || "Failed to place order.");
      }

      // ✅ Success
      showError("Order placed successfully!");
    } catch (err) {
      showError(
        err?.message || "Something went wrong while placing the order."
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const placeReverseOrder = async (
    side,
    quantityToReverse,
    leverage,
    positionId,
    positionSide,
    pairId
  ) => {
    // console.log("🚀 ~ placeReverseOrder ~ side, quantityToReverse, leverage, positionId, positionSide, pairId:", side, quantityToReverse, leverage, positionId, positionSide, pairId)
    // return
    try {
      dispatch(setLoading(true));
      // ====== Validation ======
      if (!["LONG", "SHORT"].includes(side))
        return showError("Invalid side. Must be LONG or SHORT.");
      if (!["LONG", "SHORT"].includes(positionSide))
        return showError("Invalid position side. Must be LONG or SHORT.");
      if (leverage <= 0) return showError("Invalid leverage selected.");
      if (!balance?.quoteCurrency || balance?.quoteCurrency <= 0)
        return showError("Insufficient balance.");
      if (!quantityToReverse || quantityToReverse <= 0)
        return showError("Please enter a valid quantity.");

      // ====== Find pair info from pairData ======
      const pair = pairData?.find((p) => p._id === pairId);
      if (!pair) return showError("Trading pair not found.");

      const fractionPer = 1.001; // Price fraction %
      const feePer = 0.0004; // Fee%
      const price = pair.buy_price * fractionPer;

      const finalQuantity = qunaityPrecision(quantityToReverse);

      // ====== Cost check ======
      const estimatedCost = (price * finalQuantity) / leverage;
      const estimatedFeeCOst = estimatedCost * feePer;
      if (balance?.quoteCurrency < estimatedCost + estimatedFeeCOst)
        return showError("Insufficient balance for this reverse order.");

      // ====== Close current position ======
      const closeRes = await appOperation.customer.close_position({
        positionId: positionId,
      });
      if (!closeRes?.success)
        return showError(closeRes?.message || "Failed to close position.");

      showError("Position close order placed successfully");

      // ====== Place reverse market order ======
      const oppositeSide = side; // the new side
      const result = await appOperation.customer.place_reverse_order({
        // pair.short_name,
        // pair.margin_asset,
        // oppositeSide,
        // +finalQuantity,
        // +leverage
        baseCurrency: pair.short_name,
        quoteCurrency: pair.margin_asset,
        marketType: "MARKET",
        side: oppositeSide,
        quantity: +finalQuantity,
        leverage: +leverage,
      });

      if (!result?.success)
        return showError(result?.message || "Failed to place reverse order.");
      showError("Reverse order placed successfully!");
    } catch (err) {
      showError(
        err?.message || "Something went wrong while placing the reverse order."
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const closePosition = async (positionId) => {
    try {
      dispatch(setLoading(true));
      if (!positionId) {
        return showError("Invalid position id");
      }

      // ====== API call ======
      const result = await appOperation.customer.close_position({
        positionId: positionId,
      });

      if (!result?.success) {
        return showError(result?.message || "Failed to close position.");
      }

      showError("Position close order placed successfully");
    } catch (err) {
      showError(
        err?.message || "Something went wrong while closing the position."
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const cancelFutureOrder = async (orderId) => {
    try {
      dispatch(setLoading(true));
      if (!orderId) {
        showError("Invalid order id");
        return;
      }

      // ====== API call ======
      const result = await appOperation.customer?.cancelFutureOrder({
        orderId: orderId,
      });

      if (!result?.success) {
        showError(result?.message || "Failed to cancel order.");
        return;
      }

      showError("Order cancelled successfully");
      // Remove cancelled order from local state
      setOpenOrders((prev) =>
        prev.filter((order) => {
          const id =
            order?._id ?? order?.id ?? order?.orderId ?? order?.order_id;
          return id !== orderId;
        })
      );
    } catch (err) {
      showError(
        err?.message || "Something went wrong while cancelling the order."
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCloseLeverage = async () => {
    rbSheetFuture2.current?.close();
  };
  const handleCloseFutureSheet3 = async () => {
    if (takeProfit2 > 0 || stopLoss2 < 0) {
      setTakeProfit(takeProfit2);
      setStopLoss(stopLoss2);
      setShowTpSlOption(true);
    } else {
      setShowTpSlOption(false);
    }
    rbSheetFuture3.current?.close();
  };

  const handleCloseFutureSheetDefault = async () => {
    setTakeProfit2(takeProfit);
    setStopLoss2(stopLoss);
    rbSheetFuture3.current?.close();
  };

  // Keep chart + order book mounted when tab not focused: hide with opacity so they don't remount and show skeleton on return
  return (
    <>
      <View
        style={{
          flex: 1,
          opacity: isFocused ? 1 : 0,
          pointerEvents: isFocused ? "auto" : "none",
        }}
      >
        {/* Main Tabs: Futures and Options */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            // marginTop: 10,
            // marginBottom: 10,
            paddingHorizontal: 20,
            gap: 20,
            backgroundColor: theme !== "Dark" ? "#fff" : "#0A0A0A",
          }}
        >
          {/* <TouchableOpacity
          onPress={() => setMainTab("Futures")}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: "center",
            borderBottomWidth: mainTab === "Futures" ? 2 : 0,
            borderBottomColor:
              mainTab === "Futures"
                ? theme !== "Dark"
                  ? "#F3BB2B"
                  : colors.buttonDarkBg
                : "transparent",
          }}
        >
          <AppText
            style={{
              fontSize: 16,
              fontWeight: "600",
              color:
                mainTab === "Futures"
                  ? theme !== "Dark"
                    ? "#F3BB2B"
                    : colors.buttonDarkBg
                  : theme !== "Dark"
                  ? "#222"
                  : "#9D9D9D",
            }}
          >
            Futures
          </AppText>
        </TouchableOpacity> */}
          {/* <TouchableOpacity
          onPress={() => setMainTab("Options")}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: "center",
            borderBottomWidth: mainTab === "Options" ? 2 : 0,
          }}
        >
          <AppText
            style={{
              fontSize: 16,
              fontWeight: "600",
              color:
                mainTab === "Options"
                  ? themeColors.buttonBg
                  : themeColors.secondaryText,
            }}
          >
            Options
          </AppText>
        </TouchableOpacity> */}
        </View>

        {/* Conditionally render Futures or Options content */}
        {mainTab === "Options" ? (
          <OptionsScreen hideTopTabs={true} />
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { backgroundColor: themeColors.background },
            ]}
          >

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                marginTop: 10,
                paddingHorizontal: 15,
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => {
                  rbSheetFuturePairList.current?.open();
                  setShowTpSlOption(false);
                  setTakeProfit2("");
                  setStopLoss2("");
                  setTakeProfit("");
                  setStopLoss("");
                }}
              >
                {selectedCoin?.short_name && selectedCoin?.margin_asset ? (
                  <AppText
                    type={TWENTY}
                    weight={BOLD}
                    style={[{ color: themeColors.text }]}
                  >
                    {selectedCoin.short_name}/{selectedCoin.margin_asset}
                  </AppText>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <ShimmerBox width={64} height={22} borderRadius={6} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} />
                    <ShimmerBox width={8} height={16} borderRadius={4} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} />
                    <ShimmerBox width={48} height={22} borderRadius={6} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} />
                  </View>
                )}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginLeft: 5,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      backgroundColor: themeColors.themeElevationColor,
                      borderRadius: 5,
                      paddingHorizontal: 5,
                      justifyContent: "center",
                    }}
                  >
                    <AppText type={EIGHT}>Prep</AppText>
                  </View>
                  <FastImage
                    source={downIcon}
                    style={{ width: 5, height: 5 }}
                    tintColor={themeColors.text}
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCandlePress}
                activeOpacity={0.7}
                style={{ padding: 8, justifyContent: "center" }}
              >
                <FastImage
                  source={candle}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                  tintColor={themeColors.text}
                />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.minicontainer,
                //   { backgroundColor: theme !== "Dark" ? "#F5F5F5" : "#111114" },
              ]}
            >
              <View style={{ gap: 20 }}>
                <View>
                  <AppText style={{ color: themeColors.secondaryText }} type={ELEVEN}>
                    Current Price
                  </AppText>
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                  >
                    {selectedCoin?.buy_price != null ? (
                      <AppText
                        type={TWENTY_FOUR}
                        weight={SEMI_BOLD}
                        style={{
                          color: colors.green,
                          fontSize: 15,
                        }}
                      >
                        {toFixedFive(selectedCoin.buy_price)}
                      </AppText>
                    ) : (
                      <ShimmerBox width={80} height={20} borderRadius={4} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} />
                    )}
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                  >
                    {selectedCoin?.change_percentage != null ? (
                      <>
                        <Text
                          style={{
                            color:
                              Number(selectedCoin.change_percentage) < 0
                                ? colors.red
                                : colors.green,
                          }}
                        >
                          {" "}
                          {safeNum(selectedCoin.change_percentage, 2)}%
                        </Text>
                        <FastImage
                          source={selectedCoin.change_percentage < 0 ? downIcon : upIcon}
                          resizeMode="contain"
                          style={{ width: 10, height: 10 }}
                          tintColor={
                            Number(selectedCoin.change_percentage) < 0
                              ? colors.red
                              : colors.green
                          }
                        />
                      </>
                    ) : (
                      <ShimmerBox width={48} height={16} borderRadius={4} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} />
                    )}
                  </View>
                </View>
              </View>
              <View style={{ gap: 10 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={styles.contain}>
                    <AppText style={{ color: themeColors.secondaryText }} type={ELEVEN}>24h High</AppText>
                    <AppText
                      style={{
                        color: themeColors.text,
                        fontWeight: "500",
                      }}
                      weight={SEMI_BOLD}
                    >
                      {toFixedFive(selectedCoin?.high)}
                    </AppText>
                  </View>
                  <View style={styles.contain}>
                    <AppText style={{ color: themeColors.secondaryText }} type={ELEVEN}>24h Low</AppText>
                    <AppText
                      style={{
                        color: themeColors.text,
                        fontWeight: "500",
                      }}
                      weight={SEMI_BOLD}
                    >
                      {toFixedFive(selectedCoin?.low)}
                    </AppText>
                  </View>
                  {/* <View style={styles.contain}>
              <AppText style={{ color: "#898989" }}>24h Vol</AppText>
              <AppText
                style={{
                  color: theme !== "Dark" ? "#222" : "#fff",
                  fontWeight: "500",
                }}
              >
                {twoFixedTwo(volume)} {base_currency}
              </AppText>
            </View> */}
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={styles.contain}>
                    <AppText style={{ color: themeColors.secondaryText }} type={ELEVEN}>24h Change</AppText>
                    <AppText
                      style={{
                        color: themeColors.text,
                        fontWeight: "500",
                      }}
                      weight={SEMI_BOLD}
                    >
                      {toFixedFive(selectedCoin?.change)}
                    </AppText>
                  </View>
                  <View style={styles.contain}>
                    <AppText style={{ color: "#898989", alignSelf: "flex-end" }}>
                      24h Vol
                    </AppText>
                    <AppText
                      style={{
                        color: themeColors.text,
                        fontWeight: "500",
                      }}
                      weight={SEMI_BOLD}
                    >
                      {safeNum(selectedCoin?.volume, 0)}
                    </AppText>
                  </View>
                  {/* <View style={styles.contain}>
              <AppText style={{ color: "#898989" }}>24h Vol</AppText>
              <AppText
                style={{
                  color: theme !== "Dark" ? "#222" : "#fff",
                  fontWeight: "500",
                }}
              >
                {twoFixedTwo(volume)} {base_currency}
              </AppText>
            </View> */}
                </View>
              </View>
            </View>

            <Reanimated.View style={animatedChartContainerStyle}>
              <Reanimated.View style={animatedChartContentStyle}>
                <FuturesChartSection
                  chartUri={chartUri}
                  webViewReady={webViewReady}
                  chartRevealed={chartRevealed}
                  onChartLoaded={onChartLoaded}
                  chartRef={webview}
                />
              </Reanimated.View>
            </Reanimated.View>

            <SecondContainerView style={styles.secondcontainer}>
              {/* Left Section (Order Form) - Spot structure */}
              <View style={styles.leftPanel}>
                {/* Tab */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    disabled
                    onPress={() => {
                      setTab("Cross");
                      // setIsBuy(true);
                    }}
                    style={[
                      styles.tab,
                      { borderWidth: 0, borderColor: themeColors.border },
                    ]}
                  >
                    <AppText
                      type={NINE}
                      weight={MEDIUM}
                      style={[
                        styles.tabText,
                        {
                          color: themeColors.text,
                        },
                        // tab === item && styles.activeTabText,
                      ]}
                    >
                      Cross
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => rbSheetFuture2?.current?.open()}
                    style={[
                      styles.tab,
                      { borderColor: isDark ? "#302F2F" : "#EEE" },

                      // tab === item && styles.activeTab,
                    ]}
                  >
                    <AppText
                      type={NINE}
                      style={[
                        styles.tabText,
                        {
                          color: themeColors.text,
                        },
                        // tab === item && styles.activeTabText,
                      ]}
                    >
                      {Leverage}x
                    </AppText>
                  </TouchableOpacity>
                </View>
                <View style={styles.typeContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      setIsLimit(true);
                      setOrderType("Limit");
                      setShowTpSlOption(false);
                      setQuantity("");
                      setPercentage(0);
                    }}
                    style={[
                      styles.type,
                      {
                        backgroundColor:
                          orderType === "Limit" ? colors.buttonBg : (isDark ? colors.overlayColor : "#F0F0F0"),
                      },

                      // tab === item && styles.activeTab,
                    ]}
                  >
                    <AppText
                      type={ELEVEN}
                      style={[
                        styles.tabText,
                        {
                          fontFamily: fontFamilySemiBold,
                          color: orderType === "Limit" ? colors.white : themeColors.secondaryText,
                        },
                        // tab === item && styles.activeTabText,
                      ]}
                    >
                      Limit
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsLimit(false);
                      setOrderType("Market");
                      setShowTpSlOption(false);
                      setQuantity("");
                      setPercentage(0);
                    }}
                    style={[
                      styles.type,
                      {
                        backgroundColor:
                          orderType === "Market" ? colors.buttonBg : (isDark ? colors.overlayColor : "#F0F0F0"),
                        fontFamily: fontFamilySemiBold,
                      },

                      // tab === item && styles.activeTab,
                    ]}
                  >
                    <AppText
                      type={ELEVEN}
                      style={[
                        styles.tabText,
                        {
                          color: orderType === "Market" ? colors.white : themeColors.secondaryText,
                        },
                        // tab === item && styles.activeTabText,
                      ]}
                    >
                      Market
                    </AppText>
                  </TouchableOpacity>
                </View>

                {/* Price Input */}
                <AppText style={{ color: "#9D9D9D" }} type={NINE}>
                  Price
                </AppText>
                <View style={[styles.input, { backgroundColor: isDark ? "#FFFFFF1A" : "#F5F5F5" }]}>
                  <TextInput
                    value={
                      orderType === "Limit"
                        ? limitPriceInput !== ""
                          ? limitPriceInput
                          : limitPrice?.toString()
                        : "Market Price"
                    }
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    keyboardType="numeric"
                    style={{ color: themeColors.text, width: "90%", fontSize: 12 }}
                    editable={orderType === "Limit"}
                    onChangeText={(text) => {
                      if (text === "") {
                        setLimitPriceInput("");
                        setLimitPrice(0);
                        setPercentage(0);
                        return;
                      }
                      // Validate numeric input format - allow incomplete numbers while typing
                      if (/^\d*\.?\d*$/.test(text)) {
                        setLimitPriceInput(text);
                        const num = parseFloat(text);
                        // Store the number for calculations, but keep raw text for display
                        if (!isNaN(num) && isFinite(num)) {
                          setLimitPrice(num);
                        } else if (text === ".") {
                          setLimitPrice(0);
                        }
                      }
                      setPercentage(0);
                    }}
                    onBlur={() => {
                      // Apply precision when user finishes typing
                      if (
                        limitPrice &&
                        typeof limitPrice === "number" &&
                        limitPrice > 0
                      ) {
                        const precisePrice = pricePrecision(limitPrice);
                        setLimitPrice(precisePrice);
                        setLimitPriceInput(precisePrice.toString());
                      } else {
                        setLimitPriceInput("");
                      }
                    }}
                  />
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                  >
                    {/* <AppText style={{ color: "#01BC8D" }} type={NINE}>
                Last
              </AppText> */}
                    <AppText style={{ color: "#9D9D9D" }} type={NINE}>
                      {selectedCoin?.margin_asset}
                    </AppText>
                  </View>
                </View>

                <AppText style={{ color: "#9D9D9D" }} type={NINE}>
                  Amount{" "}
                  <AppText color={BLACK} type={NINE}>
                    ({selectedCoin?.short_name})
                  </AppText>
                </AppText>
                <View style={[styles.input, { backgroundColor: isDark ? "#FFFFFF1A" : "#F5F5F5" }]}>
                  <TextInput
                    value={quantity?.toString()}
                    keyboardType="numeric"

                    placeholder={"Enter Quantity"}
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    style={{ color: themeColors.text, width: "90%", fontSize: 12 }}
                    onChangeText={(text) => {
                      if (text === "") {
                        setQuantity("");
                        setPercentage(0);
                        return;
                      }
                      // Validate numeric input format
                      if (/^\d*\.?\d*$/.test(text)) {
                        // Store the raw text while typing to preserve decimal point
                        setQuantity(text);
                      }
                      setPercentage(0);
                    }}
                    onBlur={() => {
                      // Apply precision when user finishes typing
                      if (quantity && quantity !== "") {
                        const num = parseFloat(quantity);
                        if (!isNaN(num) && isFinite(num)) {
                          setQuantity(qunaityPrecision(num));
                        }
                      }
                    }}
                  />
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                  >
                    <AppText style={{ color: "#9D9D9D" }} type={NINE}>
                      {selectedCoin?.short_name}
                    </AppText>
                  </View>
                </View>

                {/* Percent Buttons */}
                <View style={styles.percentButtons}>
                  {[25, 50, 75, 100].map((value) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => computeQuantityFromBalance(value)}
                      style={[
                        styles.percentBtn,
                        {
                          backgroundColor:
                            percentage === value ? colors.buttonDarkBg : (isDark ? "#FFFFFF1A" : "#F5F5F5"),
                        },
                      ]}
                    >
                      <AppText
                        style={{
                          color:
                            percentage === value
                              ? "#fff"
                              : themeColors.secondaryText,
                          // fontSize: 8,
                        }}
                        type={TWELVE}
                      >
                        {value}%
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <AppText style={{ color: themeColors.secondaryText }} type={TWELVE}>
                    Avail.
                  </AppText>
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                  >
                    <AppText style={{ color: themeColors.text }} type={TWELVE}>
                      {toFixedFive(balance?.quoteCurrency)}
                    </AppText>
                    <FastImage
                      source={futureTransferIcon}
                      resizeMode="contain"
                      style={{ width: 10, height: 10 }}
                      tintColor={colors.green}
                    />
                  </View>
                </View>

                <View
                  style={{
                    marginVertical: 10,
                    marginBottom: 15,
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                    onPress={() => rbSheetFuture3?.current?.open()}
                  >
                    <View
                      style={{
                        height: 15,
                        width: 15,
                        borderWidth: 1,
                        borderColor: themeColors.border,
                        borderRadius: 10,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {showTpSlOption && (
                        <View
                          style={{
                            height: 8,
                            width: 8,
                            borderWidth: 1,
                            borderColor: themeColors.border,
                            borderRadius: 10,
                            backgroundColor: colors.buttonBg,
                          }}
                        ></View>
                      )}
                    </View>
                    <AppText style={{ color: themeColors.secondaryText }} type={TWELVE}>
                      TP/SL
                    </AppText>
                  </TouchableOpacity>
                </View>

                {balance?.quoteCurrency < futuresRisk?.cost ||
                  quantity <= 0 ||
                  (orderType === "Limit" && limitPrice <= 0) ? (
                  <Button
                    children="Buy/Long"
                    containerStyle={[
                      styles.futuresActionBtn,
                      { backgroundColor: colors.buyButtonColor },
                    ]}
                    onPress={() => {
                      validateOrder({
                        balance: balance?.quoteCurrency || 0,
                        futuresRisk,
                        quantity,
                        orderType,
                        limitPrice,
                      });
                    }}
                    titleStyle={styles.futuresActionBtnTitle}
                  />
                ) : (
                  <Button
                    children="Buy/Long"
                    containerStyle={[
                      styles.futuresActionBtn,
                      { backgroundColor: colors.buyButtonColor },
                    ]}
                    onPress={() => placeFutureOrder("LONG")}
                    titleStyle={styles.futuresActionBtnTitle}
                  />
                )}
                <View style={{ marginVertical: 10 }}>
                  <View
                    style={{ flexDirection: "row", justifyContent: "space-between" }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                        Cost
                      </AppText>
                      <AppText type={TWELVE} style={{ color: themeColors.text }}>
                        {" "}
                        {futuresRisk?.cost || "---"}
                      </AppText>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                        Cost{' '}
                      </AppText>
                      <AppText type={TWELVE} style={{ color: themeColors.text }}>
                        {futuresRisk?.cost || "---"}
                      </AppText>
                    </View>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                      Max long
                    </AppText>
                    <AppText type={TWELVE} style={{ color: themeColors.text }}>
                      {" "}
                      NL
                    </AppText>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                      Max short
                    </AppText>
                    <AppText type={TWELVE} style={{ color: themeColors.text }}>
                      {" "}
                      NL
                    </AppText>
                  </View>
                </View>

                {balance?.quoteCurrency < futuresRisk?.cost ||
                  quantity <= 0 ||
                  (orderType === "Limit" && limitPrice <= 0) ? (
                  <Button
                    children="Sell/Short"
                    containerStyle={[
                      styles.futuresActionBtn,
                      { backgroundColor: colors.sellButtonColor, marginTop: 5 },
                    ]}
                    onPress={() => {
                      validateOrder({
                        balance: balance?.quoteCurrency || 0,
                        futuresRisk,
                        quantity,
                        orderType,
                        limitPrice,
                      });
                    }}
                    titleStyle={styles.futuresActionBtnTitle}
                  />
                ) : (
                  <Button
                    children="Sell/Short"
                    containerStyle={[
                      styles.futuresActionBtn,
                      { backgroundColor: colors.sellButtonColor },
                    ]}
                    onPress={() => placeFutureOrder("SHORT")}
                    titleStyle={styles.futuresActionBtnTitle}
                  />
                )}
                <View style={{ marginVertical: 10 }}>
                  <View
                    style={{ flexDirection: "row", justifyContent: "space-between" }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                        Liq Price
                      </AppText>
                      <AppText type={TWELVE} style={{ color: themeColors.text }}>
                        {" "}
                        {futuresRisk?.shortLiq || "---"}
                      </AppText>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                        Liq Price
                      </AppText>
                      <AppText type={TWELVE} style={{ color: themeColors.text }}>
                        {" "}
                        {futuresRisk?.longLiq || "---"}
                      </AppText>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 5,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                        Taker Fee
                      </AppText>
                      <AppText type={TWELVE} style={{ color: themeColors.text }}>
                        {" "}
                        0.4%
                      </AppText>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                        Maker Fee
                      </AppText>
                      <AppText type={TWELVE} style={{ color: themeColors.text }}>
                        {" "}
                        0.2%
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>
              {/* Right Section (Order Book) - Spot structure: Price/Quantity always text, skeleton in list + price box */}
              <View style={styles.rightPanel}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View>
                    <AppText style={{ color: themeColors.secondaryText, fontSize: 11 }}>Price</AppText>
                    <AppText style={{ color: themeColors.secondaryText, fontSize: 11 }}>({selectedCoin?.margin_asset})</AppText>
                  </View>
                  <View>
                    <AppText style={{ color: themeColors.secondaryText, fontSize: 11, textAlign: "right" }}>Quantity</AppText>
                    <AppText style={{ color: themeColors.secondaryText, fontSize: 11, textAlign: "right" }}>({selectedCoin?.short_name})</AppText>
                  </View>
                </View>
                <FlatList
                  data={showOrderBookSkeleton ? [] : (SellOrders || [])}
                  keyExtractor={(_, i) => i.toString()}
                  renderItem={({ item }) => {
                    const vol = toFinite(item?.remaining ?? item?.size ?? item?.sum);
                    const denom =
                      maxSellVolume > 0 && Number.isFinite(maxSellVolume)
                        ? maxSellVolume
                        : 1;
                    const ratio = clamp01(vol / denom);

                    const a = ratio;
                    const b = Math.min(1, a + 1e-6);
                    return (
                      <TouchableOpacity
                        onPress={() =>
                          handleAmount(
                            item?.price,
                            item?.remaining ?? item?.size ?? item?.sum
                          )
                        }
                      >
                        <LinearGradient
                          style={styles.orderRow}
                          colors={
                            isDark
                              ? ["#301e27", "#301e27", "transparent", "transparent"]
                              : ["#FFD9DB", "#FFD9DB", "transparent", "transparent"]
                          }
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 0 }}
                          locations={[0, a, b, 1]}
                        >
                          <AppText style={styles.orderPrice}>
                            {toFixedFive(item?.price)}
                          </AppText>
                          <AppText style={styles.orderSize}>
                            {qunaityPrecision(item?.remaining ?? item?.size)}
                          </AppText>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  }}
                  style={{ maxHeight: 220, flexGrow: 0 }}
                  inverted={false}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={
                    (showOrderBookSkeleton || SellOrders?.length === 0)
                      ? styles.emptyListContainer
                      : undefined
                  }
                  ListEmptyComponent={() => (
                    <View style={styles.emptyOrderBook}>
                      {showOrderBookSkeleton ? (
                        <OrderBookSkeleton />
                      ) : (
                        <AppText type={TWELVE} style={{ color: "grey" }}>No ask data</AppText>
                      )}
                    </View>
                  )}
                />
                <View style={styles.currentPriceBox}>
                  {showOrderBookSkeleton ? (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <ShimmerBox width="52%" height={20} borderRadius={4} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} />
                      <ShimmerBox width="50%" height={16} borderRadius={4} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} style={{ marginLeft: 3 }} />
                    </View>
                  ) : (
                    <>
                      <AppText style={[styles.currentPrice, { color: themeColors.text }]}>
                        {toFixedFive(selectedCoin?.buy_price)}
                      </AppText>
                      <AppText
                        style={[
                          styles.currentPriceUSD,
                          {
                            color:
                              Number(selectedCoin?.change_percentage) > 0
                                ? colors.green
                                : colors.red,
                          },
                        ]}
                      >
                        ~{safeNum(selectedCoin?.change_percentage, 2)}%
                      </AppText>
                    </>
                  )}
                </View>
                <FlatList
                  data={showOrderBookSkeleton ? [] : (BuyOrders || [])}
                  keyExtractor={(_, i) => i.toString()}
                  renderItem={({ item }) => {
                    const vol = toFinite(item?.remaining ?? item?.size ?? item?.sum);
                    const denom =
                      maxBuyVolume > 0 && Number.isFinite(maxBuyVolume)
                        ? maxBuyVolume
                        : 1;
                    const ratio = clamp01(vol / denom);

                    const a = ratio;
                    const b = Math.min(1, a + 1e-6);
                    return (
                      <TouchableOpacity
                        onPress={() =>
                          handleAmount(
                            item?.price,
                            item?.remaining ?? item?.size ?? item?.sum
                          )
                        }
                      >
                        <LinearGradient
                          style={styles.orderRow}
                          colors={
                            isDark
                              ? ["#1c2a2b", "#1c2a2b", "transparent", "transparent"]
                              : ["#C6F9E9", "#C6F9E9", "transparent", "transparent"]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          locations={[0, a, b, 1]}
                        >
                          <AppText style={[styles.orderPrice, { color: colors.green }]}>
                            {toFixedFive(item?.price)}
                          </AppText>
                          <AppText style={styles.orderSize}>
                            {qunaityPrecision(item?.remaining ?? item?.size)}
                          </AppText>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  }}
                  style={{ maxHeight: 220, flexGrow: 0 }}
                  inverted={false}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={
                    (showOrderBookSkeleton || BuyOrders?.length === 0)
                      ? styles.emptyListContainer
                      : undefined
                  }
                  ListEmptyComponent={() => (
                    <View style={styles.emptyOrderBook}>
                      {showOrderBookSkeleton ? (
                        <OrderBookSkeleton />
                      ) : (
                        <AppText type={TWELVE} style={{ color: "grey" }}>No bid data</AppText>
                      )}
                    </View>
                  )}
                />
              </View>
            </SecondContainerView>

            {/* Assets section - above Positions/Orders tabs (web parity) */}
            {mainTab === "Futures" && (
              <View style={styles.assetsSection}>
                <AppText style={[styles.assetsSectionTitle, { color: themeColors.text }]} weight={SEMI_BOLD}>
                  Assets
                </AppText>
                <View style={[styles.assetsCard, {
                  backgroundColor: isDark ? colors.themeElevationColor : "#F8F8F8",
                  borderColor: isDark ? colors.themeElevationColor : "#EEE"
                }]}>
                  <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginBottom: 8 }}>
                    USDT-Perp
                  </AppText>
                  <View style={styles.assetsRow}>
                    <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Total Assets</AppText>
                    <AppText type={TWELVE} style={{ color: themeColors.text }}>
                      {toFixedFive(Number(estimatedportfolio) + Number(totalIsolatedMargin)) || 0}{" "}
                      {selectedCoin?.margin_asset || "USDT"}
                    </AppText>
                  </View>
                  <View style={styles.assetsRow}>
                    <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Available</AppText>
                    <AppText type={TWELVE} style={{ color: themeColors.text }}>
                      {toFixedFive(Number(balance?.quoteCurrency) + Number(totalIsolatedMargin)) || 0}{" "}
                      {selectedCoin?.margin_asset || "USDT"}
                    </AppText>
                  </View>
                  <View style={[styles.assetsRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 0.7, borderTopColor: themeColors.border }]}>
                    <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Maintenance Margin</AppText>
                    <AppText type={TWELVE} style={{ color: themeColors.text }}>
                      {totalMaintenanceMargin || 0} {selectedCoin?.margin_asset || "USDT"}
                    </AppText>
                  </View>
                  <View style={styles.assetsRow}>
                    <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Unrealized PNL</AppText>
                    <AppText
                      type={TWELVE}
                      style={{
                        color: Number(totalUnrealizedPnl) >= 0 ? colors.green : colors.red,
                      }}
                    >
                      {totalUnrealizedPnl || 0} USDT
                    </AppText>
                  </View>
                  <View style={[styles.assetsActionsRow, { borderTopColor: isDark ? "#302F2F" : "#EEE" }]}>
                    <TouchableOpacity
                      onPress={() => NavigationService.navigate(routes.DEPOSIT_COIN_SCREEN)}
                    >
                      <AppText type={TWELVE} style={{ color: colors.green }}>Deposit Crypto</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => NavigationService.navigate(routes.TRANSFER_SCREEN)}
                    >
                      <AppText type={TWELVE} style={{ color: colors.green }}>Transfer</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Bottom Tabs - Positions, Open Orders, Order History, Trade History, Position History */}
            {mainTab === "Futures" && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.bottomTabsScroll, { borderColor: isDark ? "#302F2F" : "#EEE" }]}
                style={styles.bottomTabsScrollView}
              >
                <TouchableOpacity
                  onPress={() => setActivePositionTab("positions")}
                  style={[
                    styles.bottomTab,
                    activePositionTab === "positions" && styles.bottomTabActive,
                  ]}
                >
                  <AppText
                    style={[
                      styles.bottomTabText,
                      activePositionTab === "positions" && {
                        ...styles.bottomTabTextActive,
                        color: isDark ? colors.white : colors.black,
                      },
                    ]}
                  >
                    Positions({openPositions?.length || 0})
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActivePositionTab("open")}
                  style={[
                    styles.bottomTab,
                    activePositionTab === "open" && styles.bottomTabActive,
                  ]}
                >
                  <AppText
                    style={[
                      styles.bottomTabText,
                      activePositionTab === "open" && {
                        ...styles.bottomTabTextActive,
                        color: isDark ? colors.white : colors.black,
                      },
                    ]}
                  >
                    Open Orders({OpenOrders?.length || 0})
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActivePositionTab("order_history")}
                  style={[
                    styles.bottomTab,
                    activePositionTab === "order_history" && styles.bottomTabActive,
                  ]}
                >
                  <AppText
                    style={[
                      styles.bottomTabText,
                      activePositionTab === "order_history" && {
                        ...styles.bottomTabTextActive,
                        color: isDark ? colors.white : colors.black,
                      },
                    ]}
                  >
                    Order History
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActivePositionTab("exercise_history")}
                  style={[
                    styles.bottomTab,
                    activePositionTab === "exercise_history" && styles.bottomTabActive,
                  ]}
                >
                  <AppText
                    style={[
                      styles.bottomTabText,
                      activePositionTab === "exercise_history" && {
                        ...styles.bottomTabTextActive,
                        color: isDark ? colors.white : colors.black,
                      },
                    ]}
                  >
                    Trade History
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActivePositionTab("position_history")}
                  style={[
                    styles.bottomTab,
                    activePositionTab === "position_history" && styles.bottomTabActive,
                  ]}
                >
                  <AppText
                    style={[
                      styles.bottomTabText,
                      activePositionTab === "position_history" && {
                        ...styles.bottomTabTextActive,
                        color: isDark ? colors.white : colors.black,
                      },
                    ]}
                  >
                    Position History
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    NavigationService.navigate(routes.FUTURE_ORDER_HISTORY, { selectedCoin })
                  }
                  style={{ paddingHorizontal: 8, justifyContent: "center" }}
                >
                  <FastImage
                    source={printIcon}
                    resizeMode="contain"
                    style={{ width: 18, height: 18 }}
                    tintColor={themeColors.secondaryText}
                  />
                </TouchableOpacity>
              </ScrollView>
            )}


            {mainTab === "Futures" && (
              <>
                {activePositionTab === "positions" ? (
                  openPositions?.length === 0 ? (
                    <View
                      style={{
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 40,
                      }}
                    >
                      <FastImage
                        source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
                        resizeMode="contain"
                        style={{ width: 80, height: 80, marginBottom: 16 }}
                      />
                    </View>
                  ) : (
                    openPositions?.map((position, index) => {
                      const side =
                        position?.side ??
                        position?.positionSide ??
                        position?.direction ??
                        position?.position_side;
                      const leverage =
                        position?.leverage ??
                        position?.leverage_value ??
                        position?.current_leverage;
                      const marginMode = position?.marginMode ?? position?.marginType;
                      const pnlValue =
                        position?.unrealizedPnl ?? position?.pnl ?? position?.profit ?? 0;
                      const pnlNumeric = Number(pnlValue);
                      const pnlColor = Number.isFinite(pnlNumeric)
                        ? pnlNumeric >= 0
                          ? colors.green
                          : colors.red
                        : colors.white;
                      const quantity =
                        position?.quantity ?? position?.positionAmt ?? position?.size;
                      const filled =
                        position?.executedQty ??
                        position?.filled_quantity ??
                        position?.filledQty ??
                        0;
                      const entryPrice =
                        position?.entryPrice ??
                        position?.avgEntryPrice ??
                        position?.price;
                      const markPrice =
                        position?.markPrice ??
                        position?.lastMarkPrice ??
                        position?.lastPrice ??
                        position?.marketPrice;
                      const liquidationPrice = position?.liquidationPrice;
                      const isolatedMargin = position?.isolatedMargin;
                      const maintenanceMargin = position?.maintenanceMargin;
                      const time =
                        position?.updatedAt ?? position?.createdAt ?? position?.time;
                      const leverageLabel = leverage ? `${leverage}x` : "";
                      const directionLabel = [side, leverageLabel]
                        .filter(Boolean)
                        .join(" • ");

                      return (
                        <View style={[styles.orderCard, { backgroundColor: isDark ? colors.themeElevationColor : "#FFFFFF", borderColor: isDark ? colors.themeElevationColor : "#EEE", borderTopWidth: 1 }]}>
                          <View style={styles.orderHeader}>
                            <View style={styles.headerLeft}>
                              <AppText style={[styles.symbolText, { color: themeColors.text }]}>
                                {formatOrderPair(position)}
                              </AppText>
                              {marginMode && (
                                <View style={[styles.perpBadge, { backgroundColor: isDark ? "#2b2b2b" : "#EEE" }]}>
                                  <AppText style={[styles.perpText, { color: themeColors.secondaryText }]}>{marginMode}</AppText>
                                </View>
                              )}
                            </View>
                            <AppText style={[styles.timeText, { color: themeColors.secondaryText }]}>
                              {formatOrderDate(time)}
                            </AppText>
                          </View>

                          <View style={styles.typeRow}>
                            <AppText
                              style={[
                                styles.typeText,
                                { color: getOrderSideColor(side) },
                              ]}
                            >
                              {directionLabel || "--"}
                            </AppText>
                          </View>

                          <View style={styles.infoRow}>
                            <View style={styles.labels}>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>PnL</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Quantity</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Filled</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Entry Price</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Mark Price</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Liq. Price</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Isolated Margin</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Maintenance Margin</AppText>
                            </View>
                            <View style={styles.values}>
                              <AppText style={[styles.value, { color: pnlColor }]}>
                                {formatOrderNumber(pnlValue)}
                              </AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>
                                {formatOrderNumber(quantity)}
                              </AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>
                                {formatOrderNumber(filled)}
                              </AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>
                                {formatOrderNumber(entryPrice)}
                              </AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>
                                {formatOrderNumber(markPrice)}
                              </AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>
                                {formatOrderNumber(liquidationPrice)}
                              </AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>
                                {formatOrderNumber(isolatedMargin)}
                              </AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>
                                {formatOrderNumber(maintenanceMargin)}
                              </AppText>
                            </View>
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              marginTop: 12,
                            }}
                          >

                            <TouchableOpacity
                              style={{
                                flex: 1,
                                backgroundColor: isDark ? "#FFFFFF0A" : "#F5F5F5",
                                height: 36,
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: themeColors.border,
                                marginLeft: 6,
                              }}
                              onPress={() => closePosition(position?._id)}
                            >
                              <AppText type={TWELVE}>Market Close</AppText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )
                ) : activePositionTab === "open" ? (
                  OpenOrders?.length === 0 ? (
                    <View
                      style={{
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 40,
                      }}
                    >
                      <FastImage
                        source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
                        resizeMode="contain"
                        style={{ width: 80, height: 80, marginBottom: 16 }}
                      />
                    </View>
                  ) : (
                    OpenOrders?.map((order, index) => {
                      const side =
                        order?.side ??
                        order?.positionSide ??
                        order?.direction ??
                        order?.order_side ??
                        order?.position_side;
                      const type =
                        order?.type ??
                        order?.orderType ??
                        order?.order_type ??
                        order?.positionType;
                      const status = order?.status ?? order?.order_status ?? order?.state;
                      const quantity =
                        order?.quantity ?? order?.origQty ?? order?.size ?? order?.amount;
                      const filled =
                        order?.executedQty ??
                        order?.filled_quantity ??
                        order?.filledQty ??
                        order?.cumulativeFilledQuantity;
                      const price =
                        order?.price ??
                        order?.orderPrice ??
                        order?.limitPrice ??
                        order?.entryPrice;
                      const triggerPrice =
                        order?.triggerPrice ?? order?.stopPrice ?? order?.stop_price;
                      const time =
                        order?.createdAt ??
                        order?.updatedAt ??
                        order?.orderTime ??
                        order?.time;
                      const reduceOnly = order?.reduceOnly ?? false;
                      const postOnly = order?.postOnly ?? false;
                      const takeProfit = order?.takeProfitPnl ?? null;
                      const stopLoss = order?.stopLossPnl ?? null;
                      const orderId = order?.orderId;

                      // Trigger Condition
                      let triggerCondition = "---";
                      if (order.isSL && order.positionSide) {
                        triggerCondition =
                          order.positionSide === "LONG" ? `<= ${price}` : `>= ${price}`;
                      } else if (order.isTP && order.positionSide) {
                        triggerCondition =
                          order.positionSide === "LONG" ? `>= ${price}` : `<= ${price}`;
                      }

                      return (
                        <View key={orderId || index} style={[styles.orderCard, { backgroundColor: isDark ? "#0f0f0f" : "#FFFFFF", borderColor: isDark ? "#1a1a1a" : "#EEE", borderTopWidth: 1 }]}>
                          {/* Header */}
                          <View style={styles.orderHeader}>
                            <View style={styles.headerLeft}>
                              <AppText style={[styles.symbolText, { color: themeColors.text }]}>
                                {formatOrderPair(order)}
                              </AppText>
                              {type && (
                                <View style={[styles.perpBadge, { backgroundColor: isDark ? "#2b2b2b" : "#EEE" }]}>
                                  <AppText style={[styles.perpText, { color: themeColors.secondaryText }]}>{type}</AppText>
                                </View>
                              )}
                            </View>
                            <AppText style={[styles.timeText, { color: themeColors.secondaryText }]}>
                              {formatOrderDate(time)}
                            </AppText>
                          </View>

                          <View style={styles.typeRow}>
                            <AppText
                              style={[styles.typeText, { color: getOrderSideColor(side, isDark) }]}
                            >
                              {`${type || "--"} / ${side || "--"}`}
                            </AppText>
                          </View>

                          <View style={styles.infoRow}>
                            <View style={styles.labels}>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Quantity</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Filled</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Price</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Trigger</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>TP/SL</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Reduce</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Post</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Status</AppText>
                            </View>
                            <View style={styles.values}>
                              <AppText style={[styles.value, { color: themeColors.text }]}>
                                {formatOrderNumber(quantity)}
                              </AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>
                                {formatOrderNumber(filled)}
                              </AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>
                                {formatOrderNumber(price)}
                              </AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>{triggerCondition}</AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>
                                {takeProfit ?? stopLoss ?? "---"}
                              </AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>
                                {reduceOnly ? "Yes" : "No"}
                              </AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>
                                {postOnly ? "Yes" : "No"}
                              </AppText>
                              <AppText
                                style={[
                                  styles.value,
                                  { color: getOrderStatusColor(status, colors.white) },
                                ]}
                              >
                                {status ?? "--"}
                              </AppText>
                            </View>
                          </View>

                          {/* Cancel Button */}
                          <View
                            style={{
                              marginTop: 12,
                              flexDirection: "row",
                              justifyContent: "flex-end",
                            }}
                          >
                            <TouchableOpacity
                              style={{
                                backgroundColor: colors.red + "20",
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: colors.red,
                              }}
                              onPress={() => orderId && cancelFutureOrder(orderId)}
                            >
                              <AppText
                                type={TWELVE}
                                weight={SEMI_BOLD}
                                style={{ color: colors.red }}
                              >
                                Cancel
                              </AppText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )
                ) : activePositionTab === "order_history" ? (
                  ordersHistory?.length === 0 ? (
                    <View style={styles.emptyHistoryView}>
                      <FastImage
                        source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
                        resizeMode="contain"
                        style={{ width: 80, height: 80, marginBottom: 16 }}
                        tintColor={themeColors.secondaryText}
                      />
                    </View>
                  ) : (
                    <>
                      {(ordersHistory || []).slice(0, 20).map((order, index) => (
                        <View key={order?.orderId || index} style={[styles.orderCard, { backgroundColor: isDark ? colors.themeElevationColor : "#FFFFFF", borderColor: isDark ? "#1a1a1a" : "#EEE", borderTopWidth: 1 }]}>
                          <View style={styles.orderHeader}>
                            <View style={styles.headerLeft}>
                              <AppText style={[styles.symbolText, { color: themeColors.text }]}>{formatOrderPair(order)}</AppText>
                            </View>
                            <AppText style={[styles.timeText, { color: themeColors.secondaryText }]}>{formatOrderDate(order?.createdAt ?? order?.updatedAt)}</AppText>
                          </View>
                          <View style={styles.typeRow}>
                            <AppText style={[styles.typeText, { color: getOrderSideColor(order?.side ?? order?.order_side) }]}>
                              {order?.type ?? order?.order_type} / {order?.side ?? order?.order_side}
                            </AppText>
                          </View>
                          <View style={styles.infoRow}>
                            <View style={styles.labels}>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Quantity</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Price</AppText>
                              <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Status</AppText>
                            </View>
                            <View style={styles.values}>
                              <AppText style={[styles.value, { color: themeColors.text }]}>{formatOrderNumber(order?.quantity)}</AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>{formatOrderNumber(order?.price)}</AppText>
                              <AppText style={[styles.value, { color: themeColors.text }]}>{order?.status ?? order?.order_status ?? "--"}</AppText>
                            </View>
                          </View>
                        </View>
                      ))}
                      <TouchableOpacity onPress={() => NavigationService.navigate(routes.FUTURE_ORDER_HISTORY, { selectedCoin })} style={{ alignSelf: "center", marginVertical: 16 }}>
                        <AppText type={TWELVE} style={{ color: colors.green }}>View all</AppText>
                      </TouchableOpacity>
                    </>
                  )
                ) : activePositionTab === "exercise_history" ? (
                  tradeHistory?.length === 0 ? (
                    <View style={styles.emptyHistoryView}>
                      <FastImage source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT} resizeMode="contain" style={{ width: 80, height: 80, marginBottom: 16 }} />
                    </View>
                  ) : (
                    (tradeHistory || []).slice(0, 20).map((item, index) => (
                      <View key={item?.tradeId || index} style={[styles.orderCard, { backgroundColor: isDark ? colors.themeElevationColor : "#FFFFFF", borderColor: isDark ? "#1a1a1a" : "#EEE", borderTopWidth: 1 }]}>
                        <View style={styles.orderHeader}>
                          <AppText style={[styles.symbolText, { color: themeColors.text }]}>{formatOrderPair(item)}</AppText>
                          <AppText style={[styles.timeText, { color: themeColors.secondaryText }]}>{formatOrderDate(item?.time ?? item?.createdAt)}</AppText>
                        </View>
                        <View style={styles.infoRow}>
                          <View style={styles.labels}>
                            <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Side</AppText>
                            <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Quantity</AppText>
                            <AppText style={[styles.label, { color: isDark ? "#5c5c5c" : "#888" }]}>Price</AppText>
                          </View>
                          <View style={styles.values}>
                            <AppText style={[styles.value, { color: getOrderSideColor(item?.side, isDark) }]}>{item?.side ?? "--"}</AppText>
                            <AppText style={[styles.value, { color: themeColors.text }]}>{formatOrderNumber(item?.quantity ?? item?.qty)}</AppText>
                            <AppText style={[styles.value, { color: themeColors.text }]}>{formatOrderNumber(item?.price)}</AppText>
                          </View>
                        </View>
                      </View>
                    ))
                  )
                ) : activePositionTab === "position_history" ? (
                  closePositions?.length === 0 ? (
                    <View style={styles.emptyHistoryView}>
                      <FastImage source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT} resizeMode="contain" style={{ width: 80, height: 80, marginBottom: 16 }} />
                    </View>
                  ) : (
                    (closePositions || []).slice(0, 20).map((position, index) => (
                      <View key={position?._id || index} style={[styles.orderCard, { backgroundColor: isDark ? colors.themeElevationColor : "#FFFFFF", borderColor: isDark ? "#1a1a1a" : "#EEE", borderTopWidth: 1 }]}>
                        <View style={styles.orderHeader}>
                          <AppText style={[styles.symbolText, { color: themeColors.text }]}>{formatOrderPair(position)}</AppText>
                          <AppText style={[styles.timeText, { color: themeColors.secondaryText }]}>{formatOrderDate(position?.closedAt ?? position?.updatedAt)}</AppText>
                        </View>
                        <View style={styles.infoRow}>
                          <View style={styles.labels}>
                            <AppText style={styles.label}>Side</AppText>
                            <AppText style={styles.label}>Quantity</AppText>
                            <AppText style={styles.label}>PnL</AppText>
                          </View>
                          <View style={styles.values}>
                            <AppText style={[styles.value, { color: getOrderSideColor(position?.side) }]}>{position?.side ?? "--"}</AppText>
                            <AppText style={styles.value}>{formatOrderNumber(position?.quantity)}</AppText>
                            <AppText style={[styles.value, { color: (position?.unrealizedPnl ?? position?.pnl) >= 0 ? colors.green : colors.red }]}>{formatOrderNumber(position?.unrealizedPnl ?? position?.pnl)}</AppText>
                          </View>
                        </View>
                      </View>
                    ))
                  )
                ) : null}
              </>
            )}

            <CommonModal
              isVisible={isConfirm}
              onBackButtonPress={() => setIsConfirm(false)}
              title={"Are you sure you want to\nexecute this order?"}
              onPressNo={() => setIsConfirm(false)}
              onPressYes={() => {
                setIsConfirm(false);
                onConfirm();
              }}
              theme={theme}
            />
            {/* <PopupModal visible={visible} handleVisiblity={handlePopup} /> */}
            <RBSheet
              ref={rbSheetNumber}
              closeOnDragDown={true}
              closeOnPressMask={true}
              height={300}
              animationType="none"
              customStyles={{
                container: {
                  backgroundColor: themeColors.background,
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
              ref={rbSheetFuture1}
              closeOnDragDown={true}
              closeOnPressMask={true}
              height={300}
              animationType="none"
              customStyles={{
                container: {
                  backgroundColor: themeColors.background,
                  height: 400,
                  borderRadius: 20,
                  paddingHorizontal: universalPaddingHorizontal,
                },
                wrapper: {
                  backgroundColor: colors.themeElevationColor,
                },
                draggableIcon: {
                  backgroundColor: "transparent",
                },
              }}
            >
              <FutureSheet1 />
            </RBSheet>
            <RBSheet
              ref={rbSheetFuture2}
              closeOnDragDown={true}
              closeOnPressMask={true}
              height={300}
              animationType="none"
              customStyles={{
                container: {
                  backgroundColor: themeColors.background,
                  height: 300,
                  borderRadius: 20,
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
              <AdjustLeverage
                onSelectLeverage={setLeverage}
                leverage={Leverage}
                onClose={handleCloseLeverage}
              />
            </RBSheet>
            <RBSheet
              ref={rbSheetFuturePairList}
              closeOnDragDown={true}
              closeOnPressMask={true}
              height={450}
              animationType="none"
              customStyles={{
                container: {
                  backgroundColor: themeColors.background,
                  height: 450,
                  borderRadius: 20,
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
              <FuturePairList
                pairs={filteredPairs}
                selectedPair={selectedCoin}
                onSelectPair={handlePairListSelect}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                theme={theme}
              />
            </RBSheet>
            <RBSheet
              ref={rbSheetFuture3}
              closeOnDragDown={false}
              closeOnPressMask={false}
              height={350}
              animationType="none"
              customStyles={{
                container: {
                  backgroundColor: themeColors.background,
                  height: 350,
                  borderRadius: 20,
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
              <FutureSheet3
                stopLoss={stopLoss2}
                takeProfit={takeProfit2}
                setStopLoss={setStopLoss2}
                setTakeProfit={setTakeProfit2}
                onClose={handleCloseFutureSheet3}
                onCloseDefault={handleCloseFutureSheetDefault}
              />
            </RBSheet>
            <RBSheet
              ref={rbSheetlimit}
              closeOnDragDown={true}
              closeOnPressMask={true}
              height={100}
              animationType="none"
              customStyles={{
                container: {
                  backgroundColor: themeColors.background,
                  height: 150,
                  borderRadius: 10,
                  paddingHorizontal: universalPaddingHorizontal,
                },
                wrapper: {
                  backgroundColor: "#0006",
                },
                draggableIcon: {
                  // backgroundColor: 'transparent',
                  width: 120,
                },
              }}
            >
              {renderLimit(theme)}
            </RBSheet>
          </ScrollView>
        )}
      </View>
    </>
  );
};

export default Futures;
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    // padding: 12,
  },
  minicontainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  contain: {
    // flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  barContainer: {
    padding: 16,
    backgroundColor: "#fff",
    // flex: 1,
    justifyContent: "center",
    height: 500,
  },
  webview: {
    flex: 1,
  },
  // secondcontainer: {
  //   padding: 12,
  //   backgroundColor: '#fff',
  // },
  // Spot screen structure: left = order form (flex 6), right = order book (flex 4)
  secondcontainer: {
    flexDirection: "row",
    padding: 10,
    marginRight: 10,
  },
  leftPanel: {
    flex: 6,
    paddingRight: 8,
  },
  rightPanel: {
    flex: 4,
    paddingLeft: 8,
  },
  tabContainer: {
    flexDirection: "row",
    marginVertical: 10,
  },
  tab: {
    // flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    // backgroundColor: "#f2f2f2",
    alignItems: "center",
    borderRadius: 4,
    marginRight: 6,
    borderWidth: 1,
  },
  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  type: {
    width: "50%",
    paddingVertical: 8,
    // paddingHorizontal: 16,
    // flex: 1,
    // paddingHorizontal: 8,
    // paddingVertical: 4,
    // backgroundColor: "#f2f2f2",
    alignItems: "center",
    borderRadius: 4,
    marginRight: 6,
    borderWidth: 0.5,
    borderColor: "#FFFFFF80",
  },
  typeText: {
    fontWeight: "500",
    color: "#000",
  },
  activeType: {
    backgroundColor: "#00C076",
  },
  activeTypeText: {
    color: "#fff",
  },
  activeTab: {
    backgroundColor: "#00C076",
  },
  tabText: {
    color: "#000",
  },
  activeTabText: {
    color: "#fff",
  },
  futuresActionBtn: {
    height: 40,
    minHeight: 40,
    borderRadius: 8,
    marginVertical: 4,
  },
  futuresActionBtnTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  assetsSection: {
    marginTop: 20,
    marginHorizontal: 15,
    marginBottom: 12,
  },
  assetsSectionTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 10,
  },
  assetsCard: {
    backgroundColor: colors.themeElevationColor,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
  },
  assetsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  assetsActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  bottomTabsScrollView: {
    maxHeight: 56,
    marginBottom: 8,
  },
  bottomTabsScroll: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    gap: 4,
  },
  bottomTab: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
  },
  bottomTabText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    color: "#9D9D9D",
  },
  bottomTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.buttonBg,
  },
  bottomTabTextActive: {
    color: colors.white, // overridden at usage-site for Light theme
  },
  emptyHistoryView: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  dropdown: {
    flexDirection: "row",
    borderWidth: 1,
    padding: 6,
    borderRadius: 6,
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 9,
    color: "#9D9D9D",
  },
  input: {
    // borderWidth: 1,
    // borderColor: '#ccc',
    height: 40,
    borderRadius: 6,
    paddingHorizontal: 12,
    // paddingVertical: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    // width: "100%",
    marginBottom: 10,
    // fontWeight: "600",
    marginTop: 3,
  },
  percentButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    // marginTop: 8,
  },
  percentBtn: {
    // borderWidth: 1,
    // borderColor: '#aaa',
    borderRadius: 3,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  selectedPercentBtn: (theme) => ({
    backgroundColor: colors.buttonDarkBg,
    // borderColor: '#00C076',
  }),
  assetBox: {
    // borderWidth: 1,
    // borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  assetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  assetLabel: {
    // color: "#222",
    fontSize: 13,
    fontWeight: "600",
  },
  assetValue: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  assetActionBtn: {
    // borderWidth: 1,
    // borderColor: '#999',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginRight: 4,
    // backgroundColor: "#EBEAE7",
  },
  assetActionText: {
    fontSize: 11,
    // color: "#000",
    fontWeight: "500",
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
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  orderPrice: {
    color: "#E86161",
    fontSize: 12,
    width: "43%",
  },
  orderSize: {
    // color: "#000",
    fontSize: 12,
    width: "43%",
    textAlign: "right",
  },
  currentPriceBox: {
    marginBottom: 10,
    // flexDirection: "row",
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
    // color: "#9D9D9D",
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
  },
  headerCell: { fontWeight: "bold", fontSize: 13 },
  orderCard: {
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  symbolText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginRight: 8,
  },
  perpBadge: {
    backgroundColor: "#2b2b2b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  perpText: {
    color: "#c7c7c7",
    fontSize: 11,
  },
  timeText: {
    color: "#77797a",
    fontSize: 11,
  },
  typeRow: {
    marginVertical: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 6,
    gap: 16,
  },
  labels: {
    flex: 1,
  },
  values: {
    alignItems: "flex-end",
    minWidth: 140,
  },
  label: {
    color: "#5c5c5c",
    fontSize: 11,
    marginBottom: 10,
  },
  value: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyOrderBook: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
});