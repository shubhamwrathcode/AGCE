import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, TextInput, Modal, Pressable, Animated, FlatList, Platform, ToastAndroid, Alert, Keyboard, ActivityIndicator, InteractionManager } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { setFuturesData } from "../../slices/homeSlice";
import FastImage from 'react-native-fast-image';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { TrendingUp, ShoppingCart, Target, Check, Circle as LucideCircle, Gem, X, Info } from 'lucide-react-native';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import RBSheet from 'react-native-raw-bottom-sheet';
import AnimatedBottomSheet from '../../common/AnimatedBottomSheet/AnimatedBottomSheet';
import FuturePairList from './FuturePairList';
import { useFuturesSocket } from './useFuturesSocket';
import FuturesFundingTicker from './components/FuturesFundingTicker';
import { AppText, BOLD, MEDIUM, SEMI_BOLD, TWELVE, FOURTEEN, SIXTEEN, TEN, THIRTEEN } from '../../shared';
import { useTheme } from '../../hooks/useTheme';
import { colors, darkTheme } from '../../theme/colors';
import ToggleSwitch from '../../common/ToggleSwitch';
import PercentQuickSelect from '../../shared/components/PercentQuickSelect';
import {
  back_ic,
  downIcon,
  printIcon,
  INFO,
  limitTrade,
  market_ic,
  spotLimitTrade,
  spotMarket,
  tick,
  REMOVE,
  closeIcon,
  candle,
  history_line,
  add,
  order_1,
  order_2,
  order_3,
  NO_NOTIFICATION_ICON,
  right_ic
} from '../../helper/ImageAssets';
import { fontFamilyMedium, fontFamilySemiBold } from '../../theme/typography';
import {
  computeFuturesLeverageStats,
  getMaxQuantityAtLeverage,
  formatPriceByTick,
  getDecimalPlaces,
  getOrderBookAggOptionsForPair,
  aggregateOrderBookRows,
  normalizeOrderbookOrders,
  getTickSize,
  getStepSize,
  sanitizeIncrementInput,
  resolveTakerFeeRate,
  computeFuturesOrderMargin,
  computeMaxOpenNotional,
  computePosition,
  computeClosedPosition,
  computeMaxOpenQtyBtc,
  getMaxNotionalAtLeverage,
  isFuturesLeverageRejectionMessage,
  roundQtyDownToStep,
} from '../../helper/futuresUtils';
import {
  amountLimitLabel,
  buildAmountHint,
  effectiveOrderMinimum,
  formatDecimalString,
  isMultipleOfIncrement,
  parseMinNotionalValue,
} from '../../helper/orderQtyPrecision';
import { blurFocusedInputOnOutsideTouch } from '../../helper/blurOnOutsideTouch';
import moment from 'moment';
import FuturesHistorySection from './components/FuturesHistorySection';
import { LogBox } from 'react-native';
import { getUserFuturesWallet, getOpenOrders } from '../../actions/walletActions';
import { IMAGE_BASE_URL } from '../../helper/Constants';
import { buildCoinImageUri } from '../../helper/coinIconUrl';
import CoinIcon from '../../common/CoinIcon';
import { appOperation } from '../../appOperation';
import { CUSTOMER_TYPE } from '../../appOperation/types';
import SimpleToast from 'react-native-simple-toast';
import NavigationService from '../../navigation/NavigationService';
import { NAVIGATION_AUTH_STACK, KYC_STATUS_SCREEN, LOGIN_SCREEN } from '../../navigation/routes';
import { showError, alertErrorMessage, alertSuccessMessage } from '../../helper/logger';
import {
  toApiMarginMode,
  toUiMarginMode,
  toUiLeverage,
  formatFuturesSymbolMarginError,
  isMarginModeLocked,
  summarizeLeverageMarginBatch,
  formatBatchAdjustTrail,
} from './futuresSymbolMarginHelpers';
import FuturesLeverageSlider from './FuturesLeverageSlider';
import FuturesBatchAdjustDrawer from './FuturesBatchAdjustDrawer';
import AdjustLeverageSheet from './AdjustLeverageSheet';
import {
  futuresErrSelectPair,
  futuresErrGeneric,
  formatFuturesApiError,
} from './futuresOrderMessages';

LogBox.ignoreLogs(['VirtualizedLists should never be nested inside plain ScrollViews']);

const { width: Width, height: Height } = Dimensions.get('window');

const SHIMMER_STRIP_WIDTH_DEFAULT = 240;

const ShimmerBox = ({
  width = "100%",
  height = 15,
  borderRadius = 4,
  style,
  shimmerDuration = 1800,
  shimmerStripWidth,
  shimmerToValue,
  shimmerColorsOverride
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

const ORDER_BOOK_VISIBLE_ROWS = 7;
const ORDER_BOOK_ROW_LAYOUT_HEIGHT = 28;

const OrderBookSkeleton = () => {
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

const OrderBookAskRow = React.memo(({ item: ask, maxVolume, themeColors, isDark, selectedCoin, precision, styles }) => {
  if (ask.isPlaceholder) {
    return (
      <View style={styles.obRow}>
        <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.secondaryText, opacity: 0.15 }}>—</AppText>
        <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.secondaryText, opacity: 0.15 }}>—</AppText>
      </View>
    );
  }
  const ratio = Math.min(100, ((Number(ask.remaining) || 0) / (maxVolume || 1)) * 100);
  const priceDecimals = Math.max(getDecimalPlaces(precision || getTickSize(selectedCoin)), 0);
  const qtyDecimals = Math.max(getDecimalPlaces(getStepSize(selectedCoin)), 0);
  const formattedPrice = Number.isFinite(Number(ask.price)) ? Number(ask.price).toFixed(priceDecimals) : '—';
  const formattedQty = Number.isFinite(Number(ask.remaining)) ? Number(ask.remaining).toFixed(qtyDecimals) : '—';

  return (
    <View style={[styles.obRow, { position: 'relative', overflow: 'hidden' }]}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: `${ratio > 0 ? Math.max(2, ratio) : 0}%`,
          backgroundColor: isDark ? "rgba(232, 97, 97, 0.18)" : "rgba(255, 77, 79, 0.14)",
        }}
      />
      <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: colors.red }}>
        {formattedPrice}
      </AppText>
      <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
        {formattedQty}
      </AppText>
    </View>
  );
}, (prev, next) => prev.item.price === next.item.price && prev.item.remaining === next.item.remaining && prev.maxVolume === next.maxVolume && prev.precision === next.precision && prev.isDark === next.isDark);

const OrderBookBidRow = React.memo(({ item: bid, maxVolume, themeColors, isDark, selectedCoin, precision, styles }) => {
  if (bid.isPlaceholder) {
    return (
      <View style={styles.obRow}>
        <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.secondaryText, opacity: 0.15 }}>—</AppText>
        <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.secondaryText, opacity: 0.15 }}>—</AppText>
      </View>
    );
  }
  const ratio = Math.min(100, ((Number(bid.remaining) || 0) / (maxVolume || 1)) * 100);
  const priceDecimals = Math.max(getDecimalPlaces(precision || getTickSize(selectedCoin)), 0);
  const qtyDecimals = Math.max(getDecimalPlaces(getStepSize(selectedCoin)), 0);
  const formattedPrice = Number.isFinite(Number(bid.price)) ? Number(bid.price).toFixed(priceDecimals) : '—';
  const formattedQty = Number.isFinite(Number(bid.remaining)) ? Number(bid.remaining).toFixed(qtyDecimals) : '—';

  return (
    <View style={[styles.obRow, { position: 'relative', overflow: 'hidden' }]}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: `${ratio > 0 ? Math.max(2, ratio) : 0}%`,
          backgroundColor: isDark ? "rgba(38, 166, 154, 0.18)" : "rgba(38, 166, 154, 0.14)",
        }}
      />
      <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: colors.green }}>
        {formattedPrice}
      </AppText>
      <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
        {formattedQty}
      </AppText>
    </View>
  );
}, (prev, next) => prev.item.price === next.item.price && prev.item.remaining === next.item.remaining && prev.maxVolume === next.maxVolume && prev.precision === next.precision && prev.isDark === next.isDark);

const SPOT_OB_VIEW_ICONS = [order_1, order_2, order_3];

// Moving HISTORY_TABS inside FuturesUI to allow dynamic counts

const FuturesUI = () => {
  const themeObj = useTheme();
  const dispatch = useDispatch();
  const { colors: themeColors, isDark, theme } = themeObj;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const routeCoin = route.params?.coin || route.params?.pair || route.params?.coinDetail;
  const futuresPairs = useSelector((state) => state.home.futuresPairs);
  const userData = useSelector((state) => state.auth.userData);

  const [pairData, setPairData] = useState(() => {
    return futuresPairs && futuresPairs.length > 0 ? futuresPairs : [];
  });

  const [selectedCoin, setSelectedCoin] = useState(() => {
    if (routeCoin) return routeCoin;
    if (futuresPairs && futuresPairs.length > 0) {
      const btcPair = futuresPairs.find((pair) => pair.symbol === "BTCUSDT-PERP");
      return btcPair || futuresPairs[0];
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('Buy');
  const [sliderValue, setSliderValue] = useState(0);
  const [price, setPrice] = useState(() => {
    if (routeCoin) {
      const p = routeCoin.buy_price ?? routeCoin.last_price ?? routeCoin.mark_price;
      if (p) return String(formatPriceByTick(parseFloat(p), routeCoin));
    }
    if (futuresPairs && futuresPairs.length > 0) {
      const btcPair = futuresPairs.find((pair) => pair.symbol === "BTCUSDT-PERP");
      const initPair = btcPair || futuresPairs[0];
      if (initPair) {
        const p = initPair.buy_price ?? initPair.last_price ?? initPair.mark_price;
        if (p) return String(formatPriceByTick(parseFloat(p), initPair));
      }
    }
    return "";
  });
  const [amount, setAmount] = useState("");

  const [showTpSl, setShowTpSl] = useState(false);
  const [buyTpPrice, setBuyTpPrice] = useState("");
  const [buySlPrice, setBuySlPrice] = useState("");
  const [sellTpPrice, setSellTpPrice] = useState("");
  const [sellSlPrice, setSellSlPrice] = useState("");
  const [postOnly, setPostOnly] = useState(false);
  const [tif, setTif] = useState('GTC');

  // Market specific
  const [showSlippage, setShowSlippage] = useState(false);
  const [slippagePct, setSlippagePct] = useState('');

  // Conditional specific
  const [triggerPrice, setTriggerPrice] = useState("");
  const triggerAnim = useRef(new Animated.Value(0)).current;
  const [isTriggerFocused, setIsTriggerFocused] = useState(false);

  const [conditionalPrice, setConditionalPrice] = useState("");
  const conditionalPriceAnim = useRef(new Animated.Value(0)).current;
  const [isConditionalPriceFocused, setIsConditionalPriceFocused] = useState(false);

  const [activeHistoryTab, setActiveHistoryTab] = useState("Positions");

  // History Data States
  const [futuresPositionHistory, setFuturesPositionHistory] = useState([]);
  const [loadingPositionHistory, setLoadingPositionHistory] = useState(false);

  const [futuresOpenOrders, setFuturesOpenOrders] = useState([]);
  const [loadingOpenOrders, setLoadingOpenOrders] = useState(false);

  const [futuresOrderHistory, setFuturesOrderHistory] = useState([]);
  const [loadingOrderHistory, setLoadingOrderHistory] = useState(false);

  const [futuresTransactionHistory, setFuturesTransactionHistory] = useState([]);
  const [loadingTransactionHistory, setLoadingTransactionHistory] = useState(false);

  const [futuresTradeHistory, setFuturesTradeHistory] = useState([]);
  const [loadingTradeHistory, setLoadingTradeHistory] = useState(false);

  const [futuresPositions, setFuturesPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(false);

  const historyFetchGenRef = React.useRef({
    positions: 0,
    positionHistory: 0,
    openOrders: 0,
    orderHistory: 0,
    tradeHistory: 0,
    transactionHistory: 0,
  });

  const setHistoryTabLoading = React.useCallback((tabId) => {
    switch (tabId) {
      case 'Positions':
        setLoadingPositions(true);
        break;
      case 'Position History':
        setLoadingPositionHistory(true);
        break;
      case 'Open Orders':
        setLoadingOpenOrders(true);
        break;
      case 'Order History':
        setLoadingOrderHistory(true);
        break;
      case 'Trade History':
        setLoadingTradeHistory(true);
        break;
      case 'Transaction History':
        setLoadingTransactionHistory(true);
        break;
      default:
        break;
    }
  }, []);

  const handleHistoryTabChange = React.useCallback((tabId) => {
    if (tabId === activeHistoryTab) return;
    setHistoryTabLoading(tabId);
    setActiveHistoryTab(tabId);
  }, [activeHistoryTab, setHistoryTabLoading]);

  const tpAnim = useRef(new Animated.Value(0)).current;
  const slAnim = useRef(new Animated.Value(0)).current;
  const [isTpFocused, setIsTpFocused] = useState(false);
  const [isSlFocused, setIsSlFocused] = useState(false);
  const isBuyForm = activeTab === 'Buy';
  const formTp = isBuyForm ? buyTpPrice : sellTpPrice;
  const formSl = isBuyForm ? buySlPrice : sellSlPrice;
  const setFormTp = isBuyForm ? setBuyTpPrice : setSellTpPrice;
  const setFormSl = isBuyForm ? setBuySlPrice : setSellSlPrice;

  /** Inline order-form error: { field: "amount" | "price" | "trigger" | "orderPrice" | "tp" | "sl", text }. */
  const [orderFieldError, setOrderFieldError] = useState(null);
  const showFieldError = React.useCallback((field, text) => setOrderFieldError({ field, text }), []);
  const clearFieldError = React.useCallback(
    (field) => setOrderFieldError((prev) => (prev?.field === field ? null : prev)),
    []
  );

  useEffect(() => {
    Animated.timing(triggerAnim, {
      toValue: isTriggerFocused || String(triggerPrice ?? "").trim() !== "" ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isTriggerFocused, triggerPrice]);

  useEffect(() => {
    Animated.timing(conditionalPriceAnim, {
      toValue: isConditionalPriceFocused || String(conditionalPrice ?? "").trim() !== "" ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isConditionalPriceFocused, conditionalPrice]);

  useEffect(() => {
    Animated.timing(tpAnim, {
      toValue: isTpFocused || String(formTp ?? "").trim() !== "" ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isTpFocused, formTp]);

  useEffect(() => {
    Animated.timing(slAnim, {
      toValue: isSlFocused || String(formSl ?? "").trim() !== "" ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isSlFocused, formSl]);

  const priceAnim = useRef(new Animated.Value(0)).current;
  const amountAnim = useRef(new Animated.Value(0)).current;
  const [isPriceFocused, setIsPriceFocused] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);

  useEffect(() => {
    Animated.timing(priceAnim, {
      toValue: isPriceFocused || String(price ?? "").trim() !== "" ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isPriceFocused, price]);

  useEffect(() => {
    Animated.timing(amountAnim, {
      toValue: isAmountFocused || String(amount ?? "").trim() !== "" ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isAmountFocused, amount]);

  const pairSheetRef = useRef(null);
  const pairOpenLockRef = useRef(false);

  const {
    futuresData,
    futuresPrice,
    subscribeToFutures,
    unsubscribeFromFutures,
    subscribeToMarket,
    unsubscribeFromMarket
  } = useFuturesSocket();
  const isFocused = useIsFocused();
  const userFuturesWallet = useSelector((state) => state.wallet.userFuturesWallet);

  const usdtFuturesWallet = React.useMemo(() => {
    if (!Array.isArray(userFuturesWallet)) return null;
    return userFuturesWallet.find(w => w?.short_name === 'USDT' || w?.currency === 'USDT');
  }, [userFuturesWallet]);

  // Web parity (futuresBalanceForDisplay): socket effective_available first, then available_balance.
  const futuresAvailable = React.useMemo(() => {
    const bal = futuresData?.balance;
    if (bal?.effective_available != null && bal.effective_available !== '') {
      const eff = Number(bal.effective_available);
      if (Number.isFinite(eff)) return eff;
    }
    return Number(bal?.available_balance ?? usdtFuturesWallet?.balance ?? 0) || 0;
  }, [futuresData?.balance, usdtFuturesWallet?.balance]);

  const lastRouteCoinId = useRef(null);

  useEffect(() => {
    const activeCoin = route.params?.coin || route.params?.pair || route.params?.coinDetail;
    if (activeCoin) {
      const activeId = activeCoin._id || activeCoin.symbol || activeCoin.short_name || activeCoin.base_asset;
      if (activeId && activeId !== lastRouteCoinId.current) {
        lastRouteCoinId.current = activeId;
        dispatch(setFuturesData(null));
        setSelectedCoin(activeCoin);
        const p = activeCoin.buy_price ?? activeCoin.last_price ?? activeCoin.mark_price;
        if (p) {
          setPrice(String(formatPriceByTick(parseFloat(p), activeCoin)));
        }
        if (subscribeToFutures && activeCoin.symbol) {
          subscribeToFutures({ symbol: activeCoin.symbol });
        }
      }
    }
  }, [route.params?.coin, route.params?.pair, route.params?.coinDetail, subscribeToFutures, dispatch]);

  const fetchFuturesPositions = React.useCallback(async (opts = {}) => {
    const silent = opts?.silent === true;
    const gen = ++historyFetchGenRef.current.positions;
    if (!silent) setLoadingPositions(true);
    try {
      const params = { skip: 0, limit: 50 };
      const result = await appOperation.customer.futuresOpenPositions(params);
      if (gen !== historyFetchGenRef.current.positions) return;
      if (result?.success) {
        setFuturesPositions(result.data?.positions ?? []);
      }
    } catch (e) {
      if (gen !== historyFetchGenRef.current.positions) return;
      console.warn("fetchFuturesPositions err:", e);
    } finally {
      if (gen === historyFetchGenRef.current.positions) {
        setLoadingPositions(false);
      }
    }
  }, []);

  const fetchFuturesPositionHistory = React.useCallback(async () => {
    const gen = ++historyFetchGenRef.current.positionHistory;
    setLoadingPositionHistory(true);
    try {
      const params = { skip: 0, limit: 50 };
      const result = await appOperation.customer.futuresPositionHistory(params);
      if (gen !== historyFetchGenRef.current.positionHistory) return;
      if (result?.success) {
        setFuturesPositionHistory(result.data?.positions ?? []);
      } else {
        console.log("[PositionHistory] API failed or success=false", result);
      }
    } catch (e) {
      if (gen !== historyFetchGenRef.current.positionHistory) return;
      console.warn("[PositionHistory] fetchFuturesPositionHistory err:", e);
    } finally {
      if (gen === historyFetchGenRef.current.positionHistory) {
        setLoadingPositionHistory(false);
      }
    }
  }, []);

  const fetchFuturesOpenOrders = React.useCallback(async () => {
    const gen = ++historyFetchGenRef.current.openOrders;
    setLoadingOpenOrders(true);
    try {
      const params = { skip: 0, limit: 50 };
      const result = await appOperation.customer.futuresOpenOrders(params);
      if (gen !== historyFetchGenRef.current.openOrders) return;
      if (result?.success) {
        setFuturesOpenOrders(result.data?.orders ?? []);
      }
    } catch (e) {
      if (gen !== historyFetchGenRef.current.openOrders) return;
      console.warn("fetchFuturesOpenOrders err:", e);
    } finally {
      if (gen === historyFetchGenRef.current.openOrders) {
        setLoadingOpenOrders(false);
      }
    }
  }, []);

  const fetchFuturesOrderHistory = React.useCallback(async () => {
    const gen = ++historyFetchGenRef.current.orderHistory;
    setLoadingOrderHistory(true);
    try {
      const params = { skip: 0, limit: 50 };
      const result = await appOperation.customer.futuresOrderHistory(params);
      if (gen !== historyFetchGenRef.current.orderHistory) return;
      if (result?.success) {
        setFuturesOrderHistory(result.data?.orders ?? []);
      }
    } catch (e) {
      if (gen !== historyFetchGenRef.current.orderHistory) return;
      console.warn("fetchFuturesOrderHistory err:", e);
    } finally {
      if (gen === historyFetchGenRef.current.orderHistory) {
        setLoadingOrderHistory(false);
      }
    }
  }, []);

  const fetchFuturesTradeHistory = React.useCallback(async () => {
    const gen = ++historyFetchGenRef.current.tradeHistory;
    setLoadingTradeHistory(true);
    try {
      const params = { skip: 0, limit: 50 };
      const res = await appOperation.customer.futuresExecutions(params);
      if (gen !== historyFetchGenRef.current.tradeHistory) return;
      if (res?.success) {
        const list = Array.isArray(res?.data?.trades)
          ? res.data.trades
          : Array.isArray(res?.trades)
            ? res.trades
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : Array.isArray(res?.data?.executions)
                ? res.data.executions
                : Array.isArray(res?.data)
                  ? res.data
                  : [];
        setFuturesTradeHistory(list);
      }
    } catch (e) {
      if (gen !== historyFetchGenRef.current.tradeHistory) return;
      console.warn("fetchFuturesTradeHistory err:", e);
    } finally {
      if (gen === historyFetchGenRef.current.tradeHistory) {
        setLoadingTradeHistory(false);
      }
    }
  }, []);

  const fetchFuturesTransactionHistory = React.useCallback(async () => {
    const gen = ++historyFetchGenRef.current.transactionHistory;
    setLoadingTransactionHistory(true);
    try {
      const params = { page: 1, limit: 50 };
      const result = await appOperation.customer.futuresWalletHistory(params);
      if (gen !== historyFetchGenRef.current.transactionHistory) return;
      if (result?.success) {
        setFuturesTransactionHistory(result.data?.transactions ?? []);
      }
    } catch (e) {
      if (gen !== historyFetchGenRef.current.transactionHistory) return;
      console.warn("fetchFuturesTransactionHistory err:", e);
    } finally {
      if (gen === historyFetchGenRef.current.transactionHistory) {
        setLoadingTransactionHistory(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isFocused) return undefined;

    const task = InteractionManager.runAfterInteractions(() => {
      fetchFuturesPositions();
      fetchFuturesOpenOrders();

      if (activeHistoryTab === 'Position History') {
        fetchFuturesPositionHistory();
      } else if (activeHistoryTab === 'Order History') {
        fetchFuturesOrderHistory();
      } else if (activeHistoryTab === 'Trade History') {
        fetchFuturesTradeHistory();
        fetchFuturesOrderHistory();
        fetchFuturesPositionHistory();
      } else if (activeHistoryTab === 'Transaction History') {
        fetchFuturesTransactionHistory();
      }
    });

    return () => task.cancel();
  }, [isFocused, activeHistoryTab, fetchFuturesPositions, fetchFuturesPositionHistory, fetchFuturesOpenOrders, fetchFuturesOrderHistory, fetchFuturesTradeHistory, fetchFuturesTransactionHistory]);

  const liveCoin = React.useMemo(() => {
    return pairData?.find((p) => p._id === selectedCoin?._id) || selectedCoin;
  }, [pairData, selectedCoin]);

  const [livePriceState, setLivePriceState] = useState("");
  const lastStreamBidRef = useRef(null);
  const limitPriceSeededPairRef = useRef(null);
  const initialPriceSeededRef = useRef(false);



  const calculateAmountForSlider = (val, currentUnit, currentPrice) => {
    if (val === 0) return '';

    const balanceToUse = futuresAvailable;
    const takerFeeRate = resolveTakerFeeRate(selectedCoin);
    const stats = computeFuturesLeverageStats({
      availableBalance: balanceToUse,
      leverage: marginLeverage,
      maxLeverage: selectedCoin?.max_leverage || 125,
      leverageTiers: selectedCoin?.leverage_tiers || [],
      takerFeeRate,
    });

    const maxNotional = stats.allowToOpen || 0;
    if (!Number.isFinite(maxNotional) || maxNotional < 0 || maxNotional === Infinity) {
      return '';
    }

    const isValueUnit = currentUnit.includes('Value');
    if (isValueUnit) {
      const dec = selectedCoin?.quote_decimal ?? 2;
      const valAmount = (maxNotional * val) / 100;
      return parseFloat(valAmount.toFixed(dec)).toString();
    } else {
      let p = Number(currentPrice);
      if (!Number.isFinite(p) || p <= 0) {
        p = Number(liveCoin?.mark_price);
      }
      if (!Number.isFinite(p) || p <= 0) return '';

      let maxQty = maxNotional / p;
      const orderCap = Number(selectedCoin?.max_order_qty);
      if (Number.isFinite(orderCap) && orderCap > 0) {
        maxQty = Math.min(maxQty, orderCap);
      }

      const step = Number(selectedCoin?.step_size) || 0.001;
      const stepDec = (() => {
        const s = String(step);
        if (s.includes("e-")) {
          return parseInt(s.split("e-")[1], 10) || 0;
        }
        const dot = s.indexOf(".");
        return dot === -1 ? 0 : s.length - dot - 1;
      })();

      const maxSteps = Math.floor(maxQty / step + 1e-12);
      const flooredMaxQty = parseFloat((maxSteps * step).toFixed(stepDec));

      if (flooredMaxQty <= 0) return '';

      const targetQty = (flooredMaxQty * val) / 100;

      const multiplier = Math.pow(10, stepDec);
      const flooredTargetQty = Math.floor(targetQty * multiplier) / multiplier;

      return flooredTargetQty > 0 ? String(flooredTargetQty) : '';
    }
  };

  const handleSliderChange = (val) => {
    setSliderValue(val);
  };

  const [placingOrderSide, setPlacingOrderSide] = useState("");

  /** Server "max allowable quantity at current leverage" → tier max under Amount (no popup). */
  const showLeverageRejectionLine = () => {
    const isQuoteSize = contractUnit.includes('Value');
    const lev = Number(marginLeverage) || 1;
    const px = Number(selectedCoin?.mark_price) || Number(liveCoin?.mark_price) || Number(price) || 0;
    const tierMax = getMaxNotionalAtLeverage(selectedCoin?.leverage_tiers, lev);
    const cap = Number.isFinite(tierMax) && tierMax !== Infinity ? tierMax : 0;
    const step = Number(selectedCoin?.step_size) || 0.001;
    const tick = Number(selectedCoin?.tick_size) || 0.01;
    const baseQty = px > 0
      ? computeMaxOpenQtyBtc(cap, px, {
        leverageTiers: selectedCoin?.leverage_tiers,
        leverage: lev,
        maxOrderQty: Number(selectedCoin?.max_order_qty) || 1000,
        stepSize: step,
      })
      : 0;
    const unit = isQuoteSize ? currentQuoteAsset : currentBaseAsset;
    const shown = isQuoteSize && px > 0 ? baseQty * px : baseQty;
    showFieldError('amount', amountLimitLabel('Max', shown, isQuoteSize ? tick : step, unit));
  };

  const handlePlaceOrder = async (uiSide, formSideArg) => {
    if (isSymbolSettingsLoading) {
      SimpleToast.show('Loading your leverage settings, please wait…', SimpleToast.SHORT);
      return;
    }
    const formSide = String(formSideArg || (activeTab === 'Buy' ? 'BUY' : 'SELL')).toUpperCase();
    setPlacingOrderSide(String(uiSide).toUpperCase() === "BUY" ? "BUY" : "SELL");
    try {
      if (!selectedCoin?.symbol) {
        SimpleToast.show(futuresErrSelectPair(), SimpleToast.SHORT);
        setPlacingOrderSide("");
        return;
      }

      const isBuy = String(uiSide).toUpperCase() === "BUY";
      const apiSide = isBuy ? "BUY" : "SELL";
      const order_type = orderType.toUpperCase();
      // console.log("=== Order Basics ===", { isBuy, apiSide, order_type, amount, price });

      const tickSize = Number(selectedCoin?.tick_size) || 0.01;
      const stepSize = Number(selectedCoin?.step_size) || 0.001;
      const minQty = Number(selectedCoin?.min_order_qty) || stepSize;
      const maxQty = Number(selectedCoin?.max_order_qty) || 1000;
      const minNotional = parseMinNotionalValue(selectedCoin?.min_notional, 0);

      const rawQty = parseFloat(String(amount).replace(/,/g, ''));
      const isQuoteSize = contractUnit.includes('Value');

      const refPrice = Number(liveCoin?.mark_price) || 0;
      let priceForConversion = refPrice;
      if (orderType === 'Limit') {
        priceForConversion = parseFloat(String(price).replace(/,/g, '')) || refPrice;
      } else if (orderType === 'Conditional') {
        const orderPriceVal = parseFloat(String(conditionalPrice).replace(/,/g, ''));
        const triggerPriceVal = parseFloat(String(triggerPrice).replace(/,/g, ''));
        priceForConversion = orderPriceVal || triggerPriceVal || refPrice;
      }

      const amountUnit = isQuoteSize ? currentQuoteAsset : currentBaseAsset;
      const amountLimit = (kind, baseValue) => {
        const px = Number(priceForConversion) || refPrice || 0;
        if (kind === 'Min') {
          const mins = effectiveOrderMinimum({ price: px, stepSize, tickSize, minOrderQty: minQty, minNotional });
          return amountLimitLabel('Min', isQuoteSize ? mins.minQuote : mins.minBase, isQuoteSize ? tickSize : stepSize, amountUnit);
        }
        const shown = isQuoteSize && px > 0 ? Number(baseValue) * px : Number(baseValue);
        return amountLimitLabel('Max', shown, isQuoteSize ? tickSize : stepSize, amountUnit);
      };

      if (!Number.isFinite(rawQty) || rawQty <= 0) {
        showFieldError('amount', 'Enter amount');
        return;
      }
      if (isQuoteSize && !(priceForConversion > 0)) {
        showFieldError('price', 'Enter price');
        return;
      }

      // Futures sizing floors USDT / price to step (no bump to minBase).
      const qty = isQuoteSize ? roundQtyDownToStep(rawQty / priceForConversion, stepSize) : rawQty;
      if (!Number.isFinite(qty) || qty <= 0) {
        showFieldError('amount', isQuoteSize ? amountLimit('Min') : 'Enter amount');
        return;
      }

      const leverage = Number(marginLeverage) || 1;

      // Removing reduceOnly logic as tabs are now Buy/Sell. Can be added as checkbox later if needed.
      const reduceOnly = false;
      const closePosition = false;

      const effectiveTif = postOnly ? "GTX" : tif;

      if (!isMultipleOfIncrement(qty, stepSize)) {
        showFieldError('amount', 'Invalid amount');
        return;
      }
      if (qty < minQty) { showFieldError('amount', amountLimit('Min')); return; }
      if (qty > maxQty) { showFieldError('amount', amountLimit('Max', maxQty)); return; }

      const payload = {
        symbol: selectedCoin.symbol,
        side: apiSide,
        order_type,
        quantity: formatDecimalString(qty, getDecimalPlaces(stepSize)),
        leverage,
      };

      if (orderType === 'Limit') {
        const priceVal = String(price ?? '').trim() !== ''
          ? parseFloat(String(price).replace(/,/g, ''))
          : (Number(formatPriceByTick(Number(livePrice) || refPrice, selectedCoin)) || 0);
        if (!Number.isFinite(priceVal) || priceVal <= 0) {
          showFieldError('price', 'Enter price');
          return;
        }
        if (!isMultipleOfIncrement(priceVal, tickSize)) {
          showFieldError('price', 'Invalid price');
          return;
        }
        const limitNotional = isQuoteSize ? rawQty : priceVal * qty;
        if (minNotional > 0 && limitNotional > 0 && limitNotional < minNotional) {
          showFieldError('amount', amountLimit('Min'));
          return;
        }
        payload.price = String(priceVal);
        if (effectiveTif && effectiveTif !== "GTC") {
          payload.time_in_force = effectiveTif;
        }
      } else if (orderType === 'Conditional') {
        const triggerVal = parseFloat(String(triggerPrice).replace(/,/g, ''));
        if (!String(triggerPrice ?? '').trim() || !Number.isFinite(triggerVal) || triggerVal <= 0) {
          showFieldError('trigger', 'Enter price');
          return;
        }
        if (!isMultipleOfIncrement(triggerVal, tickSize)) {
          showFieldError('trigger', 'Invalid price');
          return;
        }
        payload.trigger_price = String(triggerVal);

        const orderPriceVal = parseFloat(String(conditionalPrice).replace(/,/g, ''));
        if (String(conditionalPrice ?? '').trim() !== '' && Number.isFinite(orderPriceVal) && orderPriceVal > 0) {
          if (!isMultipleOfIncrement(orderPriceVal, tickSize)) {
            showFieldError('orderPrice', 'Invalid price');
            return;
          }
          const condNotional = isQuoteSize ? rawQty : orderPriceVal * qty;
          if (minNotional > 0 && condNotional > 0 && condNotional < minNotional) {
            showFieldError('amount', amountLimit('Min'));
            return;
          }
          payload.order_price = String(orderPriceVal);
        } else {
          const condNotional = isQuoteSize ? rawQty : triggerVal * qty;
          if (minNotional > 0 && condNotional > 0 && condNotional < minNotional) {
            showFieldError('amount', amountLimit('Min'));
            return;
          }
        }
      } else if (orderType === 'Market') {
        const notional = isQuoteSize ? rawQty : qty * refPrice;
        if (minNotional > 0 && notional > 0 && notional < minNotional) {
          showFieldError('amount', amountLimit('Min'));
          return;
        }
        if (showSlippage && slippagePct) {
          const sp = parseFloat(slippagePct);
          if (Number.isFinite(sp) && sp > 0 && sp <= 100) {
            payload.slippage = sp;
          }
        }
      }

      if (showTpSl) {
        // TP/SL from the form the user is using (buy vs sell tab), not only from Long/Short.
        // If that panel is empty, fall back to the other panel — same as web callPlaceOrder.
        const preferredTp = formSide === "BUY" ? buyTpPrice : sellTpPrice;
        const preferredSl = formSide === "BUY" ? buySlPrice : sellSlPrice;
        const otherTp = formSide === "BUY" ? sellTpPrice : buyTpPrice;
        const otherSl = formSide === "BUY" ? sellSlPrice : buySlPrice;
        const takeProfit = String(preferredTp || "").trim() || String(otherTp || "").trim();
        const stopLoss = String(preferredSl || "").trim() || String(otherSl || "").trim();
        const markPriceForTpSl = Number(futuresPrice?.mark_price) || 0;
        if (takeProfit) {
          const tpVal = parseFloat(takeProfit);
          if (Number.isFinite(tpVal) && tpVal > 0) {
            if (markPriceForTpSl > 0) {
              if (apiSide === "BUY" && tpVal <= markPriceForTpSl) { showFieldError('tp', 'Invalid TP'); return; }
              if (apiSide === "SELL" && tpVal >= markPriceForTpSl) { showFieldError('tp', 'Invalid TP'); return; }
            }
            payload.take_profit = String(tpVal);
          }
        }
        if (stopLoss) {
          const slVal = parseFloat(stopLoss);
          if (Number.isFinite(slVal) && slVal > 0) {
            if (markPriceForTpSl > 0) {
              if (apiSide === "BUY" && slVal >= markPriceForTpSl) { showFieldError('sl', 'Invalid SL'); return; }
              if (apiSide === "SELL" && slVal <= markPriceForTpSl) { showFieldError('sl', 'Invalid SL'); return; }
            }
            payload.stop_loss = String(slVal);
          }
        }
      }

      if (reduceOnly) payload.reduce_only = true;
      if (closePosition) payload.close_position = true;

      let orderPriceForCap = 0;
      if (orderType === "Limit" && payload.price) {
        orderPriceForCap = parseFloat(payload.price);
      } else if (orderType === "Market") {
        orderPriceForCap = Number(selectedCoin?.mark_price) || refPrice || Number(price) || 0;
      } else if (orderType === "Conditional") {
        orderPriceForCap = payload.order_price ? parseFloat(payload.order_price) : parseFloat(payload.trigger_price) || 0;
      }

      if (Number.isFinite(orderPriceForCap) && orderPriceForCap > 0) {
        const orderNotional = qty * orderPriceForCap;
        const qtyCaps = {
          leverageTiers: selectedCoin?.leverage_tiers,
          leverage,
          maxOrderQty: maxQty,
          stepSize,
        };

        // Funds first. A size the wallet cannot open never reaches the leverage-tier check.
        if (!reduceOnly && !closePosition) {
          const takerFee = resolveTakerFeeRate(selectedCoin);
          const requiredMargin = computeFuturesOrderMargin(orderNotional, leverage, takerFee);
          if (requiredMargin > futuresAvailable + 1e-8) {
            const balanceNotional = computeMaxOpenNotional(futuresAvailable, leverage, takerFee);
            const maxQtyFromMargin = computeMaxOpenQtyBtc(balanceNotional, orderPriceForCap, qtyCaps);
            showFieldError('amount', amountLimit('Max', maxQtyFromMargin));
            return;
          }
        }

        const tierMaxNotional = getMaxNotionalAtLeverage(selectedCoin?.leverage_tiers, leverage);
        if (Number.isFinite(tierMaxNotional) && tierMaxNotional !== Infinity && orderNotional > tierMaxNotional) {
          const tierQty = computeMaxOpenQtyBtc(tierMaxNotional, orderPriceForCap, qtyCaps);
          showFieldError('amount', amountLimit('Max', tierQty));
          return;
        }
      }

      setOrderFieldError(null);

      const client_order_id = "app_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const finalPayload = {
        ...payload,
        client_order_id,
      };

      const result = await appOperation.customer.futuresPlaceOrder(finalPayload);
      if (result?.success) {
        SimpleToast.show(result?.message || 'Order Placed Successfully!', SimpleToast.SHORT);
        const orderData = result?.data?.order ?? result?.data;
        const orderId = orderData?._id ?? orderData?.order_id;
        if (orderData && orderId) {
          setFuturesOpenOrders((prev) => {
            if (prev.some((o) => String(o._id ?? o.order_id) === String(orderId))) return prev;
            return [orderData, ...prev];
          });
        }

        // clear form
        setAmount("");
        setSliderValue(0);
        if (orderType === 'Conditional') {
          setTriggerPrice("");
          setConditionalPrice("");
        }
        if (showTpSl) {
          setBuyTpPrice("");
          setBuySlPrice("");
          setSellTpPrice("");
          setSellSlPrice("");
        }

        fetchFuturesPositions();
        fetchFuturesOpenOrders();
        fetchFuturesTransactionHistory();
      } else {
        const msg = result?.error?.message || result?.message || "Failed to place order";
        if (isFuturesLeverageRejectionMessage(msg)) {
          showLeverageRejectionLine();
        } else {
          SimpleToast.show(formatFuturesApiError(msg), SimpleToast.SHORT);
        }
      }
    } catch (e) {
      let errMsg = futuresErrGeneric();
      if (e?.error?.message) {
        errMsg = e.error.message;
      } else if (typeof e?.error === 'string') {
        errMsg = e.error;
      } else if (e?.message) {
        errMsg = e.message;
      }
      if (isFuturesLeverageRejectionMessage(errMsg)) {
        showLeverageRejectionLine();
      } else {
        SimpleToast.show(formatFuturesApiError(errMsg), SimpleToast.SHORT);
      }
    } finally {
      setPlacingOrderSide("");
    }
  };

  useEffect(() => {
    // 2. Normal slider recalculation
    if (sliderValue > 0) {
      let currentRefPrice = price;
      if (orderType === 'Conditional') {
        currentRefPrice = conditionalPrice || triggerPrice;
      }
      setAmount(calculateAmountForSlider(sliderValue, contractUnit, currentRefPrice));
    }
  }, [sliderValue, contractUnit, marginLeverage, price, orderType, conditionalPrice, triggerPrice]);

  useEffect(() => {
    if (!futuresPrice) return;
    if (selectedCoin?.symbol && futuresPrice.symbol && futuresPrice.symbol !== selectedCoin.symbol) return;

    const p = futuresPrice.mark_price ?? futuresPrice.last_price;
    if (p == null) return;

    const priceNum = parseFloat(p);
    if (!Number.isFinite(priceNum) || priceNum <= 0) return;

    const pairId = selectedCoin?._id;
    if (pairId && limitPriceSeededPairRef.current !== pairId) {
      limitPriceSeededPairRef.current = pairId;
      setPrice(String(formatPriceByTick(priceNum, selectedCoin)));
    }

    if (lastStreamBidRef.current != null) {
      const prev = Number(lastStreamBidRef.current);
      if (priceNum > prev) setIsPricePositive(true);
      else if (priceNum < prev) setIsPricePositive(false);
    }
    lastStreamBidRef.current = priceNum;
    setLivePriceState(p);
  }, [futuresPrice, selectedCoin]);

  const livePrice = React.useMemo(() => {
    if (livePriceState) return parseFloat(livePriceState) || 0;

    let p = futuresData?.last_price || futuresData?.buy_price || futuresData?.price;
    if (!p && futuresData?.contract) {
      p = futuresData.contract.mark_price || futuresData.contract.last_price;
    }
    if (!p) p = liveCoin?.last_price || liveCoin?.buy_price;
    if (!p) {
      const allAsks = futuresData?.sell_order || [];
      const allBids = futuresData?.buy_order || [];
      p = allAsks[0]?.price || allBids[0]?.price;
    }
    return parseFloat(p) || 0;
  }, [livePriceState, futuresData, liveCoin]);

  const [isPricePositive, setIsPricePositive] = useState(true);
  const prevPriceRef = useRef(0);

  useEffect(() => {
    if (livePrice > prevPriceRef.current && prevPriceRef.current !== 0) {
      setIsPricePositive(true);
    } else if (livePrice < prevPriceRef.current && prevPriceRef.current !== 0) {
      setIsPricePositive(false);
    }
    if (livePrice > 0) {
      prevPriceRef.current = livePrice;
    }
  }, [livePrice]);

  const [searchTerm, setSearchTerm] = useState("");
  const [orderType, setOrderType] = useState('Limit');
  const [isOrderTypeModalVisible, setIsOrderTypeModalVisible] = useState(false);
  const orderTypeSheetRef = useRef(null);
  const [marginMode, setMarginMode] = useState('Isolated');
  const [marginModeDraft, setMarginModeDraft] = useState('Isolated');
  const [isMarginModeModalVisible, setIsMarginModeModalVisible] = useState(false);
  const [isSavingMarginMode, setIsSavingMarginMode] = useState(false);
  const marginModeSheetRef = useRef(null);
  const isLoggedIn = !!userData;
  const futuresSymbol = selectedCoin?.symbol;

  const applySymbolSettings = (data) => {
    if (!data) return;
    if (data.margin_mode != null) {
      const savedMode = toUiMarginMode(data.margin_mode);
      setMarginMode(savedMode);
      setMarginModeDraft(savedMode);
    }
    const savedLeverage = toUiLeverage(data.leverage);
    if (savedLeverage != null) {
      setMarginLeverage(savedLeverage);
      setLeverageDraft(savedLeverage);
    }
  };

  const [symbolSettingsLoadedFor, setSymbolSettingsLoadedFor] = useState(null);
  const isSymbolSettingsLoading = isLoggedIn && !!futuresSymbol && symbolSettingsLoadedFor !== futuresSymbol;

  useEffect(() => {
    if (!isFocused || !isLoggedIn || !futuresSymbol) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await appOperation.customer.futuresSymbolSettings(futuresSymbol);
        if (cancelled) return;
        if (res?.success && res?.data) applySymbolSettings(res.data);
      } catch (e) {
        console.warn('futuresSymbolSettings err:', e);
      }
      if (!cancelled) setSymbolSettingsLoadedFor(futuresSymbol);
    })();
    return () => {
      cancelled = true;
    };
  }, [isFocused, isLoggedIn, futuresSymbol]);

  const marginModeLocked = React.useMemo(
    () => isMarginModeLocked(futuresSymbol, futuresPositions, futuresOpenOrders),
    [futuresSymbol, futuresPositions, futuresOpenOrders],
  );

  const closeMarginModeSheet = () => {
    setIsMarginModeModalVisible(false);
    marginModeSheetRef?.current?.close?.();
  };

  const confirmMarginMode = async () => {
    if (isSavingMarginMode) return;
    if (marginModeDraft === marginMode) {
      closeMarginModeSheet();
      return;
    }
    if (!futuresSymbol) {
      alertErrorMessage('Select a contract first.');
      return;
    }
    if (!isLoggedIn) {
      alertErrorMessage('Please sign in to change margin mode.');
      closeMarginModeSheet();
      navigation.navigate(LOGIN_SCREEN);
      return;
    }
    if (marginModeLocked) {
      alertErrorMessage("Mode can't change while you have an open order or position.");
      return;
    }
    setIsSavingMarginMode(true);
    try {
      const res = await appOperation.customer.futuresMarginType({
        symbol: futuresSymbol,
        margin_mode: toApiMarginMode(marginModeDraft),
      });
      if (!res?.success) {
        alertErrorMessage(formatFuturesSymbolMarginError(res, 'Failed to update margin mode'));
        return;
      }
      applySymbolSettings(res?.data);
      const savedMode = res?.data?.margin_mode != null ? toUiMarginMode(res.data.margin_mode) : marginModeDraft;
      setMarginMode(savedMode);
      setMarginModeDraft(savedMode);
      alertSuccessMessage(savedMode === 'Isolated' ? 'Switched to Isolated' : 'Switched to Cross');
      closeMarginModeSheet();
    } catch (e) {
      alertErrorMessage(formatFuturesSymbolMarginError(e, 'Failed to update margin mode. Please try again.'));
    } finally {
      setIsSavingMarginMode(false);
    }
  };
  const tifSheetRef = useRef(null);
  const [isBatchAdjustVisible, setIsBatchAdjustVisible] = useState(false);
  const [batchAdjustDraft, setBatchAdjustDraft] = useState({
    leverageEnabled: false,
    marginModeEnabled: false,
    leverage: null,
    marginMode: null,
  });
  const batchAdjustActive = !!batchAdjustDraft.leverageEnabled || !!batchAdjustDraft.marginModeEnabled;

  const openBatchAdjustDrawer = () => {
    setBatchAdjustDraft((prev) => ({
      ...prev,
      leverage: toUiLeverage(prev.leverage) ?? marginLeverage,
      marginMode:
        prev.marginMode === 'isolated' || prev.marginMode === 'cross'
          ? prev.marginMode
          : (marginMode === 'Isolated' ? 'isolated' : 'cross'),
    }));
    setIsMarginModeModalVisible(false);
    setIsLeverageModalVisible(false);
    // iOS can't present a second Modal while the first is still dismissing.
    setTimeout(() => setIsBatchAdjustVisible(true), 350);
  };

  const confirmBatchAdjust = async ({ leverageEnabled, leverage, marginModeEnabled, marginMode: mode }) => {
    if (!isLoggedIn) {
      alertErrorMessage('Please sign in to batch adjust.');
      setIsBatchAdjustVisible(false);
      navigation.navigate(LOGIN_SCREEN);
      return false;
    }
    if (!leverageEnabled && !marginModeEnabled) {
      alertErrorMessage('Enable leverage and/or margin mode first.');
      return false;
    }
    const body = { all_symbols: true };
    if (leverageEnabled) body.leverage = leverage;
    if (marginModeEnabled) body.margin_mode = toApiMarginMode(mode);
    try {
      const res = await appOperation.customer.futuresLeverageMarginBatch(body);
      if (!res?.success) {
        alertErrorMessage(formatFuturesSymbolMarginError(res, 'Batch adjust failed'));
        return false;
      }
      const summary = summarizeLeverageMarginBatch(res.data);
      const row = Array.isArray(res.data?.results)
        ? res.data.results.find((r) => r?.symbol === futuresSymbol)
        : null;
      if (row) {
        applySymbolSettings(row);
      } else {
        if (leverageEnabled) {
          setMarginLeverage(leverage);
          setLeverageDraft(leverage);
        }
        if (marginModeEnabled) {
          const uiMode = toUiMarginMode(toApiMarginMode(mode));
          setMarginMode(uiMode);
          setMarginModeDraft(uiMode);
        }
      }
      if (summary.failed > 0 && summary.succeeded === 0) {
        alertErrorMessage(summary.detail || summary.title);
        return false;
      }
      if (summary.failed > 0) {
        alertSuccessMessage(`${summary.title}${summary.detail ? ` — ${summary.detail}` : ''}`);
      } else {
        alertSuccessMessage(summary.title);
      }
      return true;
    } catch (e) {
      alertErrorMessage(formatFuturesSymbolMarginError(e, 'Batch adjust failed. Please try again.'));
      return false;
    }
  };
  const [contractUnit, setContractUnit] = useState('Amount (BTC)');
  const [contractUnitDraft, setContractUnitDraft] = useState('Amount (BTC)');
  const contractUnitSheetRef = useRef(null);

  const currentBaseAsset = selectedCoin?.short_name || selectedCoin?.base_asset || selectedCoin?.base_currency || (selectedCoin?.symbol ? selectedCoin.symbol.split('USDT')[0].replace(/[^A-Za-z0-9]/g, '') : '') || 'BTC';
  const currentQuoteAsset = selectedCoin?.margin_asset || selectedCoin?.quote_asset || selectedCoin?.quote_currency || 'USDT';

  useEffect(() => { clearFieldError('amount'); }, [amount, contractUnit, clearFieldError]);
  useEffect(() => { clearFieldError('price'); }, [price, clearFieldError]);
  useEffect(() => { clearFieldError('trigger'); }, [triggerPrice, clearFieldError]);
  useEffect(() => { clearFieldError('orderPrice'); }, [conditionalPrice, clearFieldError]);
  useEffect(() => { clearFieldError('tp'); }, [formTp, clearFieldError]);
  useEffect(() => { clearFieldError('sl'); }, [formSl, clearFieldError]);
  useEffect(() => { setOrderFieldError(null); }, [orderType, activeTab, selectedCoin?.symbol]);

  const amountHint = isAmountFocused
    ? buildAmountHint({
      amountRaw: amount,
      isQuote: contractUnit.includes('Value'),
      price: orderType === 'Limit'
        ? (parseFloat(String(price).replace(/,/g, '')) || livePrice)
        : orderType === 'Conditional'
          ? (parseFloat(String(conditionalPrice).replace(/,/g, '')) || parseFloat(String(triggerPrice).replace(/,/g, '')) || livePrice)
          : (Number(liveCoin?.mark_price) || livePrice),
      stepSize: selectedCoin?.step_size,
      tickSize: selectedCoin?.tick_size,
      minOrderQty: selectedCoin?.min_order_qty,
      minNotional: selectedCoin?.min_notional,
      base: currentBaseAsset,
      quote: currentQuoteAsset,
      defaultStep: 0.001,
    })
    : '';
  const fieldErrorText = (field) => (orderFieldError?.field === field ? orderFieldError.text : '');
  const fieldErrorBorder = (field) => (fieldErrorText(field) ? { borderColor: FIELD_ERROR_COLOR, borderWidth: 1 } : null);
  const renderFieldError = (field) => {
    const text = fieldErrorText(field);
    return text ? <AppText weight={MEDIUM} style={fieldErrorStyles.error}>{text}</AppText> : null;
  };

  useEffect(() => {
    if (selectedCoin) {
      const isValueUnit = (contractUnit || '').includes('Value');
      if (isValueUnit) {
        setContractUnit(`Value (${currentQuoteAsset})`);
        setContractUnitDraft(`Value (${currentQuoteAsset})`);
      } else {
        setContractUnit(`Amount (${currentBaseAsset})`);
        setContractUnitDraft(`Amount (${currentBaseAsset})`);
      }
    }
  }, [selectedCoin?.symbol, selectedCoin?._id, currentBaseAsset, currentQuoteAsset]);

  // Precision Dropdown State
  const obPrecisionOptions = React.useMemo(() => {
    return getOrderBookAggOptionsForPair(getTickSize(selectedCoin));
  }, [selectedCoin]);

  const [precision, setPrecision] = useState(null);

  useEffect(() => {
    if (selectedCoin) {
      const tick = getTickSize(selectedCoin);
      setPrecision(tick);
    }
  }, [selectedCoin?.symbol, selectedCoin?._id]);
  const [obPrecisionOpen, setObPrecisionOpen] = useState(false);
  const [obPrecisionLayout, setObPrecisionLayout] = useState(null);
  const precisionTriggerRef = useRef(null);

  // Order Book Layout Switcher State
  const [viewModeIndex, setViewModeIndex] = useState(0);

  const cycleViewMode = () => {
    setViewModeIndex((i) => (i + 1) % 3);
  };

  const openObPrecisionMenu = () => {
    precisionTriggerRef.current?.measure((x, y, w, h, pageX, pageY) => {
      setObPrecisionLayout({ x: pageX, y: pageY, w, h });
      setObPrecisionOpen(true);
    });
  };

  const closeObPrecisionMenu = () => {
    setObPrecisionOpen(false);
    setObPrecisionLayout(null);
  };
  const [marginLeverage, setMarginLeverage] = useState(1);
  const [leverageDraft, setLeverageDraft] = useState(1);
  const [isLeverageModalVisible, setIsLeverageModalVisible] = useState(false);
  const [isSavingLeverage, setIsSavingLeverage] = useState(false);
  const [isLeverageSliding, setIsLeverageSliding] = useState(false);
  const rbSheetMarginLeverage = useRef(null);
  const batchAdjustTrail = formatBatchAdjustTrail(batchAdjustDraft, {
    leverage: marginLeverage,
    marginMode,
  });

  const closeLeverageSheet = () => {
    if (isSavingLeverage) return;
    setIsLeverageModalVisible(false);
    rbSheetMarginLeverage.current?.close();
  };

  const confirmLeverage = async () => {
    if (isSavingLeverage) return;
    const maxL = Number(selectedCoin?.max_leverage) || 125;
    const nextLev = Math.min(Math.max(1, Math.round(Number(leverageDraft) || 1)), maxL);
    if (!futuresSymbol) {
      alertErrorMessage('Select a contract first.');
      return;
    }
    if (!isLoggedIn) {
      alertErrorMessage('Please sign in to change leverage.');
      setIsLeverageModalVisible(false);
      navigation.navigate(LOGIN_SCREEN);
      return;
    }
    setIsSavingLeverage(true);
    try {
      const res = await appOperation.customer.futuresSetLeverage({ symbol: futuresSymbol, leverage: nextLev });
      if (!res?.success) {
        alertErrorMessage(formatFuturesSymbolMarginError(res, 'Failed to update leverage'));
        return;
      }
      const savedLev = toUiLeverage(res?.data?.leverage) ?? nextLev;
      setMarginLeverage(savedLev);
      setLeverageDraft(savedLev);
      if (res?.data?.margin_mode != null) {
        const savedMode = toUiMarginMode(res.data.margin_mode);
        setMarginMode(savedMode);
        setMarginModeDraft(savedMode);
      }
      alertSuccessMessage('Leverage updated');
      setIsLeverageModalVisible(false);
      rbSheetMarginLeverage.current?.close();
    } catch {
      alertErrorMessage('Failed to update leverage. Please try again.');
    } finally {
      setIsSavingLeverage(false);
    }
  };

  const triggerPriceInputRef = useRef(null);
  const priceInputRef = useRef(null);
  const amountInputRef = useRef(null);
  const tpInputRef = useRef(null);
  const slInputRef = useRef(null);

  useEffect(() => {
    if (selectedCoin?.max_leverage) {
      const maxL = Number(selectedCoin.max_leverage);
      if (maxL > 0 && marginLeverage > maxL) {
        setMarginLeverage(maxL);
        setLeverageDraft(maxL);
      }
    }
  }, [selectedCoin?.max_leverage, marginLeverage]);

  const ORDER_TYPE_SHEET_BASIC = [
    {
      name: "Limit",
      description: "Buy or sell at your chosen price or better.",
      icon: TrendingUp,
    },
    {
      name: "Market",
      description: "Instantly trade at the current market price.",
      icon: ShoppingCart,
    },
  ];

  const ORDER_TYPE_SHEET_CONDITIONAL = [
    {
      name: "Conditional",
      description: "Your order will be placed automatically when the target price is reached.",
      icon: Target,
    },
  ];

  const renderOrderTypeRow = (item) => {
    const selected = orderType === item.name;
    const IconComponent = item.icon;
    return (
      <TouchableOpacity
        key={item.name}
        activeOpacity={0.75}
        onPress={() => {
          setOrderType(item.name);
          setOrderFieldError(null);
          if (item.name === 'Market') {
            setPrice('');
          } else if (item.name === 'Limit') {
            const live = Number(livePrice) || Number(liveCoin?.mark_price) || Number(selectedCoin?.buy_price) || 0;
            if (live > 0) setPrice(String(formatPriceByTick(live, selectedCoin)));
          }
          setIsOrderTypeModalVisible(false);
          orderTypeSheetRef.current?.close();
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: selected
            ? (isDark ? "rgba(209, 170, 103, 0.10)" : "#FBF5EA")
            : (isDark ? (darkTheme.darkThemeInputColor || "#1E1E24") : "#F5F6F8"),
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected
            ? colors.orangeTheme
            : (isDark ? "rgba(255, 255, 255, 0.08)" : "#E5E7EB"),
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E9ECEF",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {IconComponent && (
            <IconComponent
              color={selected ? colors.orangeTheme : themeColors.secondaryText}
              size={20}
              strokeWidth={2}
            />
          )}
        </View>
        <View style={{ flex: 1, marginRight: 12 }}>
          <AppText weight={SEMI_BOLD} style={{ fontSize: 14, color: themeColors.text }}>
            {item.name}
          </AppText>
          <AppText
            weight={MEDIUM}
            style={{
              fontSize: 12,
              color: themeColors.secondaryText,
              marginTop: 4,
              lineHeight: 16,
            }}
          >
            {item.description}
          </AppText>
        </View>
        <View style={{ width: 24, alignItems: "center", justifyContent: "center" }}>
          {selected ? (
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.orangeTheme,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check color="#FFF" size={14} strokeWidth={3} />
            </View>
          ) : (
            <LucideCircle color={isDark ? "rgba(255, 255, 255, 0.3)" : "#C7C7CC"} size={22} strokeWidth={1.5} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    const pairsArray = (futuresPairs && futuresPairs.length > 0)
      ? futuresPairs
      : (futuresData?.contracts || futuresData?.pairs || []);

    if (pairsArray && pairsArray.length > 0) {
      setPairData(pairsArray);

      setPrice(prevPrice => {
        if (initialPriceSeededRef.current) return prevPrice;
        if (prevPrice && prevPrice !== "") {
          initialPriceSeededRef.current = true;
          return prevPrice;
        }
        const btcPair = pairsArray.find((pair) => pair.symbol === "BTCUSDT-PERP");
        const initPair = btcPair || pairsArray[0];
        if (initPair) {
          const p = initPair.buy_price ?? initPair.last_price ?? initPair.mark_price;
          if (p) {
            initialPriceSeededRef.current = true;
            return String(formatPriceByTick(parseFloat(p), initPair));
          }
        }
        return prevPrice;
      });

      setSelectedCoin(prev => {
        if (prev) return prev;
        const btcPair = pairsArray.find((pair) => pair.symbol === "BTCUSDT-PERP");
        const initPair = btcPair || pairsArray[0];
        if (initPair) {
          limitPriceSeededPairRef.current = initPair?._id;
        }
        return initPair;
      });
    }
  }, [futuresPairs, futuresData]);

  useEffect(() => {
    if (!isFocused) return undefined;

    const task = InteractionManager.runAfterInteractions(() => {
      dispatch(getOpenOrders(0, 10, "cross", selectedCoin?.symbol));
      dispatch(getUserFuturesWallet("futures"));
    });

    return () => task.cancel();
  }, [isFocused, pairData.length, subscribeToFutures, unsubscribeFromFutures, dispatch, selectedCoin?.symbol]);

  useEffect(() => {
    if (isFocused && selectedCoin) {
      subscribeToFutures({ symbol: selectedCoin.symbol });
      return () => {
        dispatch(setFuturesData(null));
        unsubscribeFromFutures({ symbol: selectedCoin.symbol, base_currency_id: selectedCoin._id });
      };
    }
  }, [isFocused, selectedCoin, subscribeToFutures, unsubscribeFromFutures, dispatch]);

  useEffect(() => {
    if (isFocused) {
      subscribeToMarket?.("futures");
    } else {
      unsubscribeFromMarket?.("futures");
    }
  }, [isFocused, subscribeToMarket, unsubscribeFromMarket]);

  const openPairSheet = React.useCallback(() => {
    if (!liveCoin) return;
    if (pairOpenLockRef.current) return;
    pairOpenLockRef.current = true;
    pairSheetRef.current?.open();
    setTimeout(() => {
      pairOpenLockRef.current = false;
    }, 400);
  }, [liveCoin]);

  const handleSelectCoin = (pair) => {
    dispatch(setFuturesData(null));
    setSelectedCoin(pair);
    pairSheetRef.current?.close();
    setSearchTerm("");
    const p = pair?.buy_price ?? pair?.last_price ?? pair?.mark_price;
    if (p) {
      setPrice(String(formatPriceByTick(parseFloat(p), pair)));
    }
    subscribeToFutures({ symbol: pair.symbol });
  };


  const renderHeader = React.useCallback(() => (
    <View style={{ paddingTop: 10, paddingBottom: 10, paddingHorizontal: 16, backgroundColor: themeColors.background }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity
          style={styles.pairTouchTarget}
          onPress={openPairSheet}
          activeOpacity={0.75}
          disabled={!liveCoin}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Select trading pair"
        >
          {liveCoin ? (
            <>
              <View style={styles.pairRow}>
                <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ fontSize: 20 }}>
                  {`${liveCoin.short_name || liveCoin.base_asset}/${liveCoin.margin_asset}`}
                </AppText>
                <FastImage source={downIcon} style={styles.smallIcon} resizeMode="contain" tintColor={themeColors.text} />
              </View>
              <View style={styles.changeBadge}>
                <AppText type={TWELVE} weight={MEDIUM} style={{ color: colors.white }}>
                  {`${liveCoin.change_percentage >= 0 ? '+' : ''}${liveCoin.change_percentage || 0}%`}
                </AppText>
              </View>
            </>
          ) : (
            <>
              <ShimmerBox width={150} height={24} borderRadius={4} />
              <View style={{ marginTop: 4 }}>
                <ShimmerBox width={60} height={18} borderRadius={4} />
              </View>
            </>
          )}
        </TouchableOpacity>

        <View style={[styles.headerIcons, { flexDirection: 'row', gap: 4 }]}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => {
              if (liveCoin) {
                NavigationService.navigate('FutureChartScreen', { coin: liveCoin, tradeType: 'Future' });
              }
            }}
          >
            <FastImage
              source={candle}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
              tintColor={themeColors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => {
              if (!userData) {
                showError("Please login first to view futures history");
                navigation.navigate(LOGIN_SCREEN);
                return;
              }
              if (liveCoin) {
                navigation.navigate('FutureHistoryScreen', { selectedCoin: liveCoin, initialTab: activeHistoryTab });
              }
            }}
          >
            <FastImage
              source={history_line}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
              tintColor={themeColors.text}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [activeHistoryTab, liveCoin, navigation, openPairSheet, themeColors.text, userData]);

  // Both sides: N rows each; single-side view: 2N rows, so the book keeps the same height.
  const visibleRowCount = viewModeIndex === 0 ? ORDER_BOOK_VISIBLE_ROWS : ORDER_BOOK_VISIBLE_ROWS * 2;
  const orderBookListHeight = visibleRowCount * ORDER_BOOK_ROW_LAYOUT_HEIGHT;

  const obAsks = React.useMemo(() => {
    if (viewModeIndex === 1) return [];
    const allAsks = normalizeOrderbookOrders(futuresData?.sell_order || []);
    const aggregated = aggregateOrderBookRows(allAsks, precision);
    const sorted = [...aggregated].sort((a, b) => Number(a.price) - Number(b.price));
    const sliced = sorted.slice(0, visibleRowCount);
    const data = [...sliced];
    while (data.length < visibleRowCount) {
      data.push({ isPlaceholder: true, _id: `placeholder-ask-${data.length}` });
    }
    return data;
  }, [futuresData?.sell_order, viewModeIndex, precision, visibleRowCount]);

  const obBids = React.useMemo(() => {
    if (viewModeIndex === 2) return [];
    const allBids = normalizeOrderbookOrders(futuresData?.buy_order || []);
    const aggregated = aggregateOrderBookRows(allBids, precision);
    const sorted = [...aggregated].sort((a, b) => Number(b.price) - Number(a.price));
    const sliced = sorted.slice(0, visibleRowCount);
    const data = [...sliced];
    while (data.length < visibleRowCount) {
      data.push({ isPlaceholder: true, _id: `placeholder-bid-${data.length}` });
    }
    return data;
  }, [futuresData?.buy_order, viewModeIndex, precision, visibleRowCount]);

  const maxVolume = React.useMemo(() => {
    const askVols = obAsks.filter(a => !a.isPlaceholder).map(a => Number(a.remaining) || 0);
    const bidVols = obBids.filter(b => !b.isPlaceholder).map(b => Number(b.remaining) || 0);
    const maxAsk = askVols.length > 0 ? Math.max(...askVols) : 0;
    const maxBid = bidVols.length > 0 ? Math.max(...bidVols) : 0;
    return Math.max(maxAsk, maxBid) || 1;
  }, [obAsks, obBids]);

  const orderBookBidAskRatio = React.useMemo(() => {
    const bid = obBids.filter(b => !b?.isPlaceholder).reduce((s, o) => s + (Number(o?.remaining) || 0), 0);
    const ask = obAsks.filter(a => !a?.isPlaceholder).reduce((s, o) => s + (Number(o?.remaining) || 0), 0);
    const t = bid + ask;
    if (t <= 0) return { bidPct: 50, askPct: 50 };
    return { bidPct: (bid / t) * 100, askPct: (ask / t) * 100 };
  }, [obBids, obAsks]);

  const renderAskItem = React.useCallback(({ item }) => (
    <TouchableOpacity onPress={() => {
      if (item.isPlaceholder) return;
      const priceDecimals = Math.max(getDecimalPlaces(precision || getTickSize(selectedCoin)), 0);
      setPrice(String(Number(item.price).toFixed(priceDecimals)));
    }}>
      <OrderBookAskRow
        item={item}
        maxVolume={maxVolume}
        themeColors={themeColors}
        isDark={isDark}
        selectedCoin={selectedCoin}
        precision={precision}
        styles={styles}
      />
    </TouchableOpacity>
  ), [maxVolume, themeColors, isDark, selectedCoin, precision]);

  const renderBidItem = React.useCallback(({ item }) => (
    <TouchableOpacity onPress={() => {
      if (item.isPlaceholder) return;
      const priceDecimals = Math.max(getDecimalPlaces(precision || getTickSize(selectedCoin)), 0);
      setPrice(String(Number(item.price).toFixed(priceDecimals)));
    }}>
      <OrderBookBidRow
        item={item}
        maxVolume={maxVolume}
        themeColors={themeColors}
        isDark={isDark}
        selectedCoin={selectedCoin}
        precision={precision}
        styles={styles}
      />
    </TouchableOpacity>
  ), [maxVolume, themeColors, isDark, selectedCoin, precision]);

  const getLayout = React.useCallback((_, index) => ({
    length: ORDER_BOOK_ROW_LAYOUT_HEIGHT, offset: ORDER_BOOK_ROW_LAYOUT_HEIGHT * index, index
  }), []);

  const renderOrderBook = () => (
    <View style={styles.leftColumn}>
      <View style={styles.fundingTickerWrap}>
        <FuturesFundingTicker pair={liveCoin} liveContract={futuresData?.contract} active={isFocused} />
      </View>
      <View style={styles.obHeader}>
        <AppText type={TEN} color={themeColors.secondaryText}>
          Price{"\n"}({selectedCoin?.margin_asset || selectedCoin?.quote_asset || 'USDT'})
        </AppText>
        <AppText type={TEN} color={themeColors.secondaryText} style={{ textAlign: 'right' }}>
          Size{"\n"}({selectedCoin?.short_name || selectedCoin?.base_asset || 'BTC'})
        </AppText>
      </View>

      {(!futuresData?.sell_order && !futuresData?.buy_order) ? (
        <View>
          <OrderBookSkeleton />
          <View style={[styles.currentPrice, { alignItems: 'flex-start', justifyContent: 'center' }]}>
            <ShimmerBox width="100%" height={20} borderRadius={4} />
            <ShimmerBox width="80%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
          <OrderBookSkeleton />
        </View>
      ) : (
        <View>
          {/* Asks */}
          {obAsks.length > 0 && (
            <View style={{ height: orderBookListHeight, width: '100%' }}>
              <FlatList
                data={obAsks}
                inverted={true}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={false}
                scrollEnabled={false}
                removeClippedSubviews={true}
                initialNumToRender={visibleRowCount}
                maxToRenderPerBatch={visibleRowCount}
                windowSize={3}
                getItemLayout={getLayout}
                keyExtractor={(item, i) => item._id ? `ask-${item._id}` : `ask-idx-${i}`}
                renderItem={renderAskItem}
              />
            </View>
          )}

          {/* Current Price */}
          <View style={[styles.currentPrice, { alignItems: 'flex-start' }]}>
            <AppText style={{ color: isPricePositive ? colors.green : colors.red, fontWeight: "bold", fontSize: 19 }}>
              {livePrice ? Number(livePrice).toFixed(selectedCoin?.quote_decimal || 2) : "0.00"}
            </AppText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <AppText style={{ fontSize: 11, color: "#8E8E93", fontWeight: "500" }}>
                ≈ ${livePrice ? Number(livePrice).toFixed(selectedCoin?.quote_decimal || 2) : "0.00"}
              </AppText>
            </View>
          </View>

          {/* Bids */}
          {obBids.length > 0 && (
            <View style={{ height: orderBookListHeight, width: '100%' }}>
              <FlatList
                data={obBids}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={false}
                scrollEnabled={false}
                removeClippedSubviews={true}
                initialNumToRender={visibleRowCount}
                maxToRenderPerBatch={visibleRowCount}
                windowSize={3}
                getItemLayout={getLayout}
                keyExtractor={(item, i) => item._id ? `bid-${item._id}` : `bid-idx-${i}`}
                renderItem={renderBidItem}
              />
            </View>
          )}
        </View>
      )}

      {/* Ratio Indicator */}
      <View style={[styles.ratioIndicatorBar, { marginVertical: 8, gap: 4 }]}>
        <View style={{ justifyContent: "flex-start", flexShrink: 0 }}>
          <AppText numberOfLines={1} weight={SEMI_BOLD} style={{ color: "#38B781", fontSize: 10 }}>
            {orderBookBidAskRatio.bidPct.toFixed(2)}%
          </AppText>
        </View>
        <View style={[styles.ratioIndicatorTrack, { flex: 1, height: 3 }]}>
          <View style={[styles.ratioIndicatorFill, { width: `${orderBookBidAskRatio.bidPct}%`, backgroundColor: "#38B781", borderTopLeftRadius: 2, borderBottomLeftRadius: 2 }]} />
          <View style={[styles.ratioIndicatorFill, { flex: 1, backgroundColor: "#ED4E4E", borderTopRightRadius: 2, borderBottomRightRadius: 2 }]} />
        </View>
        <View style={{ justifyContent: "flex-end", flexShrink: 0 }}>
          <AppText numberOfLines={1} weight={SEMI_BOLD} style={{ color: "#ED4E4E", fontSize: 10 }}>
            {orderBookBidAskRatio.askPct.toFixed(2)}%
          </AppText>
        </View>
      </View>

      {/* Precision Dropdown */}
      <View style={styles.spotObToolbarRow}>
        <TouchableOpacity
          ref={precisionTriggerRef}
          onPress={openObPrecisionMenu}
          style={[styles.spotObAggTrigger, { backgroundColor: isDark ? darkTheme.darkThemeInputColor : themeColors.input, borderColor: themeColors.themeBorderColor, borderRadius: 5 }]}
          activeOpacity={0.75}
        >
          <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 11, lineHeight: 14 }}>{precision}</AppText>
          <FastImage source={downIcon} style={styles.spotObAggCaret} resizeMode='contain' tintColor={themeColors.secondaryText} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={cycleViewMode}
          style={[styles.spotObViewCycleBtn, { backgroundColor: isDark ? darkTheme.darkThemeInputColor : themeColors.input, borderColor: themeColors.themeBorderColor }]}
          activeOpacity={0.75}
        >
          <FastImage source={SPOT_OB_VIEW_ICONS[viewModeIndex]} style={styles.layoutIcon} resizeMode='contain' />
        </TouchableOpacity>
      </View>

      <Modal visible={obPrecisionOpen} transparent animationType="fade" onRequestClose={closeObPrecisionMenu}>
        <Pressable style={styles.spotObAggBackdrop} onPress={closeObPrecisionMenu} />
        {obPrecisionLayout ? (
          <View
            style={[
              styles.spotObAggPopover,
              {
                top: obPrecisionLayout.y + obPrecisionLayout.h + 4,
                left: Math.max(8, Math.min(obPrecisionLayout.x + obPrecisionLayout.w - 144, Width - 8 - 144)),
                backgroundColor: isDark ? darkTheme.darkThemeInputColor : themeColors.card,
                borderColor: themeColors.themeBorderColor,
              },
            ]}
          >
            {obPrecisionOptions.map((opt) => {
              const selected = precision === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.spotObAggRow,
                    selected && { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setPrecision(opt);
                    closeObPrecisionMenu();
                  }}
                >
                  <AppText
                    type={TEN}
                    weight={selected ? SEMI_BOLD : undefined}
                    style={{ color: themeColors.text, fontSize: 11, lineHeight: 14 }}
                  >
                    {opt}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </Modal>
    </View>
  );

  const renderOrderForm = () => {
    const resolveMaxAndCost = () => {
      if (!selectedCoin) {
        return { costText: '0.00 USDT', maxText: '0.0000 BTC', maxNotional: 0 };
      }

      const balanceToUse = futuresAvailable;
      const takerFeeRate = resolveTakerFeeRate(selectedCoin);

      const stats = computeFuturesLeverageStats({
        availableBalance: balanceToUse,
        leverage: marginLeverage,
        maxLeverage: selectedCoin?.max_leverage || 125,
        leverageTiers: selectedCoin?.leverage_tiers || [],
        takerFeeRate,
      });

      const maxNotional = stats.allowToOpen || 0;

      let px = Number(price) || 0;
      if (!px || px <= 0) {
        px = Number(liveCoin?.mark_price) || 0;
      }

      let maxQty = px > 0 ? maxNotional / px : 0;
      const orderCap = Number(selectedCoin?.max_order_qty);
      if (Number.isFinite(orderCap) && orderCap > 0) {
        maxQty = Math.min(maxQty, orderCap);
      }

      const step = Number(selectedCoin?.step_size) || 0.0001;
      const stepDec = (() => {
        const s = String(step);
        const dot = s.indexOf(".");
        return dot === -1 ? 0 : s.length - dot - 1;
      })();
      const steps = Math.floor(maxQty / step + 1e-12);
      const roundedMaxQty = parseFloat((steps * step).toFixed(stepDec));

      const isValueUnit = contractUnit && contractUnit.includes('Value');
      const baseAsset = selectedCoin?.base_asset || selectedCoin?.short_name || 'BTC';
      const marginAsset = selectedCoin?.margin_asset || 'USDT';

      let maxText = '';
      if (isValueUnit) {
        const quoteDec = selectedCoin?.quote_decimal ?? 2;
        maxText = `${maxNotional.toFixed(quoteDec)} ${marginAsset}`;
      } else {
        maxText = `${roundedMaxQty} ${baseAsset}`;
      }

      const qty = Number(amount) || 0;
      const lev = Math.max(1, Number(marginLeverage) || 1);
      const currentNotional = isValueUnit ? qty : qty * px;
      const orderCost = qty > 0 && lev > 0 ? currentNotional / lev : 0;
      const quoteDec = selectedCoin?.quote_decimal ?? 2;
      const costText = `${orderCost.toFixed(quoteDec)} ${marginAsset}`;

      return {
        costText,
        maxText,
        maxNotional,
      };
    };
    const { costText, maxText, maxNotional } = resolveMaxAndCost();
    const quoteAsset = selectedCoin?.quote_currency || selectedCoin?.margin_asset || 'USDT';
    // Web formatMarginHeadroomPair: (max notional − available) / max notional, in quote decimals.
    const marginDec = Number.isFinite(Number(selectedCoin?.quote_decimal)) ? Number(selectedCoin.quote_decimal) : 2;
    const marginMax = Number.isFinite(maxNotional) && maxNotional > 0 ? maxNotional : 0;
    const marginHeadroom = Math.max(0, marginMax - Math.max(0, futuresAvailable));

    const handlePriceStep = (direction) => {
      const tick = getTickSize(selectedCoin);
      const targetPrice = orderType === 'Conditional' ? conditionalPrice : price;
      const current = Number(targetPrice) || Number(livePrice) || 0;
      const nextVal = Math.max(0, current + direction * tick);
      const dp = getDecimalPlaces(tick);
      const formatted = nextVal.toFixed(dp);
      if (orderType === 'Conditional') {
        setConditionalPrice(formatted);
      } else {
        setPrice(formatted);
      }
    };

    const handleAmountStep = (direction) => {
      const isValueUnit = (contractUnit || '').includes('Value');
      const step = isValueUnit ? Math.pow(10, -(selectedCoin?.quote_decimal ?? 2)) : getStepSize(selectedCoin);
      const current = Number(amount) || 0;
      const nextVal = Math.max(0, current + direction * step);
      const dp = getDecimalPlaces(step);
      setAmount(nextVal > 0 ? nextVal.toFixed(dp) : '');
      setSliderValue(0);
    };

    return (
      <View style={styles.rightColumn}>
        {/* Buy / Sell Toggle */}
        <View style={[styles.toggleContainer, { backgroundColor: isDark ? '#2a2d35' : '#F7F7F7', marginBottom: 10 }]}>
          <TouchableOpacity style={[styles.toggleBtn, activeTab === 'Buy' && styles.toggleActive]} onPress={() => setActiveTab('Buy')}>
            <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: activeTab === 'Buy' ? colors.white : themeColors.secondaryText }}>Buy</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, activeTab === 'Sell' && { backgroundColor: colors.red }]} onPress={() => setActiveTab('Sell')}>
            <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: activeTab === 'Sell' ? colors.white : themeColors.secondaryText }}>Sell</AppText>
          </TouchableOpacity>
        </View>

        {/* Margin / Leverage Row */}
        {isSymbolSettingsLoading ? (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <ShimmerBox height={36} borderRadius={8} style={{ flex: 1 }} />
            <ShimmerBox height={36} borderRadius={8} style={{ flex: 0.8 }} />
          </View>
        ) : (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: isDark ? darkTheme.darkThemeInputColor : '#F7F7F7',
              borderColor: isDark ? darkTheme.inputBorder : themeColors.border,
              borderWidth: 0.8,
              borderRadius: 8,
              height: 36,
              paddingHorizontal: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onPress={() => {
              setMarginModeDraft(marginMode);
              setIsMarginModeModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 13 }}>
              {marginMode === 'Cross' ? 'Cross' : 'Isolated'}
            </AppText>
            <FastImage source={downIcon} style={{ width: 10, height: 10 }} resizeMode='contain' tintColor="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 0.8,
              backgroundColor: isDark ? darkTheme.darkThemeInputColor : '#F7F7F7',
              borderColor: isDark ? darkTheme.inputBorder : themeColors.border,
              borderWidth: 0.8,
              borderRadius: 8,
              height: 36,
              paddingHorizontal: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onPress={() => {
              setLeverageDraft(marginLeverage);
              setIsLeverageModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 13 }}>
              {marginLeverage}x
            </AppText>
            <FastImage source={downIcon} style={{ width: 10, height: 10 }} resizeMode='contain' tintColor="#8E8E93" />
          </TouchableOpacity>
        </View>
        )}

        {/* Order Type Dropdown */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsOrderTypeModalVisible(true)}
          style={{
            backgroundColor: isDark ? darkTheme.darkThemeInputColor : '#F7F7F7',
            borderColor: isDark ? darkTheme.inputBorder : themeColors.border,
            borderWidth: 0.8,
            borderRadius: 8,
            height: 36,
            marginBottom: 10,
            paddingHorizontal: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 13 }}>
              {orderType}
            </AppText>
            <FastImage
              source={INFO}
              style={{ height: 13, width: 13, marginLeft: 6 }}
              resizeMode="contain"
              tintColor="#8E8E93"
            />
          </View>
          <FastImage
            source={downIcon}
            resizeMode="contain"
            style={{ width: 10, height: 10 }}
            tintColor="#8E8E93"
          />
        </TouchableOpacity>

        {/* Trigger Price Input (Only for Conditional) */}
        {orderType === 'Conditional' && (
          <View style={{ marginBottom: 10 }}>
            <AppText style={{ fontSize: 11, color: "#8E8E93", marginBottom: 4 }}>Trigger Price ({currentQuoteAsset})</AppText>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? darkTheme.darkThemeInputColor : "#F7F7F7",
                borderColor: isDark ? darkTheme.inputBorder : themeColors.border,
                borderWidth: 0.8,
                borderRadius: 8,
                height: 36,
                ...fieldErrorBorder('trigger'),
              }}
            >
              <TextInput
                ref={triggerPriceInputRef}
                placeholder="Trigger Price"
                placeholderTextColor="#8E8E93"
                selectionColor={colors.orangeTheme}
                value={triggerPrice}
                maxLength={(() => {
                  const tick = getTickSize(selectedCoin);
                  const maxDp = getDecimalPlaces(tick);
                  const dotIdx = (triggerPrice || '').indexOf('.');
                  return dotIdx >= 0 ? dotIdx + 1 + maxDp : undefined;
                })()}
                onChangeText={(text) => {
                  const tick = getTickSize(selectedCoin);
                  const sanitized = sanitizeIncrementInput(text, tick);
                  setTriggerPrice(sanitized);
                }}
                onFocus={() => setIsTriggerFocused(true)}
                onBlur={() => setIsTriggerFocused(false)}
                keyboardType="numeric"
                textAlign="center"
                style={{
                  flex: 1,
                  color: isDark ? "#FFFFFF" : "#000000",
                  fontSize: 12,
                  fontFamily: fontFamilyMedium,
                  paddingVertical: 0,
                  ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                }}
              />
            </View>
            {renderFieldError('trigger')}
          </View>
        )}

        {/* Price Input */}
        <View style={{ marginBottom: 10 }}>
          <AppText style={{ fontSize: 11, color: "#8E8E93", marginBottom: 4 }}>
            {orderType === 'Conditional' ? `Order Price (${currentQuoteAsset})` : `Price (${currentQuoteAsset})`}
          </AppText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? darkTheme.darkThemeInputColor : "#F7F7F7",
              borderColor: isDark ? darkTheme.inputBorder : themeColors.border,
              borderWidth: 0.8,
              borderRadius: 8,
              height: 36,
              ...fieldErrorBorder(orderType === 'Conditional' ? 'orderPrice' : 'price'),
            }}
          >
            {orderType !== 'Market' ? (
              <>
                <TouchableOpacity
                  onPress={() => handlePriceStep(-1)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ paddingHorizontal: 10, paddingVertical: 8 }}
                >
                  <AppText style={{ fontSize: 18, color: "#8E8E93", fontWeight: "600", lineHeight: 20 }}>-</AppText>
                </TouchableOpacity>
                <TextInput
                  ref={priceInputRef}
                  placeholder={orderType === 'Limit' && Number(livePrice) > 0
                    ? String(formatPriceByTick(Number(livePrice), selectedCoin))
                    : "Price"}
                  placeholderTextColor="#8E8E93"
                  selectionColor={colors.orangeTheme}
                  value={orderType === 'Conditional' ? conditionalPrice : price}
                  maxLength={(() => {
                    const tick = getTickSize(selectedCoin);
                    const maxDp = getDecimalPlaces(tick);
                    const currentVal = orderType === 'Conditional' ? (conditionalPrice || '') : (price || '');
                    const dotIdx = currentVal.indexOf('.');
                    return dotIdx >= 0 ? dotIdx + 1 + maxDp : undefined;
                  })()}
                  onChangeText={(text) => {
                    const tick = getTickSize(selectedCoin);
                    const sanitized = sanitizeIncrementInput(text, tick);
                    if (orderType === 'Conditional') {
                      setConditionalPrice(sanitized);
                    } else {
                      setPrice(sanitized);
                    }
                  }}
                  onFocus={() => orderType === 'Conditional' ? setIsConditionalPriceFocused(true) : setIsPriceFocused(true)}
                  onBlur={() => {
                    if (orderType === 'Conditional') {
                      setIsConditionalPriceFocused(false);
                      return;
                    }
                    setIsPriceFocused(false);
                    // Web parity: an emptied limit price falls back to the live price on blur.
                    if (orderType === 'Limit' && !(parseFloat(price) > 0)) {
                      const live = Number(livePrice) || Number(liveCoin?.mark_price) || Number(selectedCoin?.buy_price) || 0;
                      if (live > 0) setPrice(String(formatPriceByTick(live, selectedCoin)));
                    }
                  }}
                  keyboardType="numeric"
                  textAlign="center"
                  style={{
                    flex: 1,
                    color: isDark ? "#FFFFFF" : "#000000",
                    fontSize: 12,
                    fontFamily: fontFamilyMedium,
                    paddingVertical: 0,
                    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                  }}
                />
                <TouchableOpacity
                  onPress={() => handlePriceStep(1)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ paddingHorizontal: 10, paddingVertical: 8 }}
                >
                  <AppText style={{ fontSize: 18, color: "#8E8E93", fontWeight: "600", lineHeight: 20 }}>+</AppText>
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <AppText style={{ color: "#8E8E93", fontSize: 12, fontWeight: "500" }}>
                  Best Market Price
                </AppText>
              </View>
            )}
          </View>
          {orderType === 'Conditional' ? renderFieldError('orderPrice') : renderFieldError('price')}
        </View>

        {/* Amount Input */}
        <View style={{ marginBottom: 10 }}>
          <AppText style={{ fontSize: 11, color: "#8E8E93", marginBottom: 4 }}>
            Amount ({currentBaseAsset})
          </AppText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? darkTheme.darkThemeInputColor : "#F7F7F7",
              borderColor: isDark ? darkTheme.inputBorder : themeColors.border,
              borderWidth: 0.8,
              borderRadius: 8,
              height: 36,
              ...fieldErrorBorder('amount'),
            }}
          >
            <TouchableOpacity
              onPress={() => handleAmountStep(-1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ paddingHorizontal: 10, paddingVertical: 8 }}
            >
              <AppText style={{ fontSize: 18, color: "#8E8E93", fontWeight: "600", lineHeight: 20 }}>-</AppText>
            </TouchableOpacity>
            <TextInput
              ref={amountInputRef}
              placeholder="Amount"
              placeholderTextColor="#8E8E93"
              selectionColor={colors.orangeTheme}
              value={amount}
              maxLength={(() => {
                const isValueUnit = (contractUnit || '').includes('Value');
                const increment = isValueUnit
                  ? Math.pow(10, -(selectedCoin?.quote_decimal ?? 2))
                  : getStepSize(selectedCoin);
                const maxDp = getDecimalPlaces(increment);
                const dotIdx = (amount || '').indexOf('.');
                return dotIdx >= 0 ? dotIdx + 1 + maxDp : undefined;
              })()}
              onChangeText={(text) => {
                const isValueUnit = (contractUnit || '').includes('Value');
                const increment = isValueUnit
                  ? Math.pow(10, -(selectedCoin?.quote_decimal ?? 2))
                  : getStepSize(selectedCoin);
                const sanitized = sanitizeIncrementInput(text, increment);
                setAmount(sanitized);
                setSliderValue(0);
              }}
              onFocus={() => {
                setIsAmountFocused(true);
                setSliderValue(0);
              }}
              onBlur={() => setIsAmountFocused(false)}
              keyboardType="numeric"
              textAlign="center"
              style={{
                flex: 1,
                color: isDark ? "#FFFFFF" : "#000000",
                fontSize: 12,
                fontFamily: fontFamilyMedium,
                paddingVertical: 0,
                ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
              }}
            />
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 10, paddingLeft: 4 }}
              onPress={() => {
                Keyboard.dismiss();
                setIsAmountFocused(false);
                setContractUnitDraft(contractUnit);
                contractUnitSheetRef.current?.open();
              }}
              activeOpacity={0.8}
            >
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.secondaryText }}>
                {(() => {
                  const match = contractUnit.match(/\(([^)]+)\)/);
                  const label = match ? match[1] : 'Cont.';
                  return label === 'Contracts' ? 'Cont.' : label;
                })()}
              </AppText>
              <FastImage source={downIcon} style={{ width: 8, height: 8 }} resizeMode='contain' tintColor={themeColors.secondaryText} />
            </TouchableOpacity>
          </View>
          {fieldErrorText('amount') ? renderFieldError('amount') : amountHint ? (
            <AppText style={[fieldErrorStyles.hint, { color: themeColors.secondaryText }]}>{amountHint}</AppText>
          ) : null}
        </View>

        {/* Slider */}
        {orderType !== 'Conditional' && (
          <View style={{ marginVertical: 10 }}>
            <PercentQuickSelect
              activeValue={sliderValue}
              onSelect={(val) => {
                Keyboard.dismiss();
                setIsAmountFocused(false);
                handleSliderChange(val);
                if (val === 0) {
                  setAmount('');
                }
              }}
              theme={themeObj.theme}
            />
          </View>
        )}

        {/* Available */}
        <View style={[styles.availableRow, { marginBottom: 2, marginTop: orderType == 'Conditional' ? 10 : 0 }]}>
          <AppText type={TWELVE} color={themeColors.secondaryText} style={{ marginRight: 8, paddingVertical: 2 }}>Available</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 2 }}>
            {(!futuresData || futuresData?.contract?.short_name !== selectedCoin?.short_name) ? (
              <ShimmerBox width={60} height={16} borderRadius={4} />
            ) : (
              <>
                <AppText type={TWELVE}
                  style={{ fontFamily: fontFamilyMedium }}>{parseFloat((Math.trunc(futuresAvailable * 100000) / 100000).toFixed(5))} USDT</AppText>
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={{ padding: 4 }}
                  onPress={() => {
                    if (!userData) {
                      showError("Please login first to view futures wallet");
                      navigation.navigate(LOGIN_SCREEN);
                      return;
                    }
                    navigation.navigate('WALLET_SCREEN', { activeTab: 'Futures' });
                  }}
                >
                  <FastImage source={add} tintColor={isDark ? colors.white : colors.black} style={{ width: 15, height: 15, marginLeft: 2 }} resizeMode='contain' />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Margin */}
        <View style={[styles.availableRow, { marginBottom: 10, flexWrap: 'wrap' }]}>
          <AppText type={TWELVE} color={themeColors.secondaryText} style={[styles.dashedUnderline, {
            marginRight: 8, paddingVertical: 2,
            color: isDark ? colors.white : colors.black,
            borderBottomColor: isDark ? colors.white : colors.black,
          }]}>Margin</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 2 }}>
            {!userData ? (
              <AppText type={TWELVE} style={{ fontFamily: fontFamilyMedium }}>-- / -- {quoteAsset}</AppText>
            ) : (!futuresData || futuresData?.contract?.short_name !== selectedCoin?.short_name) ? (
              <ShimmerBox width={80} height={16} borderRadius={4} />
            ) : (
              <>
                <AppText type={TWELVE} style={{ color: colors.green, fontFamily: fontFamilyMedium }}>{marginHeadroom.toFixed(marginDec)}</AppText>
                <AppText type={TWELVE} style={{ marginHorizontal: 4, fontFamily: fontFamilyMedium }}>/</AppText>
                <AppText type={TWELVE} style={{ color: colors.red, marginRight: 4, fontFamily: fontFamilyMedium }}>{marginMax.toFixed(marginDec)}</AppText>
                <AppText type={TWELVE} style={{ fontFamily: fontFamilyMedium }}>{quoteAsset}</AppText>
              </>
            )}
          </View>
        </View>

        {/* TP/SL */}
        <TouchableOpacity
          style={[styles.tpslRow, { justifyContent: 'space-between', marginBottom: showTpSl ? 12 : 8 }]}
          onPress={() => setShowTpSl(!showTpSl)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.checkbox, showTpSl && { backgroundColor: themeColors.text, borderColor: themeColors.text, alignItems: 'center', justifyContent: 'center' }]}>
              {showTpSl && <FastImage source={tick} style={{ width: 10, height: 10 }} tintColor={isDark ? colors.black : colors.white} resizeMode="contain" />}
            </View>
            <AppText type={TWELVE} style={[styles.dashedUnderline, {
              color: isDark ? colors.white : colors.black,
              borderBottomColor: isDark ? colors.white : colors.black,
            }]}>TP/SL</AppText>
          </View>
          {showTpSl && <AppText type={TWELVE}>Advanced</AppText>}
        </TouchableOpacity>

        {showTpSl && (
          <View style={{ marginBottom: 10 }}>
            {/* TP Input */}
            <View style={{ marginBottom: 10 }}>
              <AppText style={{ fontSize: 11, color: "#8E8E93", marginBottom: 4 }}>Take Profit ({currentQuoteAsset})</AppText>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? darkTheme.darkThemeInputColor : "#F7F7F7",
                  borderColor: isDark ? darkTheme.inputBorder : themeColors.border,
                  borderWidth: 0.8,
                  borderRadius: 8,
                  height: 36,
                  ...fieldErrorBorder('tp'),
                }}
              >
                <TextInput
                  ref={tpInputRef}
                  placeholder="TP Price"
                  placeholderTextColor="#8E8E93"
                  selectionColor={colors.orangeTheme}
                  value={formTp}
                  maxLength={(() => {
                    const tick = getTickSize(selectedCoin);
                    const maxDp = getDecimalPlaces(tick);
                    const dotIdx = (formTp || '').indexOf('.');
                    return dotIdx >= 0 ? dotIdx + 1 + maxDp : undefined;
                  })()}
                  onChangeText={(text) => {
                    const tick = getTickSize(selectedCoin);
                    const sanitized = sanitizeIncrementInput(text, tick);
                    setFormTp(sanitized);
                  }}
                  onFocus={() => setIsTpFocused(true)}
                  onBlur={() => setIsTpFocused(false)}
                  keyboardType="numeric"
                  textAlign="center"
                  style={{
                    flex: 1,
                    color: isDark ? "#FFFFFF" : "#000000",
                    fontSize: 12,
                    fontFamily: fontFamilyMedium,
                    paddingVertical: 0,
                    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                  }}
                />
              </View>
              {renderFieldError('tp')}
            </View>

            {/* SL Input */}
            <View style={{ marginBottom: 10 }}>
              <AppText style={{ fontSize: 11, color: "#8E8E93", marginBottom: 4 }}>Stop Loss ({currentQuoteAsset})</AppText>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? darkTheme.darkThemeInputColor : "#F7F7F7",
                  borderColor: isDark ? darkTheme.inputBorder : themeColors.border,
                  borderWidth: 0.8,
                  borderRadius: 8,
                  height: 36,
                  ...fieldErrorBorder('sl'),
                }}
              >
                <TextInput
                  ref={slInputRef}
                  placeholder="SL Price"
                  placeholderTextColor="#8E8E93"
                  selectionColor={colors.orangeTheme}
                  value={formSl}
                  maxLength={(() => {
                    const tick = getTickSize(selectedCoin);
                    const maxDp = getDecimalPlaces(tick);
                    const dotIdx = (formSl || '').indexOf('.');
                    return dotIdx >= 0 ? dotIdx + 1 + maxDp : undefined;
                  })()}
                  onChangeText={(text) => {
                    const tick = getTickSize(selectedCoin);
                    const sanitized = sanitizeIncrementInput(text, tick);
                    setFormSl(sanitized);
                  }}
                  onFocus={() => setIsSlFocused(true)}
                  onBlur={() => setIsSlFocused(false)}
                  keyboardType="numeric"
                  textAlign="center"
                  style={{
                    flex: 1,
                    color: isDark ? "#FFFFFF" : "#000000",
                    fontSize: 12,
                    fontFamily: fontFamilyMedium,
                    paddingVertical: 0,
                    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                  }}
                />
              </View>
              {renderFieldError('sl')}
            </View>
          </View>
        )}

        {/* Slippage (Only for Market) */}
        {orderType === 'Market' && (
          <View style={{ marginBottom: 12 }}>
            <TouchableOpacity
              style={[styles.tpslRow, { justifyContent: 'space-between', marginBottom: showSlippage ? 12 : 0 }]}
              onPress={() => setShowSlippage(!showSlippage)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.checkbox, showSlippage && {
                  backgroundColor: themeColors.text,
                  borderColor: themeColors.text, alignItems: 'center', justifyContent: 'center'
                }]}>
                  {showSlippage && <FastImage source={tick} style={{ width: 10, height: 10 }} tintColor={isDark ? colors.black : colors.white} resizeMode="contain" />}
                </View>
                <AppText type={TWELVE} style={[styles.dashedUnderline, {
                  color: isDark ? colors.white : colors.black
                }]}>Slippage</AppText>
              </View>
            </TouchableOpacity>

            {showSlippage && (
              <View style={{ marginBottom: 10 }}>
                <AppText style={{ fontSize: 11, color: "#8E8E93", marginBottom: 4 }}>Slippage Tolerance (%)</AppText>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isDark ? darkTheme.darkThemeInputColor : "#F7F7F7",
                    borderColor: isDark ? darkTheme.inputBorder : themeColors.border,
                    borderWidth: 0.8,
                    borderRadius: 8,
                    height: 36,
                    paddingHorizontal: 12,
                  }}
                >
                  <TextInput
                    cursorColor={isDark ? colors.white : colors.black}
                    value={slippagePct}
                    onChangeText={setSlippagePct}
                    placeholder="0.01~2"
                    placeholderTextColor="#8E8E93"
                    selectionColor={colors.orangeTheme}
                    keyboardType="numeric"
                    textAlign="center"
                    style={{
                      flex: 1,
                      color: isDark ? "#FFFFFF" : "#000000",
                      fontSize: 12,
                      fontFamily: fontFamilyMedium,
                      paddingVertical: 0,
                      ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                    }}
                  />
                  <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.secondaryText }}>%</AppText>
                </View>
              </View>
            )}
          </View>
        )}

        {/* TIF */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <AppText type={TWELVE} color={themeColors.secondaryText}>TIF</AppText>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            onPress={() => tifSheetRef.current?.open()}
            activeOpacity={0.8}
          >
            <AppText type={TWELVE} weight={SEMI_BOLD}>{postOnly ? 'GTX' : tif}</AppText>
            <FastImage source={downIcon} style={{ width: 8, height: 8 }} resizeMode="contain" tintColor={themeColors.text} />
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        {(() => {
          const isKycVerified = userData?.kycVerified ?? userData?.kyc_verified ?? (String(userData?.kyc_status ?? userData?.kycStatus ?? "").toLowerCase() === "approved");
          return (
            <View style={{ width: '100%', marginBottom: 12 }}>
              {(!userData) ? (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: activeTab === 'Buy' ? colors.green : colors.red }
                  ]}
                  onPress={() => NavigationService.reset(NAVIGATION_AUTH_STACK)}
                >
                  <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: colors.white }}>
                    Login
                  </AppText>
                </TouchableOpacity>
              ) : (!isKycVerified) ? (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: activeTab === 'Buy' ? colors.green : colors.red }
                  ]}
                  onPress={() => NavigationService.navigate(KYC_STATUS_SCREEN)}
                >
                  <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: colors.white }}>
                    Submit Kyc
                  </AppText>
                </TouchableOpacity>
              ) : isBuyForm ? (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.green, opacity: (!amount || Number(amount) <= 0) ? 0.5 : 1 }
                  ]}
                  disabled={placingOrderSide === "BUY" || !amount || Number(amount) <= 0}
                  onPress={() => handlePlaceOrder("BUY", "BUY")}
                >
                  {placingOrderSide === "BUY" ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: colors.white }}>
                      Buy {currentBaseAsset}
                    </AppText>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.red, opacity: (!amount || Number(amount) <= 0) ? 0.5 : 1 }
                  ]}
                  disabled={placingOrderSide === "SELL" || !amount || Number(amount) <= 0}
                  onPress={() => handlePlaceOrder("SELL", "SELL")}
                >
                  {placingOrderSide === "SELL" ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: colors.white }}>
                      Sell {currentBaseAsset}
                    </AppText>
                  )}
                </TouchableOpacity>
              )}

              <View style={{ marginTop: 12, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AppText type={TWELVE} color={themeColors.secondaryText}>Cost</AppText>
                  {(!futuresData || futuresData?.contract?.short_name !== selectedCoin?.short_name) ? (
                    <ShimmerBox width={60} height={14} borderRadius={4} />
                  ) : (
                    <AppText type={TWELVE} weight={SEMI_BOLD}>{costText}</AppText>
                  )}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AppText type={TWELVE} color={themeColors.secondaryText}>Max</AppText>
                  {(!futuresData || futuresData?.contract?.short_name !== selectedCoin?.short_name) ? (
                    <ShimmerBox width={60} height={14} borderRadius={4} />
                  ) : (
                    <AppText type={TWELVE} weight={SEMI_BOLD}>{maxText}</AppText>
                  )}
                </View>
              </View>

              {/* Socket fee rates are already percents (0.058 → 0.058%) — shown as-is, like web. */}
              <View style={[styles.feeRateBox, { backgroundColor: themeColors.card }]}>
                <AppText type={TWELVE} color={themeColors.secondaryText}>Fee rate</AppText>
                <AppText type={TWELVE}>
                  Maker {selectedCoin?.maker_fee_rate ? Number(selectedCoin.maker_fee_rate) : '---'}% / Taker {selectedCoin?.taker_fee_rate ? Number(selectedCoin.taker_fee_rate) : '---'}%
                </AppText>
              </View>
            </View>
          );
        })()}
      </View>
    );
  };

  const dynamicHistoryTabs = React.useMemo(() => [
    { id: 'Positions', label: 'Positions', count: futuresPositions?.length || 0 },
    { id: 'Position History', label: 'Position History' },
    { id: 'Open Orders', label: 'Open Orders', count: futuresOpenOrders?.length || 0 },
    { id: 'Order History', label: 'Order History' },
    { id: 'Trade History', label: 'Trade History' },
    { id: 'Transaction History', label: 'Transaction History' },
  ], [futuresPositions, futuresOpenOrders]);

  const renderBottomTabs = () => (
    <View style={[styles.bottomTabsContainer, { flexDirection: "row", marginTop: 6, alignItems: "center", height: 40 }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: "row", alignItems: "center", gap: 16, paddingRight: 8 }}
        style={{ flex: 1 }}
      >
        {dynamicHistoryTabs.map((t) => (
          <TouchableOpacity
            key={t.id}
            activeOpacity={0.8}
            onPress={() => handleHistoryTabChange(t.id)}
            style={{ alignItems: "center", minHeight: 28, justifyContent: "center", paddingHorizontal: 2 }}
          >
            <AppText
              numberOfLines={1}
              weight={SEMI_BOLD}
              style={{
                color: activeHistoryTab === t.id ? themeColors.text : themeColors.secondaryText,
                fontSize: 14,
              }}
            >
              {t.label} {t.count != null ? `(${t.count})` : ""}
            </AppText>
            <View
              style={{
                width: 22,
                height: 2.5,
                marginTop: 4,
                backgroundColor: activeHistoryTab === t.id ? (isDark ? colors.white : colors.black) : "transparent",
                borderRadius: 2,
              }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

    </View>
  );

  const renderHistoryContent = () => {
    return (
      <View style={{ minHeight: 400 }}>
        <FuturesHistorySection
          activeHistoryTab={activeHistoryTab}
          futuresPositions={futuresPositions}
          loadingPositions={loadingPositions}
          futuresPositionHistory={futuresPositionHistory}
          loadingPositionHistory={loadingPositionHistory}
          futuresOpenOrders={futuresOpenOrders}
          loadingOpenOrders={loadingOpenOrders}
          futuresOrderHistory={futuresOrderHistory}
          loadingOrderHistory={loadingOrderHistory}
          futuresTransactionHistory={futuresTransactionHistory}
          loadingTransactionHistory={loadingTransactionHistory}
          futuresTradeHistory={futuresTradeHistory}
          loadingTradeHistory={loadingTradeHistory}
          themeColors={themeColors}
          isDark={isDark}
          futuresPrice={futuresPrice}
          selectedCoin={selectedCoin}
          limit={5}
          onViewMore={() => {
            if (!userData) {
              showError("Please login first to view futures history");
              navigation.navigate(LOGIN_SCREEN);
              return;
            }
            navigation.navigate('FutureHistoryScreen', { selectedCoin, initialTab: activeHistoryTab });
          }}
          onRefresh={(opts) => {
            fetchFuturesPositions(opts);
            fetchFuturesOpenOrders();
            fetchFuturesPositionHistory();
            fetchFuturesOrderHistory();
            fetchFuturesTradeHistory();
            fetchFuturesTransactionHistory();
          }}
          onPositionClosed={(posId) => {
            setFuturesPositions((prev) =>
              prev.filter((p) => String(p._id || p.symbol || '') !== String(posId))
            );
          }}
        />
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
      onTouchStart={blurFocusedInputOnOutsideTouch}
    >
      {renderHeader()}
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.mainContent}>
          {renderOrderBook()}
          {renderOrderForm()}
        </View>
        <View style={styles.divider} />
        {renderBottomTabs()}
        {renderHistoryContent()}

        {/* Margin Mode Modal */}
        <Modal
          visible={isMarginModeModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsMarginModeModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsMarginModeModalVisible(false)}
            style={{
              flex: 1,
              backgroundColor: "#0006",
              justifyContent: "flex-end",
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e?.stopPropagation?.()}
              style={{
                backgroundColor: isDark ? colors.newThemeColor : (themeColors.background || "#FFFFFF"),
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: Platform.OS === 'ios' ? 34 : 20,
              }}
            >
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 4,
                    paddingBottom: 6,
                  }}
                >
                  <AppText weight={BOLD} style={{ fontSize: 18, color: themeColors.text }}>
                    Margin Mode
                  </AppText>
                  <TouchableOpacity
                    onPress={() => setIsMarginModeModalVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ padding: 6 }}
                  >
                    <X color={themeColors.secondaryText} size={16} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                <AppText
                  style={{
                    color: themeColors.secondaryText,
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  Select the margin mode you want to use for placing your order.
                </AppText>

                <View>
                  {[
                    {
                      name: "Isolated",
                      description:
                        "In isolated margin mode, the position margin is the allocated amount, and your loss is limited to it upon liquidation. You can also adjust the margin for positions in this mode.",
                      type: "isolated",
                    },
                    {
                      name: "Cross",
                      description:
                        "In cross margin mode, the entire account balance is used as margin, and you may lose it all upon liquidation.",
                      type: "cross",
                    },
                  ].map((item) => {
                    const isSelected = marginModeDraft === item.name;
                    const activeColor = colors.orangeTheme;
                    const iconStroke = isSelected ? activeColor : themeColors.secondaryText;
                    return (
                      <TouchableOpacity
                        key={item.name}
                        activeOpacity={0.8}
                        onPress={() => setMarginModeDraft(item.name)}
                        style={{
                          backgroundColor: isSelected
                            ? (isDark ? "rgba(209, 170, 103, 0.10)" : "#FBF5EA")
                            : (isDark ? (darkTheme.darkThemeInputColor || "#1E1E24") : "#F5F6F8"),
                          borderWidth: isSelected ? 1.5 : 1,
                          borderColor: isSelected
                            ? activeColor
                            : (isDark ? "rgba(255, 255, 255, 0.08)" : "#E5E7EB"),
                          borderRadius: 12,
                          padding: 14,
                          marginBottom: 12,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        {/* Left Icon Badge */}
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E9ECEF",
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 12,
                          }}
                        >
                          {item.type === "isolated" ? (
                            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                                stroke={iconStroke}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <Circle
                                cx={9}
                                cy={7}
                                r={4}
                                stroke={iconStroke}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <Path
                                d="M19 8v6M22 11h-6"
                                stroke={iconStroke}
                                strokeWidth={2}
                                strokeLinecap="round"
                              />
                            </Svg>
                          ) : (
                            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M17 21v-2a4 4 0 0 0-3-3.87M9 20H4a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v2"
                                stroke={iconStroke}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <Circle
                                cx={9}
                                cy={7}
                                r={4}
                                stroke={iconStroke}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <Path
                                d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
                                stroke={iconStroke}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          )}
                        </View>

                        {/* Middle Content */}
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <AppText
                            weight={SEMI_BOLD}
                            style={{
                              color: themeColors.text,
                              fontSize: 15,
                              marginBottom: 4,
                            }}
                          >
                            {item.name}
                          </AppText>
                          <AppText
                            style={{
                              color: themeColors.secondaryText,
                              fontSize: 12,
                              lineHeight: 17,
                            }}
                          >
                            {item.description}
                          </AppText>
                        </View>

                        {/* Right Radio Indicator */}
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            borderWidth: 2,
                            borderColor: isSelected
                              ? activeColor
                              : (isDark ? "rgba(255, 255, 255, 0.3)" : "#C7C7CC"),
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "transparent",
                          }}
                        >
                          {isSelected && (
                            <View
                              style={{
                                width: 11,
                                height: 11,
                                borderRadius: 5.5,
                                backgroundColor: activeColor,
                              }}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Info Note Row */}
                  <View
                    style={{
                      backgroundColor: isDark
                        ? (darkTheme.darkThemeInputColor || "rgba(255, 255, 255, 0.04)")
                        : "#F5F6F8",
                      borderRadius: 10,
                      padding: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 16,
                      marginTop: 4,
                    }}
                  >
                    <Info size={16} color={themeColors.secondaryText} strokeWidth={1.8} />
                    <AppText
                      style={{
                        color: themeColors.secondaryText,
                        fontSize: 12,
                        lineHeight: 16,
                        marginLeft: 8,
                        flex: 1,
                      }}
                    >
                      Switching margin modes only applies to the current contract.
                    </AppText>
                  </View>

                  {/* Batch Adjust Margin Mode Row */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={openBatchAdjustDrawer}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                      paddingHorizontal: 2,
                    }}
                  >
                    <AppText weight={MEDIUM} style={{ fontSize: 14, color: themeColors.text }}>
                      Batch Adjust Margin Mode
                    </AppText>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      {batchAdjustActive && (
                        <AppText style={{ fontSize: 12, color: themeColors.secondaryText, marginRight: 8 }}>
                          {batchAdjustTrail}
                        </AppText>
                      )}
                      <ToggleSwitch
                        value={batchAdjustActive}
                        onValueChange={openBatchAdjustDrawer}
                        isDark={isDark}
                      />
                    </View>
                  </TouchableOpacity>

                  {marginModeLocked && (
                    <AppText
                      style={{
                        color: colors.orangeTheme,
                        fontSize: 12,
                        lineHeight: 16,
                        marginBottom: 12,
                      }}
                    >
                      Mode can't change while you have an open order or position.
                    </AppText>
                  )}

                  {/* Continue Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isSavingMarginMode || marginModeLocked || marginModeDraft === marginMode}
                    onPress={confirmMarginMode}
                    style={{
                      backgroundColor: colors.orangeTheme,
                      borderRadius: 24,
                      paddingVertical: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 4,
                      marginBottom: 6,
                      opacity: isSavingMarginMode || marginModeLocked || marginModeDraft === marginMode ? 0.6 : 1,
                    }}
                  >
                    <AppText weight={SEMI_BOLD} style={{ color: "#FFFFFF", fontSize: 16 }}>
                      {isSavingMarginMode ? "Saving…" : "Confirm"}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <FuturesBatchAdjustDrawer
          visible={isBatchAdjustVisible}
          onClose={() => setIsBatchAdjustVisible(false)}
          maxLeverage={Number(selectedCoin?.max_leverage) || 125}
          draft={batchAdjustDraft}
          onDraftChange={setBatchAdjustDraft}
          onConfirm={confirmBatchAdjust}
          isDark={isDark}
          themeColors={themeColors}
        />

        {/* Contract Unit Preferences Sheet */}
        <RBSheet
          ref={contractUnitSheetRef}
          keyboardAvoidingViewEnabled={false}
          customModalProps={{ statusBarTranslucent: true }}
          closeOnDragDown={true}
          closeOnPressMask={true}
          height={450}
          animationType="slide"
          customStyles={{
            container: {
              backgroundColor: themeColors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 20,
            },
            wrapper: {
              backgroundColor: "#0006",
            },
            draggableIcon: {
              backgroundColor: themeColors.themeBorderColor || "#ccc",
              width: 40,
            },
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, paddingBottom: 20 }}>
              <AppText weight={BOLD} style={{ fontSize: 18, color: themeColors.text }}>
                Contract Unit Settings
              </AppText>
              <TouchableOpacity onPress={() => contractUnitSheetRef.current?.close()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <FastImage source={REMOVE} style={{ width: 16, height: 16 }} tintColor={themeColors.text} resizeMode="contain" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                {
                  name: `Amount (${currentBaseAsset})`,
                  description: `Order size is entered in ${currentBaseAsset} (base asset).`,
                },
                {
                  name: `Value (${currentQuoteAsset})`,
                  description: `Order size is entered in ${currentQuoteAsset} (notional / margin asset).`,
                },
              ].map((item) => {
                const isSelected = contractUnitDraft === item.name;
                return (
                  <TouchableOpacity
                    key={item.name}
                    activeOpacity={0.8}
                    onPress={() => {
                      setContractUnitDraft(item.name);
                    }}
                    style={{
                      backgroundColor: isSelected
                        ? (isDark ? "rgba(209, 170, 103, 0.10)" : "#FBF5EA")
                        : 'transparent',
                      borderWidth: isSelected ? 1.5 : 1,
                      borderColor: isSelected
                        ? colors.orangeTheme
                        : (isDark ? "rgba(255, 255, 255, 0.08)" : (themeColors.themeBorderColor || "#e0e0e0")),
                      borderRadius: 10,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      marginBottom: 16,
                    }}
                  >
                    <AppText
                      weight={SEMI_BOLD}
                      style={{
                        color: isSelected ? colors.orangeTheme : themeColors.text,
                        fontSize: 15,
                        marginBottom: 6,
                      }}
                    >
                      {item.name}
                    </AppText>
                    <AppText
                      style={{
                        color: themeColors.secondaryText,
                        fontSize: 12,
                        lineHeight: 18,
                      }}
                    >
                      {item.description}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (contractUnit !== contractUnitDraft) {
                  setSliderValue(0);
                  setAmount('');
                }
                setContractUnit(contractUnitDraft);
                contractUnitSheetRef.current?.close();
              }}
              style={{
                height: 48,
                backgroundColor: colors.orangeTheme,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 16,
                marginBottom: 20,
              }}
            >
              <AppText weight={BOLD} style={{ color: "#FFFFFF", fontSize: 16 }}>
                Confirm
              </AppText>
            </TouchableOpacity>

          </View>
        </RBSheet>



        <RBSheet
          ref={tifSheetRef}
          height={400}
          animationType="slide"
          keyboardAvoidingViewEnabled={false}
          customModalProps={{ statusBarTranslucent: true }}
          closeOnDragDown={true}
          closeOnPressMask={true}
          customStyles={{
            container: {
              backgroundColor: isDark ? colors.newThemeColor : (themeColors.background || "#FFFFFF"),
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 20,
            },
            wrapper: {
              backgroundColor: "#0006",
            },
            draggableIcon: {
              backgroundColor: themeColors.themeBorderColor || "#ccc",
              width: 40,
            },
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 16 }}>
              <AppText weight={SEMI_BOLD} style={{ fontSize: 18, color: themeColors.text }}>
                TIF
              </AppText>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {[
                { id: 'GTC', label: 'GTC (Good Till Cancelled)', desc: 'Remain in effect until fully filled or cancelled' },
                { id: 'IOC', label: 'IOC (Immediate or Cancel)', desc: 'Fill all or part of the order immediately and cancel the remaining unfilled part' },
                { id: 'FOK', label: 'FOK (Fill or Kill)', desc: 'Must be filled immediately, otherwise it will be cancelled' },
              ].map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setTif(item.id);
                    tifSheetRef.current?.close();
                  }}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: item.id === tif
                      ? (isDark ? "rgba(209, 170, 103, 0.10)" : "#FBF5EA")
                      : (isDark ? colors.themeElevationColor : themeColors.bg || (isDark ? '#1a1a1a' : '#f5f5f5')),
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: tif === item.id ? colors.orangeTheme : 'transparent'
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ marginBottom: 4, color: tif === item.id ? colors.orangeTheme : themeColors.text }}>{item.label}</AppText>
                    <AppText type={TWELVE} color={themeColors.secondaryText}>{item.desc}</AppText>
                  </View>
                  <View style={[styles.checkbox, tif === item.id && { backgroundColor: colors.orangeTheme, borderColor: colors.orangeTheme, alignItems: 'center', justifyContent: 'center' }]}>
                    {tif === item.id && <FastImage source={tick} style={{ width: 10, height: 10 }} tintColor="#FFFFFF" resizeMode="contain" />}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </RBSheet>

      </ScrollView>

      {/* Adjust Leverage Modal — mirrors web futures_trade/MarginLeverageModal */}
      {(() => {
        const maxL = Number(selectedCoin?.max_leverage) || 125;
        const leverageTiers = selectedCoin?.leverage_tiers || [];
        const balanceToUse = futuresAvailable;
        const stats = computeFuturesLeverageStats({
          availableBalance: balanceToUse,
          leverage: leverageDraft,
          maxLeverage: maxL,
          leverageTiers,
        });

        const fmt = (value) => {
          const tickSize = selectedCoin?.tick_size;
          const precision = tickSize === undefined || tickSize === null ? 8 : getDecimalPlaces(tickSize);
          const finalValue = Number(value)?.toFixed(precision)?.replace(/\.?0+$/, '');
          const result = finalValue?.replace(/^0\.0*/, '');
          const decimalPart = finalValue?.split('.')[1];
          if (!decimalPart) return finalValue;
          let zeroCount = 0;
          for (const ch of decimalPart) {
            if (ch === '0') zeroCount++;
            else break;
          }
          if (zeroCount > 4 || value < 1e-7) return `0.0{${zeroCount}}${result}`;
          return finalValue;
        };

        const markPriceNum =
          Number(price) ||
          Number(liveCoin?.last_price) ||
          Number(liveCoin?.mark_price) ||
          Number(selectedCoin?.mark_price) ||
          null;
        const maxNotional = stats.maxNotionalAtLev;
        const maxQty = getMaxQuantityAtLeverage(leverageTiers, leverageDraft, markPriceNum);
        let maxPosLabel = '—';
        if (maxNotional === Infinity) {
          maxPosLabel = 'No cap';
        } else if (Number.isFinite(markPriceNum) && markPriceNum > 0 && maxQty != null) {
          maxPosLabel = `${fmt(maxQty)} ${currentBaseAsset} (≈ ${fmt(maxNotional)} ${currentQuoteAsset})`;
        } else if (Number.isFinite(maxNotional)) {
          maxPosLabel = `${fmt(maxNotional)} ${currentQuoteAsset}`;
        }

        return (
          <AdjustLeverageSheet
            visible={isLeverageModalVisible}
            onClose={closeLeverageSheet}
            isDark={isDark}
            fieldLabel="Pair"
            coinIcon={<CoinIcon coin={selectedCoin} style={{ width: 24, height: 24, borderRadius: 12 }} />}
            coinLabel={currentBaseAsset && currentQuoteAsset ? `${currentBaseAsset}/${currentQuoteAsset}` : '—/—'}
            scrollEnabled={!isLeverageSliding}
            slider={(
              <FuturesLeverageSlider
                value={leverageDraft}
                onChange={setLeverageDraft}
                onSlidingChange={setIsLeverageSliding}
                maxLeverage={maxL}
                isDark={isDark}
                themeColors={themeColors}
              />
            )}
            notes={[
              `Maximum position at current leverage: ${maxPosLabel}`,
              'Please note that leverage changing will also apply for open positions and open orders.',
              'Selecting higher leverage increases your liquidation risk. Always manage your risk levels.',
            ]}
            warning={balanceToUse <= 0 ? 'The current available margin ≤ 0. You can increase the leverage or add margin.' : ''}
            busy={isSavingLeverage}
            confirmLabel={isSavingLeverage ? 'Saving…' : 'Confirm'}
            onConfirm={confirmLeverage}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isSavingLeverage}
              onPress={openBatchAdjustDrawer}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 8,
                paddingVertical: 12,
                paddingHorizontal: 2,
                borderTopWidth: 1,
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ECECEE',
              }}
            >
              <AppText weight={SEMI_BOLD} style={{ fontSize: 13.5, color: isDark ? '#EAECEF' : '#14161A' }}>
                Default leverage & margin mode
              </AppText>
              <AppText weight={MEDIUM} style={{ fontSize: 13, color: isDark ? '#848E9C' : '#9A9DA3' }}>
                {batchAdjustTrail || (batchAdjustActive ? 'On' : 'Off')} ›
              </AppText>
            </TouchableOpacity>
          </AdjustLeverageSheet>
        );
      })()}

      {/* Order Type Modal (Native 0-lag slide) */}
      <Modal
        visible={isOrderTypeModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsOrderTypeModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsOrderTypeModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: "#0006",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e?.stopPropagation?.()}
            style={{
              backgroundColor: isDark ? colors.newThemeColor : (themeColors.background || "#FFFFFF"),
              height: Math.min(540, Dimensions.get("window").height * 0.58),
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 8,
            }}
          >
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 4,
                  paddingBottom: 6,
                }}
              >
                <AppText weight={BOLD} style={{ fontSize: 18, color: themeColors.text }}>
                  Order Type
                </AppText>
                <TouchableOpacity
                  onPress={() => setIsOrderTypeModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: 6 }}
                >
                  <X color={themeColors.secondaryText} size={16} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <AppText
                style={{
                  color: themeColors.secondaryText,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                Choose how you want to place your order
              </AppText>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                {/* BASIC SECTION */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4 }}>
                  <Gem color={colors.orangeTheme} size={14} strokeWidth={2.5} />
                  <AppText
                    weight={SEMI_BOLD}
                    style={{
                      fontSize: 13,
                      color: colors.orangeTheme,
                      marginLeft: 8,
                      letterSpacing: 1,
                    }}
                  >
                    BASIC
                  </AppText>
                </View>
                {ORDER_TYPE_SHEET_BASIC.map(renderOrderTypeRow)}

                {/* CONDITIONAL SECTION */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 12 }}>
                  <Gem color={colors.orangeTheme} size={14} strokeWidth={2.5} />
                  <AppText
                    weight={SEMI_BOLD}
                    style={{
                      fontSize: 13,
                      color: colors.orangeTheme,
                      marginLeft: 8,
                      letterSpacing: 1,
                    }}
                  >
                    CONDITIONAL
                  </AppText>
                </View>
                {ORDER_TYPE_SHEET_CONDITIONAL.map(renderOrderTypeRow)}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <AnimatedBottomSheet ref={pairSheetRef} isDark={isDark} theme={theme}>
        <FuturePairList
          pairs={pairData}
          onSelectPair={handleSelectCoin}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClose={() => pairSheetRef.current?.close()}
        />
      </AnimatedBottomSheet>
    </View >
  );
};

export default FuturesUI;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pairTouchTarget: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingVertical: 4,
    paddingRight: 12,
    justifyContent: 'center',
  },
  headerIconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  smallIcon: {
    width: 12,
    height: 12,
    marginLeft: 6,
  },
  changeBadge: {
    backgroundColor: colors.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    marginLeft: 16,
  },
  dummyIconLine: {
    width: 20, height: 16, borderWidth: 1, borderColor: '#333', borderRadius: 4,
  },
  dummyIconCandle: {
    width: 16, height: 16, borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#333',
  },
  mainContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  leftColumn: {
    flex: 0.4,
    paddingRight: 10,
  },
  rightColumn: {
    flex: 0.7,
    paddingLeft: 10,
  },
  dashedUnderline: {
    borderBottomWidth: 1,

    borderStyle: 'dashed',

  },
  fundingRow: {
    marginBottom: 16,
  },
  fundingTickerWrap: {
    marginBottom: 10,
  },
  feeRateBox: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    gap: 4,
  },
  obHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  obRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4.5,
    minHeight: 26,
    width: '100%',
  },
  obFillRed: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(235, 77, 92, 0.15)',
  },
  obFillGreen: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 192, 118, 0.15)',
  },
  currentPrice: {
    marginVertical: 12,
  },
  ratioIndicatorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratioIndicatorTrack: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 2,
  },
  ratioIndicatorFill: {
    height: '100%',
  },
  spotObToolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 0,
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
  layoutIcon: {
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 20,
    padding: 2,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 18,
  },
  toggleActive: {
    backgroundColor: colors.green,
  },
  marginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  marginBox: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  orderTypeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  infoIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 42,
    justifyContent: 'center',
  },
  textInput: {
    padding: 0,
    margin: 0,
    fontSize: 14,
    fontFamily: fontFamilySemiBold
  },
  bboBtn: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 10,
    borderRadius: 6,
    height: 42,
    justifyContent: 'center',
  },
  sliderContainer: {
    marginVertical: 20,
    paddingHorizontal: 4,
  },
  sliderTrack: {
    height: 2,
    backgroundColor: '#eee',
    width: '100%',
    position: 'absolute',
    top: 6,
    left: 4,
  },
  sliderKnob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#666',
    position: 'absolute',
    left: '25%', // Adjust based on sliderValue
    top: 0,
    zIndex: 1,
  },
  sliderMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  sliderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ccc',
    marginBottom: 4,
  },
  tpslRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
  },
  availableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonWrapper: {
    marginBottom: 12,
  },
  maxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actionBtn: {
    paddingVertical: 8,
    borderRadius: 24,
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 8,
  },
  bottomTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bottomTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  bottomTabActive: {
    alignItems: 'center',
  },
  activeTabIndicator: {
    width: 20,
    height: 3,
    backgroundColor: colors.black,
    marginTop: 4,
    borderRadius: 2,
  },
  bottomTab: {
    alignItems: 'center',
  },
  historyIconBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  telescopeIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#f5f5f5', // Placeholder
    borderRadius: 30,
    marginBottom: 12,
  }
});

const FIELD_ERROR_COLOR = '#f6465d';

const fieldErrorStyles = StyleSheet.create({
  error: {
    color: FIELD_ERROR_COLOR,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
    marginHorizontal: 2,
  },
  hint: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
    marginHorizontal: 2,
  },
});
