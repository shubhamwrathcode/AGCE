import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  AppState,
  Animated,
  Alert,
} from "react-native";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SpotHeader from "../../shared/components/spotHeader/SpotHeader";
import TradingDataModal from "../../common/TradingDataModal/TradingDataModal";
import FastImage from "react-native-fast-image";
import { parseCrossRisk } from "./crossMargin/CrossMarginRiskModal";
import {
  buildMarginRiskRow,
  formatMarginLevel,
  getMarginLevelStatus,
  parseMarginLevel,
  pairHasDebt,
  resolveMarginThresholds,
} from "./crossMargin/marginLevelUtils";
import BuyCryptoScreen from "../buyCrypto/BuyCryptoScreen";
import {
  checkIc,
  downIcon,
  INFO,
  NO_NOTIFICATION_ICON,
  NO_NOTIFICATION_ICON_LIGHT,
  REMOVE,
  right_ic,
  tick,
} from "../../helper/ImageAssets";
import { useAppSelector } from "../../store/hooks";
import {
  multiply,
  percentCalculation,
  toFixedEight,
  tradeHistoryBaseAsset,
} from "../../helper/utility";
import { colors, lightTheme } from "../../theme/colors";
import { buildCoinImageUri } from "../../helper/coinIconUrl";
import {
  AppText,
  BOLD,
  MEDIUM,
  SEMI_BOLD,
  THIRTEEN,
  FOURTEEN,
  FIFTEEN,
} from "../../shared";
import { getPastOrders } from "../../actions/homeActions";
import { getTradeHistory } from "../../actions/walletActions";
import {
  setBuyOrders,
  setPastOrders,
  setRecentTrades,
  setSellOrders,
  setSpotSelectedPair,
  setOpenOrders,
} from "../../slices/homeSlice";
import { clearTradeHistory } from "../../slices/walletSlice";
import { setLoading } from "../../slices/authSlice";
import { useFocusEffect, useIsFocused, useRoute, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  MARKET_SCREEN,
  SPOT_ORDER_HISTORY_DETAIL,
  SPOT_CHART_SCREEN,
  NAVIGATION_AUTH_STACK,
  LOGIN_SCREEN,
} from "../../navigation/routes";
import { placeOrder, getCrossAccount, getCrossBorrowable } from "../../actions/homeActions";
import { addToFavorites, getFavoriteArray } from "../../actions/homeActions";
import NavigationService from "../../navigation/NavigationService";
import moment from "moment";
import { useTheme } from "../../hooks/useTheme";
import { SocketContext } from "../../SocketProvider";
import { showError } from "../../helper/logger";
import { appOperation } from "../../appOperation";
import { CUSTOMER_TYPE } from "../../appOperation/types";
import { styles } from "./spot/spotStyles";
import {
  Data,
  ORDER_TYPE_SHEET_ADVANCED,
  ORDER_TYPE_SHEET_BASIC,
} from "./spot/spotConstants";
import {
  dedupeSpotOrderHistoryRows,
  getStableId,
  matchesOpenOrderKind,
  orderBookDataEqual,
  safeToFixed8,
  spotMeOpenOrdersItemsFromResponse,
  spotPastOrderMatchesScreenPair,
  tradeHistoryMarketLabel,
} from "./spot/spotOrderHelpers";
import { OrderBookSection } from "./spot/OrderBookSection";
import { SpotOrderForm } from "./spot/SpotOrderForm";
import { SpotOrdersPanel } from "./spot/SpotOrdersPanel";
import { SpotNumberSheet, SpotOverlaySheets } from "./spot/SpotSheets";

const { height: WindowHeight } = Dimensions.get("window");
const Spot = () => {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, theme, isDark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { subscribeToExchange, unsubscribeFromExchange, unsubscribeFromMarket, unsubscribeFromFutures } =
    useContext(SocketContext) || {};
  const dispatch = useDispatch();

  const coinData = useAppSelector((state) => state.home.coinData);
  const spotSelectedPair = useAppSelector((state) => state.home.spotSelectedPair);
  const coinBalance = useAppSelector((state) => state.home.coinBalance);
  const crossAccount = useAppSelector((state) => state.home.crossAccount);
  const crossBorrowable = useAppSelector((state) => state.home.crossBorrowable);
  const userData = useAppSelector((state) => state.auth.userData);
  const socket = useAppSelector((state) => state.home.socket);
  const openOrders = useAppSelector((state) => state.home.spotOpenOrders);
  const pastOrders = useAppSelector((state) => state.home.pastOrders);
  const favoriteArray = useAppSelector((state) => state.home.favoriteArray);
  const favoriteArrayLoaded = useAppSelector((state) => state.home.favoriteArrayLoaded);

  const [currency, setCurrency] = useState(null);
  const [currencyData, setCurrencyData] = useState(null);
  const [orderFilter, setOrderFilter] = useState("All");
  const [pastOrderFilter, setPastOrderFilter] = useState("All");
  const [showExecutedTrades, setShowExecutedTrades] = useState({});
  const [orderBookSocketReady, setOrderBookSocketReady] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isOrderTypeModalVisible, setIsOrderTypeModalVisible] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [marginAccountData, setMarginAccountData] = useState(null);
  const [crossRisk, setCrossRisk] = useState(null);
  const coinDataRef = useRef(coinData);
  useEffect(() => {
    coinDataRef.current = coinData;
  }, [coinData]);


  const [orderToCancel, setOrderToCancel] = useState(null);
  const handleCancelOpenOrderPress = useCallback((inv) => {
    setOrderToCancel(inv);
    setIsCancelModalVisible(true);
  }, []);
  const isSpotFocused = useIsFocused();

  const [isPriceFocused, setIsPriceFocused] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isStopFocused, setIsStopFocused] = useState(false);
  const [isTotalFocused, setIsTotalFocused] = useState(false);

  const priceAnim = useRef(new Animated.Value(1)).current;
  const amountAnim = useRef(new Animated.Value(0)).current;
  const stopAnim = useRef(new Animated.Value(0)).current;
  const totalAnim = useRef(new Animated.Value(0)).current;
  const slippageAnim = useRef(new Animated.Value(0)).current;
  const amountInputRef = useRef(null);
  const slippageInputRef = useRef(null);

  const syncAmountAnimForQuantityString = useCallback((qtyStr) => {
    if (String(qtyStr ?? "").trim() !== "") {
      amountAnim.setValue(1);
      totalAnim.setValue(1);
    }
  }, []);

  const syncStopAnimForPriceString = useCallback((priceStr) => {
    if (String(priceStr ?? "").trim() !== "") {
      stopAnim.setValue(1);
    }
  }, []);

  useLayoutEffect(() => {
    const displayValue = price || buy_price;
    const hasPrice = String(displayValue ?? "").trim() !== "";
    const isLoaded = !!buy_price;
    if (hasPrice || isPriceFocused || !isLoaded) {
      Animated.timing(priceAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      return;
    }
    Animated.timing(priceAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isPriceFocused, price, buy_price]);

  useLayoutEffect(() => {
    const hasAmt = String(amount ?? "").trim() !== "";
    if (hasAmt || isTotalFocused) {
      Animated.timing(totalAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      return;
    }
    Animated.timing(totalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [amount, isTotalFocused]);

  useLayoutEffect(() => {
    const hasAmt = String(amount ?? "").trim() !== "";

    if (hasAmt || isAmountFocused) {
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
    if (hasStop || isStopFocused) {
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

  useLayoutEffect(() => {
    const hasSlippage = String(slippagePct ?? "").trim() !== "";
    if (hasSlippage || isSlippageInputFocused) {
      Animated.timing(slippageAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      return;
    }
    Animated.timing(slippageAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [slippagePct, isSlippageInputFocused]);

  // DEV helper: render only History tabs + lists (skip heavy orderbook/form)
  const historyOnly = __DEV__ && route?.params?.historyOnly === true;

  const pairSheetRef = useRef(null);
  const rbSheetNumber = useRef();
  const rbSheetlimit = useRef();
  const rbSheetAddFunds = useRef();
  const rbSheetMarginConfirm = useRef();
  const rbSheetCrossRisk = useRef();
  const rbSheetIsolatedRisk = useRef();
  const lastMarginFetchRef = useRef("");
  const [marginConfirmPayload, setMarginConfirmPayload] = useState(null);
  const [dontShowMarginConfirm, setDontShowMarginConfirm] = useState(false);
  const latestSocketDataRef = useRef(null);
  const latestLocalBuyOrdersRef = useRef([]);
  const latestLocalSellOrdersRef = useRef([]);
  const currentCurrencyRef = useRef(null);
  const SOCKET_UI_THROTTLE_MS = 50;
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

  const formatPriceThousands = useCallback(
    (raw) => {
      const n = parseFloat(String(raw).replace(/,/g, ""));
      if (Number.isNaN(n)) return raw === undefined || raw === null ? "" : String(raw);
      return n.toLocaleString("en-US", { maximumFractionDigits: pricePrecision, minimumFractionDigits: 0 });
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
      const initialPrice = spotSelectedPair.buy_price ? formatPrice(spotSelectedPair.buy_price).toString() : "";
      setPrice(initialPrice);
      setStaticBuyPrice(initialPrice);
      setActivePercentage("");
      dispatch(setBuyOrders([]));
      dispatch(setSellOrders([]));
      dispatch(setRecentTrades([]));
      dispatch(setPastOrders([]));
      dispatch(clearTradeHistory());
      setSpotMyTrades([]);
      setOrderBookSocketReady(false);
      setStopPrice("");
      setTradeHistorySideFilter("All");
      setMarginLeverage("5x");
    }
  }, [spotSelectedPair?.base_currency, spotSelectedPair?.quote_currency, dispatch, formatPrice]);

  useEffect(() => {
    if (!staticBuyPrice && buy_price) {
      const p = formatPrice(buy_price).toString();
      setStaticBuyPrice(p);
      if (!price) setPrice(p);
    }
  }, [buy_price, staticBuyPrice, price, formatPrice]);

  useEffect(() => {
    // When switching between Spot and Margin tabs, reset price to capture the latest market price for the new mode.
    setStaticBuyPrice("");
    setPrice("");
    setStopPrice("");
  }, [headerTab]);

  // Manual change (TradingDataModal): dispatch to Redux - sync effect will handle rest
  // Clear order book so we don't show previous pair's data; new data will replace when socket responds
  const handleCurrencyChange = (coin) => {
    dispatch(setSpotSelectedPair(coin));
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

  // Dynamic Margin Account Data for Hourly Rates
  useEffect(() => {
    if (headerTab === "Margin" && effectiveCurrency) {
      const base = effectiveCurrency.base_currency;
      const quote = effectiveCurrency.quote_currency;
      const isCross = marginMode === "Cross";

      let pairId = effectiveCurrency?._id;
      if (!isCross && !pairId && effectiveCurrency && Array.isArray(coinDataRef.current)) {
        const match = coinDataRef.current.find(p => p.base_currency === base && p.quote_currency === quote);
        pairId = match?._id;
      }

      const fetchKey = `${headerTab}_${marginMode}_${base}_${quote}_${isCross ? "cross" : pairId || "nopair"}`;

      if (lastMarginFetchRef.current !== fetchKey) {
        if (!isCross && !pairId) return;

        lastMarginFetchRef.current = fetchKey;
        setMarginAccountData(null);

        if (isCross) {
          appOperation.get(`cross/account`, undefined, undefined, CUSTOMER_TYPE)
            .then((res) => { if (res?.success) setMarginAccountData(res.data); })
            .catch(() => { });
          appOperation.get("cross/risk", undefined, undefined, CUSTOMER_TYPE)
            .then((res) => { if (res?.success) setCrossRisk(res.data); })
            .catch(() => { });
        } else {
          appOperation.get(`margin/account/${pairId}`, undefined, undefined, CUSTOMER_TYPE)
            .then((res) => { if (res?.success) setMarginAccountData(res.data); })
            .catch(() => { });
        }
      }
    } else {
      lastMarginFetchRef.current = "";
    }
  }, [headerTab, effectiveCurrency?.base_currency, effectiveCurrency?.quote_currency, effectiveCurrency?._id, marginMode]);

  const getCrossAsset = useCallback((symbol) => {
    if (!marginAccountData?.assets) return null;
    return marginAccountData.assets.find((a) => a.currency === symbol) || null;
  }, [marginAccountData]);

  const COIN_RATES = {
    BNB: { hourly: "0.00034929", annual: "3.05977500" },
    USDT: { hourly: "0.00038596", annual: "3.38099500" },
    BTC: { hourly: "0.00004663", annual: "0.40843500" },
    ETH: { hourly: "0.00008219", annual: "0.71998440" },
    "0G": { hourly: "0.00050000", annual: "4.38000000" },
    "1INCH": { hourly: "0.00037917", annual: "3.32150000" },
    "2Z": { hourly: "0.00062500", annual: "5.47500000" },
  };

  const getHourlyRate = useCallback((symbol) => {
    const isCross = marginMode === "Cross";
    let rawRate = null;
    let fallback = COIN_RATES[symbol]?.hourly || "0.00200000";

    if (isCross) {
      const crossInterest = getCrossAsset(symbol);
      rawRate = crossInterest?.hourly_interest_rate_pct;
    } else {
      rawRate = marginAccountData?.interest?.hourly_pct;
    }

    if (rawRate != null) {
      return `${String(rawRate).replace(/%/g, "")}%`;
    }
    return `${fallback}%`;
  }, [marginMode, marginAccountData, getCrossAsset]);

  const safeBaseCurrency = base_currency || effectiveCurrency?.base_currency || "BTC";
  const safeQuoteCurrency = quote_currency || effectiveCurrency?.quote_currency || "USDT";
  const baseHourlyRate = getHourlyRate(safeBaseCurrency);
  const quoteHourlyRate = getHourlyRate(safeQuoteCurrency);

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
      tradeType: headerTab,
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
    headerTab,
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
  const [loadingSpotOpenOrders, setLoadingSpotOpenOrders] = useState(false);
  const [loadingSpotOrderHistory, setLoadingSpotOrderHistory] = useState(false);
  const [loadingSpotTradeHistory, setLoadingSpotTradeHistory] = useState(false);
  const [cancelledOrderIds, setCancelledOrderIds] = useState(() => new Set());
  const spotHistoryFetchGenRef = useRef({ openOrders: 0, orderHistory: 0, tradeHistory: 0 });
  activeTabRef.current = activeTab;

  // Bottom tabs row: scroll so left tabs align left, right tab aligns right (narrow screens).
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
      if (tabId === 2) setLoadingSpotOrderHistory(true);
      else if (tabId === 3) setLoadingSpotTradeHistory(true);
      activeTabRef.current = tabId;
      setActiveTab(tabId);
      setMountedOrdersTab(tabId);
    },
    [activeTab],
  );

  const [tab, setTab] = useState("Buy");
  const [headerTab, setHeaderTab] = useState(route?.params?.activeTab || "Spot");
  useEffect(() => {
    if (route?.params?.activeTab) {
      setHeaderTab(route.params.activeTab);
    }
  }, [route?.params?.activeTab]);
  const [marginMode, setMarginMode] = useState("Isolated");
  const [marginLeverage, setMarginLeverage] = useState("5x");

  const fetchCrossRisk = useCallback(async () => {
    if (!userData) return;
    try {
      const res = await appOperation.get("cross/risk", undefined, undefined, CUSTOMER_TYPE);
      if (res?.success && res.data) setCrossRisk(res.data);
    } catch {
      /* keep previous risk */
    }
  }, [userData]);

  useEffect(() => {
    const onCrossTrade = headerTab === "Margin" && marginMode === "Cross" && !!userData;
    if (!onCrossTrade) {
      setCrossRisk(null);
      rbSheetCrossRisk.current?.close();
      return undefined;
    }
    if (!isSpotFocused) return undefined;
    fetchCrossRisk();
    const id = setInterval(() => { void fetchCrossRisk(); }, 5000);
    return () => clearInterval(id);
  }, [headerTab, marginMode, userData, isSpotFocused, fetchCrossRisk]);

  useEffect(() => {
    const onIsolatedTrade = headerTab === "Margin" && marginMode === "Isolated" && !!userData;
    if (!onIsolatedTrade) {
      rbSheetIsolatedRisk.current?.close();
      return undefined;
    }
    if (!isSpotFocused) return undefined;
    let pairId = effectiveCurrency?._id || currencyData?._id;
    if (!pairId && effectiveCurrency && Array.isArray(coinDataRef.current)) {
      const match = coinDataRef.current.find(
        (p) => p.base_currency === effectiveCurrency.base_currency && p.quote_currency === effectiveCurrency.quote_currency
      );
      pairId = match?._id;
    }
    if (!pairId) return undefined;
    const pull = () => {
      appOperation.get(`margin/account/${pairId}`, undefined, undefined, CUSTOMER_TYPE)
        .then((res) => { if (res?.success) setMarginAccountData(res.data); })
        .catch(() => {});
    };
    pull();
    const id = setInterval(pull, 5000);
    return () => clearInterval(id);
  }, [headerTab, marginMode, userData, isSpotFocused, effectiveCurrency?._id, effectiveCurrency?.base_currency, effectiveCurrency?.quote_currency, currencyData?._id]);

  const parsedCrossRisk = useMemo(() => parseCrossRisk(crossRisk || {}), [crossRisk]);

  const isolatedRiskRow = useMemo(() => {
    if (headerTab !== "Margin" || marginMode !== "Isolated") return null;
    const pairId = currencyData?._id || effectiveCurrency?._id || "";
    return buildMarginRiskRow({
      ...(marginAccountData || {}),
      pair: `${base_currency || ""}${quote_currency || ""}`,
      pairRaw: `${base_currency || ""}/${quote_currency || ""}`,
      pair_id: pairId,
      margin_level: coinBalance?.margin_level ?? marginAccountData?.margin_level,
      base_borrowed: coinBalance?.base_currency_borrowed ?? marginAccountData?.base_borrowed,
      quote_borrowed: coinBalance?.quote_currency_borrowed ?? marginAccountData?.quote_borrowed,
      leverage: parseInt(String(marginLeverage || "").replace(/x/i, ""), 10) || marginAccountData?.leverage,
    }, pairId);
  }, [
    headerTab,
    marginMode,
    marginAccountData,
    coinBalance?.margin_level,
    coinBalance?.base_currency_borrowed,
    coinBalance?.quote_currency_borrowed,
    base_currency,
    quote_currency,
    currencyData?._id,
    effectiveCurrency?._id,
    marginLeverage,
  ]);

  const isolatedMl = parseMarginLevel(isolatedRiskRow?.margin_level);
  const isolatedHasDebt = isolatedRiskRow ? pairHasDebt(isolatedRiskRow, isolatedMl) : false;
  const isolatedThresholds = isolatedRiskRow ? resolveMarginThresholds(isolatedRiskRow) : {};
  const isolatedMlStatus = getMarginLevelStatus(
    isolatedHasDebt ? isolatedMl : null,
    isolatedThresholds,
    { hasDebt: isolatedHasDebt },
  );
  const isolatedMlDisplay = isolatedHasDebt ? formatMarginLevel(isolatedMl) : "Safe";

  useEffect(() => {
    if (headerTab === "Margin" && marginMode === "Cross") {
      dispatch(getCrossAccount());
      fetchCrossRisk();

      const baseId = currencyData?.base_currency_id || currentCurrencyRef.current?.base_currency_id;
      const quoteId = currencyData?.quote_currency_id || currentCurrencyRef.current?.quote_currency_id;
      if (baseId) {
        dispatch(getCrossBorrowable(baseId));
      }
      if (quoteId) {
        dispatch(getCrossBorrowable(quoteId));
      }
    }
  }, [headerTab, marginMode, currencyData?.base_currency_id, currencyData?.quote_currency_id, dispatch, fetchCrossRisk]);
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");
  const [staticBuyPrice, setStaticBuyPrice] = useState("");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [amtDenom, setAmtDenom] = useState("BASE");
  const [stopPrice, setStopPrice] = useState("");
  const [limitIoc, setLimitIoc] = useState(false);
  const [limitFok, setLimitFok] = useState(false);
  const [slippageEnabled, setSlippageEnabled] = useState(false);
  const [slippagePct, setSlippagePct] = useState("");
  const [isSlippageInputFocused, setIsSlippageInputFocused] = useState(false);
  // Fixed pitch black selection highlight on long press copy/paste
  const inputSelectionColor = themeColors.spotTradeBuy ? `${themeColors.spotTradeBuy}40` : "rgba(0,0,0,0.2)";
  const [isBuy, setIsBuy] = useState(true);
  const [total, setTotal] = useState("");


  // const [chartLoading, setChartLoading] = useState(true);
  // const [preloadedUrl, setPreloadedUrl] = useState(null);
  // const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
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
  const [_balance, _setBalance] = useState(0);
  const [numberSelect, setNumberSelect] = useState("0.0001");
  const [isConfirm, setIsConfirm] = useState(false);
  const [visible, setVisible] = useState(false);

  const [isSwitchingTab, setIsSwitchingTab] = useState(false);

  useEffect(() => {
    setIsSwitchingTab(true);
    const t = setTimeout(() => setIsSwitchingTab(false), 600);
    return () => clearTimeout(t);
  }, [headerTab, marginMode, quote_currency, base_currency]);

  useEffect(() => {
    setAmount("");
    setTotal("");
    setActivePercentage(0);
  }, [headerTab, marginMode]);

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
      unsubscribeFromMarket?.();
      unsubscribeFromFutures?.();
      dispatch(setLoading(false));
      isSpotFocusedRef.current = true;
      const pending = pendingOrderBookOnBlurRef.current;
      if (pending) {
        pendingOrderBookOnBlurRef.current = null;
        flushSocketToStateRef.current?.(pending);
      }
      const currentPair = currentCurrencyRef.current || currency;
      if (currentPair?.base_currency_id && currentPair?.quote_currency_id) {
        const tradeType = headerTab === "Margin" ? (marginMode === "Cross" ? "cross" : "margin") : "spot";
        const newKey = `${currentPair.base_currency_id}-${currentPair.quote_currency_id}-${tradeType}`;
        const lastExchange = lastSubscribedExchangeRef.current;
        const alreadySubscribed =
          !!lastExchange &&
          `${lastExchange.base_currency_id}-${lastExchange.quote_currency_id}-${lastExchange.tradeType || "spot"}` === newKey;
        /** Only clear + resubscribe when the exchange pair actually changed (or first load).
         *  Returning from SpotChartScreen or switching Spot <-> Margin keeps Redux book — Binance-style (no full reload). */
        if (!alreadySubscribed) {
          const isSamePairDifferentTradeType =
            !!lastExchange &&
            lastExchange.base_currency_id === currentPair.base_currency_id &&
            lastExchange.quote_currency_id === currentPair.quote_currency_id;

          if (!isSamePairDifferentTradeType) {
            dispatch(setBuyOrders([]));
            dispatch(setSellOrders([]));
          }
          if (lastExchange?.base_currency_id != null && lastExchange?.quote_currency_id != null) {
            unsubscribeFromExchange?.(lastExchange.base_currency_id, lastExchange.quote_currency_id);
          }
          const extraParams = headerTab === "Margin" ? { tradeType, pairId: currentPair?._id } : {};
          subscribeToExchange?.(currentPair.base_currency_id, currentPair.quote_currency_id, extraParams);
          lastSubscribedExchangeRef.current = {
            base_currency_id: currentPair.base_currency_id,
            quote_currency_id: currentPair.quote_currency_id,
            tradeType,
          };
        }
      }
      // If pair has no ids, ensure we don't show stale data from a previous subscription.
      if (!currentPair?.base_currency_id || !currentPair?.quote_currency_id) {
        const lastExchange = lastSubscribedExchangeRef.current;
        if (lastExchange?.base_currency_id != null && lastExchange?.quote_currency_id != null) {
          unsubscribeFromExchange?.(lastExchange.base_currency_id, lastExchange.quote_currency_id);
          lastSubscribedExchangeRef.current = null;
        }
        dispatch(setBuyOrders([]));
        dispatch(setSellOrders([]));
        dispatch(setRecentTrades([]));
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
        if (socketThrottleTimerRef.current) {
          clearTimeout(socketThrottleTimerRef.current);
          socketThrottleTimerRef.current = null;
        }
        pendingSocketFlushRef.current = null;

        /** Do not unsubscribe or clear the order book on blur (e.g. opening SpotChartScreen).
         *  SocketProvider keeps one exchange subscription; Redux keeps last book until pair changes or Spot unmounts. */
      };
    }, [subscribeToExchange, unsubscribeFromExchange, unsubscribeFromMarket, unsubscribeFromFutures, currency, dispatch, headerTab, marginMode])
  );

  /** Tear down exchange subscription only when Spot screen unmounts (leave trading stack), not on blur. */
  useEffect(() => {
    return () => {
      const last = lastSubscribedExchangeRef.current;
      if (last?.base_currency_id != null && last?.quote_currency_id != null) {
        unsubscribeFromExchange?.(last.base_currency_id, last.quote_currency_id);
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
    _setBalance(coinBalance?.base_currency_balance || 0);
  }, [coinBalance]);

  // AppState handling to prevent updates when app is in background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appStateRef.current = nextAppState;
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
        dispatch(setSellOrders(payload.sellOrders));
      }
    }
    if (payload.buyOrders?.length !== undefined) {
      if (!orderBookDataEqual(lastFlushedBuyRef.current, payload.buyOrders)) {
        lastFlushedBuyRef.current = payload.buyOrders;
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
      const throttleMs = SOCKET_UI_THROTTLE_MS;
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

  // Web parity: poll only while the mounted tab panel is Order History (2) — matches visible UI after slide animation (avoids Redux updating mid-slide + stale list flash).
  /**
   * Warm-switch prefetch:
   * When Spot is focused and a pair is selected, prefetch BOTH:
   * - Order History (executed orders)
   * - Trade History (fills)
   *
   * This makes switching tab 2 ↔ 3 feel instant (same as History screen warm-cache behavior),
   */
  const spotHistoryPrefetchRef = useRef({ pair: undefined, ts: 0 });
  const openOrdersRef = useRef(openOrders);
  openOrdersRef.current = openOrders;
  const lastOrderPlacedTimeRef = useRef(0);
  const pastOrdersRef = useRef(pastOrders);
  pastOrdersRef.current = pastOrders;
  const filteredMyTradesRef = useRef(filteredMyTrades);
  filteredMyTradesRef.current = filteredMyTrades;

  const userId = userData?.id || userData?._id;

  const fetchSpotOpenOrdersTab = useCallback(async (silent = true) => {
    if (!userId) return;
    const gen = ++spotHistoryFetchGenRef.current.openOrders;
    try {
      const response = await appOperation.customer.spot_me_orders_open({
        page: 1,
        page_size: 50,
      });
      if (gen !== spotHistoryFetchGenRef.current.openOrders) return;
      const items = spotMeOpenOrdersItemsFromResponse(response);
      if (response?.success && Array.isArray(items)) {
        // If an order was recently placed within 2.5s and DB read returns 0 items, retry shortly without clearing
        if (items.length === 0 && Date.now() - lastOrderPlacedTimeRef.current < 2500) {
          setTimeout(() => {
            fetchSpotOpenOrdersTab(true);
          }, 350);
          return;
        }
        dispatch(setOpenOrders(items));
      }
    } catch (e) {
      if (gen !== spotHistoryFetchGenRef.current.openOrders) return;
      console.warn("fetchSpotOpenOrdersTab err:", e);
    }
  }, [userId, dispatch]);

  const fetchSpotOrderHistoryTab = useCallback(async (silent = true) => {
    if (!base_currency || !quote_currency || !userId) {
      setLoadingSpotOrderHistory(false);
      return;
    }
    const gen = ++spotHistoryFetchGenRef.current.orderHistory;
    try {
      const pair = `${base_currency}${quote_currency}`.toUpperCase();
      const tt = headerTab === "Margin" ? (marginMode === "Cross" ? "cross" : "margin") : undefined;
      await dispatch(getPastOrders({ page: 1, page_size: 50, pair, tradeType: tt }, { useGlobalLoader: false }));
    } finally {
      if (gen === spotHistoryFetchGenRef.current.orderHistory) {
        setLoadingSpotOrderHistory(false);
      }
    }
  }, [base_currency, quote_currency, userId, dispatch, headerTab, marginMode]);

  const fetchSpotTradeHistoryTab = useCallback(async (silent = true) => {
    if (!base_currency || !quote_currency || !userId) {
      setLoadingSpotTradeHistory(false);
      return;
    }
    const gen = ++spotHistoryFetchGenRef.current.tradeHistory;
    try {
      const pair = `${base_currency}${quote_currency}`.toUpperCase();
      await dispatch(
        getTradeHistory(0, 50, pair, {
          useGlobalLoader: false,
          clearBeforeFetch: false,
        }),
      );
    } finally {
      if (gen === spotHistoryFetchGenRef.current.tradeHistory) {
        setLoadingSpotTradeHistory(false);
      }
    }
  }, [base_currency, quote_currency, userId, dispatch]);

  const spotHistoryActiveLoading = useMemo(() => {
    if (mountedOrdersTab === 2) return loadingSpotOrderHistory && (!pastOrders || pastOrders.length === 0);
    if (mountedOrdersTab === 3) return loadingSpotTradeHistory && (!filteredMyTrades || filteredMyTrades.length === 0);
    return false;
  }, [mountedOrdersTab, loadingSpotOrderHistory, loadingSpotTradeHistory, pastOrders, filteredMyTrades]);

  const showSpotHistoryLoader = spotHistoryActiveLoading;

  useEffect(() => {
    if (!base_currency || !quote_currency || !userId) return;
    if (!isSpotFocused) return;
    const pair = `${base_currency}${quote_currency}`.toUpperCase();
    const now = Date.now();
    // Debounce: avoid spam on rapid re-renders.
    if (spotHistoryPrefetchRef.current.pair === pair && now - (spotHistoryPrefetchRef.current.ts || 0) < 2500) return;
    spotHistoryPrefetchRef.current = { pair, ts: now };

    // Prefetch order history (tab 2)
    const tt = headerTab === "Margin" ? (marginMode === "Cross" ? "cross" : "margin") : undefined;
    dispatch(getPastOrders({ page: 1, page_size: 50, pair, tradeType: tt }, { useGlobalLoader: false }));

    // Prefetch trade fills (tab 3) — do NOT clear on focus return (avoids list flicker/reload when coming back from detail).
    dispatch(
      getTradeHistory(0, 50, pair, {
        useGlobalLoader: false,
        clearBeforeFetch: false,
      }),
    );
  }, [base_currency, quote_currency, userId, dispatch, isSpotFocused, headerTab, marginMode]);

  useEffect(() => {
    if (!base_currency || !quote_currency || !userId) return undefined;
    if (!isSpotFocused) return undefined;
    if (mountedOrdersTab !== 1) return undefined;
    fetchSpotOpenOrdersTab();
  }, [base_currency, quote_currency, userId, mountedOrdersTab, isSpotFocused, fetchSpotOpenOrdersTab]);

  useEffect(() => {
    if (!base_currency || !quote_currency || !userId) return undefined;
    if (!isSpotFocused) return undefined;
    if (mountedOrdersTab !== 2) return undefined;
    fetchSpotOrderHistoryTab();
  }, [base_currency, quote_currency, userId, mountedOrdersTab, isSpotFocused, fetchSpotOrderHistoryTab]);

  // Same for Trade History (3): poll only when that panel is actually mounted (not merely tab highlight mid-animation).
  useEffect(() => {
    if (!base_currency || !quote_currency || !userId) return undefined;
    if (!isSpotFocused) return undefined;
    if (mountedOrdersTab !== 3) return undefined;
    fetchSpotTradeHistoryTab();
  }, [base_currency, quote_currency, userId, mountedOrdersTab, isSpotFocused, fetchSpotTradeHistoryTab]);

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
    Animated.timing(totalAnim, {
      toValue: q.trim() !== "" ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isLimit, formatPrice, formatQuantity, syncAmountAnimForQuantityString]);

  const parseOrderQty = (s) => {
    const n = parseFloat(String(s ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  };

  const parsePriceNum = (v) => {
    const n = parseFloat(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  };

  const getStepSize = () => Number(currencyData?.step_size) || 0.00001;

  /** Snap qty to step_size without float drift (e.g. 0.00007 must not floor to 0.00006). */
  const snapQtyToStep = (qty, mode = "floor") => {
    const step = getStepSize();
    if (!Number.isFinite(qty) || qty <= 0) return 0;
    const units = qty / step;
    const scaled = Math.round(units * 1e12) / 1e12;
    const steps = mode === "ceil"
      ? Math.ceil(scaled - 1e-12)
      : mode === "round"
        ? Math.round(scaled)
        : Math.floor(scaled + 1e-12);
    const precision = getDecimalPlaces(step);
    return parseFloat((steps * step).toFixed(precision));
  };

  const toFixed8 = (data) => snapQtyToStep(data, "floor");
  const ceilQuantityToStep = (qty) => snapQtyToStep(qty, "ceil");

  const parseMinNotional = () => {
    const raw = currencyData?.min_notional;
    const n = typeof raw === "object" && raw?.$numberDecimal != null
      ? Number(raw.$numberDecimal)
      : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 5;
  };

  const roundQuoteNotional = (n) => {
    if (!Number.isFinite(n)) return NaN;
    const dp = currencyData?.quote_decimal ?? getPricePrecision();
    return parseFloat(n.toFixed(dp));
  };

  const validateOrder = (price, quantity, side, orderKind = "LIMIT", amountIsQuote = false) => {
    const tick_size = currencyData?.tick_size || 0.01;
    const step_size = currencyData?.step_size || 0.00001;
    const min_notional = parseMinNotional();
    const max_order_qty = currencyData?.max_order_qty || 9000;

    const skipPriceTick = orderKind === "MARKET" || orderKind === "STOP_MARKET";

    const numPrice = parsePriceNum(price);
    const numQuantity = parseOrderQty(quantity);

    if (!Number.isFinite(numPrice) || !Number.isFinite(numQuantity)) {
      showError("Invalid price or amount");
      return false;
    }

    if (amountIsQuote && numPrice <= 0) {
      showError("Price is required to size this order");
      return false;
    }

    const baseQty = amountIsQuote && numPrice > 0
      ? ceilQuantityToStep(numQuantity / numPrice)
      : snapQtyToStep(numQuantity, "floor");
    const minCheckTotal = amountIsQuote
      ? roundQuoteNotional(numQuantity)
      : roundQuoteNotional(numPrice * baseQty);

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
    if (Math.round(baseQty * qtyMultiplier) % Math.round(step_size * qtyMultiplier) !== 0) {
      showError(`Quantity must be a multiple of ${step_size}`);
      return false;
    }

    if (baseQty > max_order_qty) {
      showError(`Maximum order quantity is ${max_order_qty} ${currencyData?.base_currency}`);
      return false;
    }

    if (!Number.isFinite(minCheckTotal) || minCheckTotal < min_notional - 0.001) {
      showError(`Minimum order value is ${min_notional} ${currencyData?.quote_currency}`);
      return false;
    }

    if (headerTab !== "Margin") {
      if (side === "BUY") {
        const availableBalance = coinBalance?.quote_currency_balance || 0;
        let spend;
        if (amountIsQuote) {
          spend = numQuantity;
        } else if (orderKind === "MARKET" || orderKind === "STOP_MARKET") {
          spend = baseQty * numPrice * 1.02;
        } else {
          spend = baseQty * numPrice;
        }
        if (spend > availableBalance) {
          showError("Insufficient funds");
          return false;
        }
      } else if (side === "SELL") {
        const availableBalance = coinBalance?.base_currency_balance || 0;
        if (baseQty > availableBalance) {
          showError("Insufficient funds");
          return false;
        }
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
    const valueClean = String(value).replace(/,/g, "");
    if (valueClean === "" || valueClean === "0") return true;
    const tickSize = currencyData?.tick_size || 0.01;
    const pricePrec = getPricePrecision();
    const regex = new RegExp(`^\\d*\\.?\\d{0,${pricePrec}}$`);
    if (!regex.test(valueClean)) return false;
    if (valueClean.endsWith(".")) return true;
    const numValue = parsePriceNum(valueClean);
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
    const numValue = parsePriceNum(value);
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
    const numValue = parseOrderQty(value);
    if (isNaN(numValue) || numValue === 0) {
      setter("");
      return;
    }
    if (numValue < stepSize) {
      setter(stepSize.toString());
      return;
    }
    setter(String(snapQtyToStep(numValue, "round")));
  };

  const tickSize = currencyData?.tick_size || 0.01;
  const stepSize = currencyData?.step_size || 0.00001;
  const handlePriceStep = (delta) => {
    const current = parsePriceNum(price || buy_price || "0") || 0;
    const next = Math.max(0, current + delta * tickSize);
    const prec = getPricePrecision();
    const val = parseFloat(next.toFixed(prec)).toString();
    setPrice(val);
  };
  const handleAmountStep = (delta) => {
    const current = parseOrderQty(amount || "0") || 0;
    const next = Math.max(0, current + delta * stepSize);
    const val = String(snapQtyToStep(next, "round"));
    syncAmountAnimForQuantityString(val);
    setAmount(val);
  };

  const handleStopPriceStep = (delta) => {
    const current = parsePriceNum(stopPrice || buy_price || "0") || 0;
    const next = Math.max(0, current + delta * tickSize);
    const prec = getPricePrecision();
    const val = parseFloat(next.toFixed(prec)).toString();
    syncStopAnimForPriceString(val);
    setStopPrice(val);
  };

  const handleQty = (text) => {
    handleQuantityInput(text, setAmount);
    setActivePercentage(0);
    Animated.timing(totalAnim, {
      toValue: text.trim() !== "" ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    setActivePercentage(0);
  }, [isBuy, _balance]);

  const handleTotalPercentage = (value) => {
    setActivePercentage(value);

    let balToUse = 0;
    const refPx = (!isMarketLikeOrder ? parsePriceNum(price) : parsePriceNum(buy_price)) || 0;

    if (headerTab === "Margin") {
      const leverage = parseInt(marginLeverage, 10) || 5;
      const Qf = Number(coinBalance?.quote_currency_balance) || 0;
      const Bf = Number(coinBalance?.base_currency_balance) || 0;
      const Qb = Number(coinBalance?.quote_currency_borrowed) || 0;
      const Bb = Number(coinBalance?.base_currency_borrowed) || 0;
      const socketNetEquity = coinBalance?.net_equity != null ? Number(coinBalance.net_equity) : null;
      const netEquity = (socketNetEquity != null && Number.isFinite(socketNetEquity) && socketNetEquity >= 0)
        ? socketNetEquity
        : Math.max(0, (Qf - Qb) + (Bf - Bb) * refPx);

      const qCap = coinBalance?.quote_remaining_capacity != null ? Number(coinBalance.quote_remaining_capacity) : null;
      const bCap = coinBalance?.base_remaining_capacity != null ? Number(coinBalance.base_remaining_capacity) : null;

      const maxLeverage = (marginMode === "Cross" ? crossAccount?.max_leverage : null) ?? currencyData?.margin_config?.max_leverage ?? 10;
      const L = leverage;
      const M = Number(maxLeverage);

      const crossMarginMaxAtLeverage = (available, maxAtMaxLeverage) => {
        const avail = Number(available);
        const maxAtMax = Number(maxAtMaxLeverage);
        if (!Number.isFinite(avail) || avail < 0) return 0;
        if (!Number.isFinite(maxAtMax) || maxAtMax <= 0) return Math.max(0, avail);
        if (!Number.isFinite(L) || L <= 0) return Math.max(0, avail);
        if (!Number.isFinite(M) || M <= 1) return Math.max(0, Math.min(maxAtMax, avail));
        if (L >= M) return Math.max(0, maxAtMax);
        if (L <= 1) return Math.max(0, avail);

        const borrowable = Math.max(0, maxAtMax - avail);
        return Math.max(0, avail + borrowable * ((L - 1) / (M - 1)));
      };

      const isCross = marginMode === "Cross";

      const quoteAvailable = isCross
        ? ((coinBalance?.buy?.available != null || coinBalance?.buy_available != null)
          ? Number(coinBalance?.buy?.available ?? coinBalance?.buy_available)
          : netEquity)
        : Math.max(0, Qf);

      const baseAvailable = isCross
        ? ((coinBalance?.sell?.available != null || coinBalance?.sell_available != null)
          ? Number(coinBalance?.sell?.available ?? coinBalance?.sell_available)
          : Math.max(0, Bf - Bb))
        : Math.max(0, Bf);

      const grossQuoteMax = netEquity * leverage;
      const localQuoteMax = qCap != null && Number.isFinite(qCap) ? Math.min(grossQuoteMax, qCap + Qf) : grossQuoteMax;

      const quoteMax = isCross
        ? ((coinBalance?.buy?.max != null || coinBalance?.buy_max != null)
          ? crossMarginMaxAtLeverage(quoteAvailable, Number(coinBalance?.buy?.max ?? coinBalance?.buy_max))
          : localQuoteMax)
        : Math.max(0, Qf * leverage);

      const grossSellMax = refPx > 0 ? grossQuoteMax / refPx : 0;
      const localBaseMax = bCap != null && Number.isFinite(bCap) ? Math.min(grossSellMax, bCap) : grossSellMax;

      const baseMax = isCross
        ? ((coinBalance?.sell?.max != null || coinBalance?.sell_max != null)
          ? crossMarginMaxAtLeverage(baseAvailable, Number(coinBalance?.sell?.max ?? coinBalance?.sell_max))
          : localBaseMax)
        : Math.max(0, Bf * leverage);

      if (isBuy) {
        balToUse = Math.max(0, quoteMax);
      } else {
        balToUse = Math.max(0, baseMax);
      }
    } else {
      balToUse = isBuy
        ? (coinBalance?.quote_currency_balance || 0)
        : (coinBalance?.base_currency_balance || 0);
    }

    const val = percentCalculation(balToUse, value);

    if (showAmtDenomSelect && amtDenom === "QUOTE") {
      if (isBuy) {
        const amtStr = val.toString();
        syncAmountAnimForQuantityString(amtStr);
        setAmount(amtStr);
        Animated.timing(totalAnim, {
          toValue: amtStr.trim() !== "" ? 1 : 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      } else {
        const refPx = (!isMarketLikeOrder ? parsePriceNum(price) : parsePriceNum(buy_price)) || 0;
        const quoteAmt = toFixed8(val * refPx);
        const amtStr = quoteAmt.toString();
        syncAmountAnimForQuantityString(amtStr);
        setAmount(amtStr);
      }
    } else {
      if (isBuy) {
        const refPx = (!isMarketLikeOrder ? parsePriceNum(price) : parsePriceNum(buy_price)) || 0;
        const finalQuantity = refPx > 0 ? toFixed8(val / refPx) : 0;
        const amtStr = finalQuantity.toString() || "0";
        syncAmountAnimForQuantityString(amtStr);
        setAmount(amtStr);
        Animated.timing(totalAnim, {
          toValue: amtStr.trim() !== "" ? 1 : 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      } else {
        const finalQuantity = toFixed8(val);
        const amtStr = finalQuantity.toString() || "0";
        syncAmountAnimForQuantityString(amtStr);
        setAmount(amtStr);
      }
    }
  };

  const handleTotal = (text) => {
    setTotal(text);
    const refPx = (!isMarketLikeOrder ? parsePriceNum(price) : parsePriceNum(buy_price)) || 0;
    if (refPx > 0) {
      const val = parseOrderQty(text);
      if (Number.isFinite(val) && val > 0) {
        const qty = ceilQuantityToStep(val / refPx);
        const qStr = String(qty);
        syncAmountAnimForQuantityString(qStr);
        setAmount(qStr);
      } else if (!text || text === "0") {
        syncAmountAnimForQuantityString("");
        setAmount("");
      }
    }
  };

  const selectNumberLimitOn = (item) => {
    setNumberLimit(item.name);
    setIsOrderTypeModalVisible(false);
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
              backgroundColor: isDark ? colors.themeElevationColor : colors.newThemeColor,
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
            <View style={{ width: 16, height: 16, borderRadius: 10, backgroundColor: isDark ? colors.white : colors.black, alignItems: "center", justifyContent: "center" }}>
              <FastImage source={tick} style={{ width: 8, height: 8 }} tintColor={isDark ? colors.black : colors.white} resizeMode="contain" />
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
            onPress={() => {
              setIsOrderTypeModalVisible(false);
              rbSheetlimit?.current?.close();
            }}
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
            <FastImage source={REMOVE} style={{ width: 18, height: 18 }} resizeMode="contain" tintColor={isDark ? colors.white : colors.black} />
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
              <FastImage source={INFO} style={{ width: 12, height: 12 }} resizeMode="contain" tintColor={isDark ? colors.white : colors.black} />
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
              style={{
                marginLeft: 4, top: 2,
              }}
            >
              <FastImage source={INFO} style={{ width: 12, height: 12 }} tintColor={isDark ? colors.white : colors.black} resizeMode="contain" />
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
      const numPrice = parsePriceNum(rawStop);
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
    const refPrice = parsePriceNum(buy_price) || 0;
    const limitFromUi =
      price !== undefined && price !== null && String(price).trim() !== ""
        ? parsePriceNum(price)
        : refPrice;
    const orderPriceForValidation =
      spotOrderType === "MARKET" || spotOrderType === "STOP_MARKET" ? refPrice : limitFromUi;
    const orderPriceForApi = orderPriceForValidation;
    const stopPxRaw = stopPrice !== undefined && stopPrice !== null && String(stopPrice).trim() !== ""
      ? stopPrice
      : buy_price;
    const baseSym = String(base_currency ?? "").trim().toUpperCase();
    const quoteSym = String(quote_currency ?? "").trim().toUpperCase();
    const pair = baseSym && quoteSym ? `${baseSym}${quoteSym}` : "";

    const amtNum = parseOrderQty(amount);
    let baseQty = Number.isFinite(amtNum) && amtNum > 0 ? snapQtyToStep(amtNum, "floor") : 0;
    if (showAmtDenomSelect && amtDenom === "QUOTE") {
      const refPx = orderPriceForValidation || parsePriceNum(buy_price) || 0;
      if (refPx > 0 && Number.isFinite(amtNum) && amtNum > 0) {
        baseQty = ceilQuantityToStep(amtNum / refPx);
      } else {
        baseQty = 0;
      }
    }

    const data = {
      pair,
      type: spotOrderType,
      side: isBuy ? "BUY" : "SELL",
      quantity: String(baseQty),
    };
    if (spotOrderType === "LIMIT" || spotOrderType === "STOP_LIMIT") {
      data.price = String(orderPriceForApi);
    }
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
    if (headerTab === "Margin") {
      data.tradeType = marginMode === "Cross" ? "cross" : "margin";
    }

    return { data, orderPriceForValidation };
  }, [
    amount,
    amtDenom,
    showAmtDenomSelect,
    base_currency,
    buy_price,
    isBuy,
    limitFok,
    limitIoc,
    price,
    quote_currency,
    slippageEnabled,
    slippageError,
    slippagePct,
    spotOrderType,
    stopPrice,
    headerTab,
    marginMode,
  ]);

  const onSubmit = async () => {
    if (userData && Number(userData?.kycVerified) !== 2) {
      showError("KYC not verified. Please complete KYC first.");
      return;
    }

    if ((spotOrderType === "MARKET" || spotOrderType === "STOP_MARKET") && slippageEnabled && slippageError) {
      showError(slippageError);
      return;
    }

    const { data, orderPriceForValidation } = buildSpotOrderPayload();
    if (!data.pair) {
      showError("Select a trading pair");
      return;
    }
    if (headerTab === "Margin" && !dontShowMarginConfirm) {
      setMarginConfirmPayload(data);
      rbSheetMarginConfirm.current?.open();
      return;
    }

    const amountIsQuote = showAmtDenomSelect && amtDenom === "QUOTE";

    if (spotOrderType === "STOP_LIMIT" || spotOrderType === "STOP_MARKET") {
      if (!validateStopTriggerPrice(stopPrice !== "" ? stopPrice : buy_price)) {
        return;
      }
    }
    if (!validateOrder(orderPriceForValidation, amount, isBuy ? "BUY" : "SELL", spotOrderType, amountIsQuote)) {
      return;
    }

    setIsPlacingOrder(true);
    try {
      const res = await dispatch(placeOrder(data));
      if (res?.success) {
        lastOrderPlacedTimeRef.current = Date.now();
        amountAnim.setValue(0);
        totalAnim.setValue(0);
        setAmount("");
        setTotal("");
        setActivePercentage(0);

        setTimeout(() => {
          fetchSpotOpenOrdersTab(true);
          if (mountedOrdersTab === 2) fetchSpotOrderHistoryTab(true);
          if (mountedOrdersTab === 3) fetchSpotTradeHistoryTab(true);
        }, 350);
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleConfirmMarginOrder = async () => {
    rbSheetMarginConfirm.current?.close();
    if (!marginConfirmPayload) return;

    const { orderPriceForValidation } = buildSpotOrderPayload();
    const amountIsQuote = showAmtDenomSelect && amtDenom === "QUOTE";

    if (spotOrderType === "STOP_LIMIT" || spotOrderType === "STOP_MARKET") {
      if (!validateStopTriggerPrice(stopPrice !== "" ? stopPrice : buy_price)) {
        return;
      }
    }
    if (!validateOrder(orderPriceForValidation, amount, isBuy ? "BUY" : "SELL", spotOrderType, amountIsQuote)) {
      return;
    }

    setIsPlacingOrder(true);
    try {
      const res = await dispatch(placeOrder(marginConfirmPayload));
      if (res?.success) {
        lastOrderPlacedTimeRef.current = Date.now();
        amountAnim.setValue(0);
        totalAnim.setValue(0);
        setAmount("");
        setTotal("");
        setActivePercentage(0);

        setTimeout(() => {
          fetchSpotOpenOrdersTab(true);
          if (mountedOrdersTab === 2) fetchSpotOrderHistoryTab(true);
          if (mountedOrdersTab === 3) fetchSpotTradeHistoryTab(true);
        }, 350);
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const renderMarginConfirmSheet = () => {
    if (!marginConfirmPayload) return null;
    const { side, type, price: orderPrice, quantity, stop_price } = marginConfirmPayload;

    // Derived display values
    const isBuyMode = side === "BUY";
    const orderTypeLabel = type === "MARKET" ? "MARKET" : type === "LIMIT" ? "LIMIT" : type === "STOP_LIMIT" ? "STOP LIMIT" : "STOP MARKET";
    const displayPrice = type === "MARKET" || type === "STOP_MARKET" ? "Market" : orderPrice;
    const baseAsset = currencyData?.base_currency || "BTC";

    return (
      <View style={{ flex: 1, paddingTop: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, }}>
          <AppText style={{ color: themeColors.text, fontSize: 18 }} weight={BOLD}>Order Confirmation</AppText>
          <TouchableOpacity onPress={() => rbSheetMarginConfirm.current?.close()}>
            <FastImage source={REMOVE} style={{ width: 20, height: 20 }} tintColor={themeColors.iconColor} />
          </TouchableOpacity>
        </View>

        <View style={{
          flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15,
          paddingHorizontal: 10
        }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {buildCoinImageUri(currencyData) && (
              <FastImage
                source={{ uri: buildCoinImageUri(currencyData) }}
                style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
              />
            )}
            <AppText style={{ color: themeColors.text, fontSize: 18 }} weight={BOLD}>{currencyData?.base_currency}/{currencyData?.quote_currency}</AppText>
          </View>
          <View style={{ backgroundColor: isBuyMode ? themeColors.spotTradeBuy || colors.green : themeColors.spotTradeSell || colors.red, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 }}>
            <AppText style={{ color: colors.white, fontSize: 12 }} weight={SEMI_BOLD}>{isBuyMode ? "Buy" : "Sell"}</AppText>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15, paddingHorizontal: 10 }}>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>Order Type</AppText>
          <AppText style={{ color: themeColors.text, fontSize: 14 }} weight={SEMI_BOLD}>{orderTypeLabel}</AppText>
        </View>

        {type.startsWith("STOP_") && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15, paddingHorizontal: 10 }}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>Stop Price</AppText>
            <AppText style={{ color: themeColors.text, fontSize: 14 }} weight={SEMI_BOLD}>{stop_price}</AppText>
          </View>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15, paddingHorizontal: 10 }}>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>Price</AppText>
          <AppText style={{ color: themeColors.text, fontSize: 14 }} weight={SEMI_BOLD}>{displayPrice}</AppText>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15, paddingHorizontal: 10 }}>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>Amount</AppText>
          <AppText style={{ color: themeColors.text, fontSize: 14 }} weight={SEMI_BOLD}>{quantity} {baseAsset}</AppText>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20, paddingHorizontal: 10 }}>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>Leverage</AppText>
          <AppText style={{ color: themeColors.text, fontSize: 14 }} weight={SEMI_BOLD}>
            {String(marginLeverage).endsWith("x") ? marginLeverage : `${marginLeverage}x`}
          </AppText>
        </View>

        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 30, paddingHorizontal: 10 }}
          onPress={() => setDontShowMarginConfirm(!dontShowMarginConfirm)}
        >
          <View style={{ width: 18, height: 18, borderWidth: 1, borderColor: dontShowMarginConfirm ? (themeColors.spotTradeBuy || colors.green) : themeColors.secondaryText, borderRadius: 3, justifyContent: "center", alignItems: "center", marginRight: 10, backgroundColor: dontShowMarginConfirm ? (themeColors.spotTradeBuy || colors.green) : 'transparent' }}>
            {dontShowMarginConfirm && <FastImage source={checkIc} style={{ width: 12, height: 12 }} tintColor={colors.white} />}
          </View>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>Don't show confirmation for future orders</AppText>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: isDark ? "#2a2d35" : "#f3f4f6", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginRight: 10 }}
            onPress={() => rbSheetMarginConfirm.current?.close()}
          >
            <AppText style={{ color: themeColors.text, fontSize: 16 }} weight={SEMI_BOLD}>Cancel</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: isBuyMode ? themeColors.spotTradeBuy || colors.green : themeColors.spotTradeSell || colors.red, paddingVertical: 14, borderRadius: 8, alignItems: "center", marginLeft: 10 }}
            onPress={handleConfirmMarginOrder}
          >
            <AppText style={{ color: colors.white, fontSize: 16 }} weight={SEMI_BOLD}>Confirm {isBuyMode ? "Buy" : "Sell"}</AppText>
          </TouchableOpacity>
        </View>

      </View>
    );
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
    if (["FILLED", "COMPLETE", "COMPLETED", "EXECUTED"].includes(status)) return "EXECUTED";
    if (["CANCELLED", "CANCELED"].includes(status)) return "Cancelled";
    if (status === "REJECTED") return "Rejected";
    if (status === "EXPIRED") return "Expired";
    if (["OPEN", "PENDING"].includes(status)) return "Open";
    if (["PARTIAL", "PARTIALLY_FILLED", "PARTIAL_FILLED"].includes(status)) return "Partial";
    return String(raw);
  }, [getOrderStatusRaw]);

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
    const id = getStableId(item);
    return id ? `open_${id}` : `open_idx_${idx}`;
  }, []);
  const pastOrderKeyExtractor = useCallback((item, idx) => {
    const id = getStableId(item);
    const t = item?.created_at ?? item?.createdAt ?? item?.updated_at ?? item?.updatedAt;
    return id ? `past_${id}` : `past_${t ?? "na"}_${idx}`;
  }, []);

  // Memoize filtered open orders for better performance
  const filteredOpenOrders = useMemo(() => {
    if (!openOrders?.length) return [];
    let filtered = openOrders.filter((item) => {
      const orderId = getStableId(item);
      if (orderId && cancelledOrderIds.has(orderId)) {
        return false;
      }
      const statusRaw = getOrderStatusRaw(item);
      const s = String(statusRaw || "").toUpperCase().trim();
      if (["FILLED", "CANCELLED", "CANCELED", "COMPLETED", "EXECUTED", "REJECTED", "EXPIRED"].includes(s)) {
        return false;
      }
      const type = String(item?.type || item?.order_type || item?.orderType || "").toUpperCase();
      const qty = parseFloat(item?.quantity ?? item?.amount ?? 0) || 0;
      const filled = parseFloat(item?.filled_quantity ?? item?.filled ?? item?.executedQty ?? 0) || 0;
      if (type === "MARKET" && (qty > 0 && filled >= qty)) {
        return false;
      }
      return matchesOpenOrderKind(item, openOrderKindTab);
    });
    if (orderFilter !== "All") {
      filtered = filtered.filter((item) => item?.side === orderFilter);
    }
    return [...filtered].sort((a, b) => {
      const tsA = new Date(a?.updatedAt || a?.updated_at || a?.createdAt || a?.created_at || a?.date || a?.timestamp || 0).getTime() || 0;
      const tsB = new Date(b?.updatedAt || b?.updated_at || b?.createdAt || b?.created_at || b?.date || b?.timestamp || 0).getTime() || 0;
      if (tsB !== tsA) return tsB - tsA;
      const idA = getStableId(a);
      const idB = getStableId(b);
      return idB.localeCompare(idA);
    });
  }, [openOrders, orderFilter, openOrderKindTab, getOrderStatusRaw, cancelledOrderIds]);

  const pastOrdersNormalized = useMemo(() => {
    if (!Array.isArray(pastOrders)) return [];

    // Web uses dedupeSpotHistoryById and normalizeSpotOrderHistoryApiItemForTrade
    const items = pastOrders.map(raw => {
      const id = raw._id || raw.id || raw.order_id || raw.client_order_id;
      if (!id) return null;

      const parseNumVal = (v) => {
        if (v != null && typeof v === 'object' && v.$numberDecimal != null) return parseFloat(v.$numberDecimal);
        return v !== undefined && v !== null ? parseFloat(v) : undefined;
      };

      // Ensure executions (executed_prices) are present
      const executions = Array.isArray(raw.executions) ? raw.executions : (Array.isArray(raw.executed_prices) ? raw.executed_prices : []);
      const executed_prices = executions.map((ex) => {
        const p = parseNumVal(ex?.price ?? ex?.execution_price);
        const q = parseNumVal(ex?.quantity ?? ex?.filled_quantity);
        const f = parseNumVal(ex?.fee ?? "0");
        return {
          price: p,
          quantity: q,
          fee: f,
        };
      });

      const qty = parseNumVal(raw.quantity) ?? 0;
      const filled = parseNumVal(raw.filled_quantity ?? raw.filled) ?? 0;
      const remaining = parseNumVal(raw.remaining_quantity ?? raw.remaining) ?? Math.max(0, qty - filled);

      const avgExecutionPrice = parseNumVal(raw.avg_execution_price ?? raw.avgPrice ?? raw.average_price);
      const executedValue = parseNumVal(raw.executed_value ?? raw.executedValue) ?? ((avgExecutionPrice || 0) * filled);

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
        avg_execution_price: avgExecutionPrice,
        executed_value: executedValue,
        price: parseNumVal(raw.price ?? raw.limit_price ?? raw.stop_price ?? raw.trigger_price),
        time_in_force: raw.time_in_force || raw.tif || raw.timeInForce,
        tif: raw.tif || raw.time_in_force || raw.timeInForce,
        fill_percent: raw.fill_percent ?? raw.fillPercent ?? (qty > 0 ? `${Math.round((filled / qty) * 100)}%` : "0%"),
        executed_prices: executed_prices.length > 0 ? executed_prices : undefined,
        pair: raw.pair,
        ask_currency: raw.ask_currency,
        pay_currency: raw.pay_currency,
        total_fee: parseNumVal(raw.total_fee ?? raw.fee),

        total_tds: raw.total_tds ?? raw.tds,
        updatedAt: raw.updatedAt || raw.updated_at || raw.created_at || raw.createdAt,
        createdAt: raw.createdAt || raw.created_at || raw.updatedAt || raw.updated_at,
      };
    }).filter(Boolean);

    return dedupeSpotOrderHistoryRows(items).sort((a, b) => {
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

  const renderSpotOrdersEmptyState = useCallback((message = "Please login to view your orders & history") => {
    if (!userData) {
      return (
        <View style={[styles.noDataRow, { paddingVertical: 28, alignItems: "center", justifyContent: "center" }]}>
          <FastImage
            source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
            resizeMode="contain"
            style={{ width: 70, height: 70, marginBottom: 10 }}
          />
          <AppText style={{ color: themeColors.secondaryText, fontSize: 13, marginBottom: 12 }}>
            {message}
          </AppText>
          <TouchableOpacity
            style={{
              backgroundColor: colors.orangeTheme,
              paddingHorizontal: 22,
              paddingVertical: 8,
              borderRadius: 6,
              alignItems: "center",
            }}
            onPress={() => NavigationService.navigate(NAVIGATION_AUTH_STACK, { screen: LOGIN_SCREEN })}
          >
            <AppText weight={SEMI_BOLD} style={{ color: "#fff", fontSize: 13 }}>
              Login / Register
            </AppText>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.noDataRow}>
        <FastImage
          source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
          resizeMode="contain"
          style={{ width: 80, height: 80 }}
        />
      </View>
    );
  }, [userData, isDark, themeColors.secondaryText]);

  const tradeHistorySectionNode = useMemo(() => {
    if (!filteredMyTrades?.length) {
      return renderSpotOrdersEmptyState("Please login to view your trade history");
    }
    const baseHint = effectiveCurrency?.base_currency;
    const quoteHint = effectiveCurrency?.quote_currency;
    return (
      <>
        <View style={styles.scrollContent}>
          {tradeHistoryPreviewSlice.map((item, index) => {
            const mLabel = tradeHistoryMarketLabel(item, baseHint, quoteHint);
            const baseSym = tradeHistoryBaseAsset(item, baseHint, quoteHint);
            const quoteSym =
              item?.pay_currency ||
              item?.quote_currency ||
              quoteHint ||
              (mLabel.includes("/") ? mLabel.split("/")[1]?.trim() : "");
            const feeAsset = item?.fee_asset || quoteSym;
            const parseTradeNum = (val) => {
              if (val && val.$numberDecimal != null) return parseFloat(val.$numberDecimal);
              return parseFloat(val);
            };
            const priceNum = parseTradeNum(item?.price) || 0;
            const qtyNum = parseTradeNum(item?.quantity) || 0;
            const feeVal = parseTradeNum(item?.total_fee ?? item?.fee) || 0;
            const totalVal = parseTradeNum(item?.quote_quantity) || priceNum * qtyNum;
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
                  paddingVertical: 12,
                  paddingHorizontal: 0,
                  borderBottomWidth: 1,
                  borderBottomColor: themeColors.themeBorderColor,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                  <AppText style={{ color: themeColors.text }} type={FIFTEEN} weight={BOLD}>
                    {mLabel}
                  </AppText>
                  <FastImage
                    source={right_ic}
                    style={{ width: 11, height: 11, marginLeft: 4 }}
                    resizeMode="contain"
                    tintColor={themeColors.secondaryText}
                  />
                </View>
                <AppText weight={MEDIUM} type={FOURTEEN} style={{ color: themeColors.secondaryText, marginBottom: 2 }}>
                  {dateStr} {timeStr}
                </AppText>
                <AppText style={{ color: sideColor, marginBottom: 8 }} type={THIRTEEN} weight={SEMI_BOLD}>
                  {side} <AppText style={{ color: isDark ? colors.white : colors.black, marginBottom: 8 }} type={THIRTEEN} weight={SEMI_BOLD}>· {role}</AppText>
                </AppText>

                <View style={{ gap: 5 }}>
                  {/* <View style={styles.kvRow}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Date</AppText>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, textAlign: "right", flex: 2 }} numberOfLines={3}>
                      {dateStr}
                    </AppText>
                  </View> */}
                  {/* <View style={styles.kvRow}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Time</AppText>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, textAlign: "right", flex: 2 }} numberOfLines={3}>
                      {timeStr}
                    </AppText>
                  </View> */}
                  {/* <View style={styles.kvRow}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Pair</AppText>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, textAlign: "right", flex: 2 }} numberOfLines={3}>
                      {mLabel}
                    </AppText>
                  </View> */}
                  {/* <View style={styles.kvRow}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Side</AppText>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: sideColor, textAlign: "right", flex: 2 }} numberOfLines={3}>{side}</AppText>
                  </View> */}
                  {/* <View style={styles.kvRow}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Role</AppText>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, textAlign: "right", flex: 2 }} numberOfLines={3}>
                      {role}
                    </AppText>
                  </View> */}
                  <View style={styles.kvRow}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Price</AppText>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, textAlign: "right", flex: 2 }} numberOfLines={3}>
                      {safeToFixed8(item?.price, "—")}
                    </AppText>
                  </View>
                  <View style={styles.kvRow}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Quantity</AppText>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, textAlign: "right", flex: 2 }} numberOfLines={3}>
                      {safeToFixed8(item?.quantity, "—")}{baseSym ? ` ${baseSym}` : ""}
                    </AppText>
                  </View>
                  <View style={styles.kvRow}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Fee</AppText>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, textAlign: "right", flex: 2 }} numberOfLines={3}>
                      {`${safeToFixed8(feeVal)}${feeAsset ? ` ${feeAsset}` : ""}`.trim()}
                    </AppText>
                  </View>
                  <View style={styles.kvRow}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Total</AppText>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, textAlign: "right", flex: 2 }} numberOfLines={3}>
                      {safeToFixed8(totalVal)}
                    </AppText>
                  </View>
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
            <AppText style={[styles.viewAllText, { color: isDark ? colors.white : colors.buttonBg }]}>View More</AppText>
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
    styles.viewAllButton,
    styles.viewAllText,
    styles.noDataRow,
    colors.buttonBg,
  ]);



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
  /** Same UI as `tradeHistorySectionNode`; kept for any `{renderTradeHistorySection()}` call sites / bundles. */
  const renderTradeHistorySection = useCallback(
    () => tradeHistorySectionNode,
    [tradeHistorySectionNode],
  );

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background, paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: themeColors.background },
        ]}
      >
        <SpotHeader
          title={`${base_currency ?? effectiveCurrency?.base_currency ?? "-"}/${quote_currency ?? effectiveCurrency?.quote_currency ?? "-"}`}
          setCurrency={handleCurrencyChange}
          change={change_percentage}
          isDark={isDark}
          pairLoading={pairHeaderLoading}
          onCandlePress={handleCandlePress}
          onTrendPress={() => NavigationService.navigate(MARKET_SCREEN)}
          onBackPress={() => navigation.goBack()}
          activeHeaderTab={headerTab}
          setActiveHeaderTab={setHeaderTab}
          currencyData={currencyData}
          pairSheetRef={pairSheetRef}
        />

        {headerTab === "Buy Crypto" || headerTab === "Convert" ? (
          <BuyCryptoScreen
            isEmbedded={true}
            navigation={navigation}
            presetSide={route?.params?.convertSide}
            presetAsset={route?.params?.convertAsset}
            presetKey={route?.params?.convertPresetKey}
          />
        ) : (
          <>
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
                  headerTab={headerTab}
                  marginMode={marginMode}
                  quoteHourlyRate={quoteHourlyRate}
                  isHourlyRateLoading={marginAccountData === null}
                />
              </View>

              <SpotOrderForm {...{
                activePercentage,
                amount,
                amountAnim,
                amountInputRef,
                amtDenom,
                base_currency,
                buy_price,
                coinBalance,
                crossAccount,
                crossBorrowable,
                currencyData,
                formatPriceThousands,
                formatTotal,
                handleAmountStep,
                handlePriceBlur,
                handlePriceInput,
                handlePriceStep,
                handleQty,
                handleQuantityBlur,
                handleTotal,
                handleTotalPercentage,
                headerTab,
                inputSelectionColor,
                isBuy,
                isDark,
                isLimit,
                isMarketLikeOrder,
                isPlacingOrder,
                isPriceFocused,
                isSlippageInputFocused,
                isSwitchingTab,
                isTotalFocused,
                isolatedMlDisplay,
                isolatedMlStatus,
                limitFok,
                limitIoc,
                marginAccountData,
                marginLeverage,
                marginMode,
                navigation,
                numberSelectLimit,
                onSubmit,
                parsedCrossRisk,
                price,
                priceAnim,
                quote_currency,
                rbSheetCrossRisk,
                rbSheetIsolatedRisk,
                setAmount,
                setAmtDenom,
                setIsAmountFocused,
                setIsBuy,
                setIsOrderTypeModalVisible,
                setIsPriceFocused,
                setIsSlippageInputFocused,
                setIsStopFocused,
                setIsTotalFocused,
                setLimitFok,
                setLimitIoc,
                setMarginLeverage,
                setMarginMode,
                setPrice,
                setSlippageEnabled,
                setSlippagePct,
                setStopPrice,
                setTab,
                showAmtDenomSelect,
                showStopPriceField,
                slippageEnabled,
                slippageError,
                slippageInputRef,
                slippagePct,
                slippagePlaceholder,
                spotFooterMakerTakerPct,
                spotOrderType,
                staticBuyPrice,
                stopAnim,
                stopPrice,
                tab,
                theme,
                themeColors,
                total,
                totalAnim,
                totalDisplayValue,
                userData,
              }} />
            </View>

            <SpotOrdersPanel {...{
              activeTab,
              base_currency,
              buildCurrencyPairText,
              currencyData,
              filteredOpenOrders,
              getOrderStatusLabel,
              getOrderStatusRaw,
              getSideColor,
              handleCancelOpenOrderPress,
              handleSpotOrdersPrimaryTab,
              headerTab,
              historyOnly,
              isDark,
              marginAccountData,
              marginMode,
              mountedOrdersTab,
              normalizePairSymbol,
              openOrderKeyExtractor,
              openOrderKindTab,
              openOrdersSlice,
              orderBookReady,
              orderFilter,
              ordersBottomTabBarWidthRef,
              ordersBottomTabItemLayoutRef,
              ordersBottomTabScrollRef,
              pastOrderKeyExtractor,
              pastOrdersForSpotPair,
              pastOrdersSlice,
              quote_currency,
              renderSpotOrdersEmptyState,
              renderTradeHistorySection,
              setOpenOrderKindTab,
              setOrderFilter,
              setShowExecutedTrades,
              setTradeHistorySideFilter,
              showExecutedTrades,
              themeColors,
              tradeHistorySideFilter,
            }} />
          </>
        )}
        {/* Sweet Alert Style Modal */}
        {/* <PopupModal visible={visible} handleVisiblity={handlePopup} /> */}
        <SpotNumberSheet {...{
          isDark,
          rbSheetNumber,
          renderNumber,
          themeColors,
        }} />
      </ScrollView>

      <SpotOverlaySheets {...{
        coinBalance,
        crossRisk,
        currencyData,
        dispatch,
        fetchSpotOpenOrdersTab,
        headerTab,
        isCancelLoading,
        isCancelModalVisible,
        isDark,
        isOrderTypeModalVisible,
        isolatedRiskRow,
        lastOrderPlacedTimeRef,
        marginMode,
        openOrdersRef,
        orderToCancel,
        orderTypeSheetHeight,
        rbSheetAddFunds,
        rbSheetCrossRisk,
        rbSheetIsolatedRisk,
        rbSheetMarginConfirm,
        renderMarginConfirmSheet,
        renderOrderTypeSheet,
        setCancelledOrderIds,
        setIsCancelLoading,
        setIsCancelModalVisible,
        setIsOrderTypeModalVisible,
        setOrderToCancel,
        themeColors,
      }} />

      <TradingDataModal
        ref={pairSheetRef}
        onClose={() => { }}
        setCurrency={handleCurrencyChange}
        isDark={isDark}
        theme={theme}
      />
    </View>
  );
};

export default Spot;

export { DataLimit, Data } from "./spot/spotConstants";
export { ShimmerBox, SHIMMER_STRIP_WIDTH_DEFAULT } from "./spot/ShimmerBox";
