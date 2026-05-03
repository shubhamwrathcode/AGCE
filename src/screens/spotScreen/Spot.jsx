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
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import React, { useCallback, useContext, useEffect, useRef, useState, useMemo, memo } from "react";
import Ionicons from "react-native-vector-icons/Ionicons";
import WebView from "react-native-webview";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate
} from "react-native-reanimated";

import SpotHeader from "../../shared/components/spotHeader/SpotHeader";
import FastImage from "react-native-fast-image";
import Skeleton from "react-native-reanimated-skeleton";
import {
  BarTrading,
  binIcon,
  checkIc,
  confirmOrderIcon,
  downIcon,
  folder,
  linkIcon,
  NO_NOTIFICATION_ICON,
  NO_NOTIFICATION_ICON_LIGHT,
  printIcon,
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
import { connect } from "socket.io-client";
import { useDispatch } from "react-redux";
import LinearGradient from "react-native-linear-gradient";
import {
  DEPOSIT_COIN_SCREEN,
  DEPOSIT_WALLET_SCREEN,
  KYC_STATUS_SCREEN,
  SPOT_ORDER_HISTORY_DETAIL,
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

const Width = Dimensions.get("window").width;
const CHART_HEIGHT = 300;

const CHART_BG_FALLBACK = "transparent";

// Memoized WebView so parent state (socket, orders, etc.) does not re-render or reload the chart. Always use theme bg so first load never shows black.
const ChartWebView = memo(
  React.forwardRef(({ uri, onChartLoaded, backgroundColor }, ref) => {
    const source = useMemo(() => (uri ? { uri } : null), [uri]);
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
ChartWebView.displayName = "ChartWebView";

// Memoized chart block: skeleton + WebView. Only re-renders when chart props change (avoids form/tab re-renders).
// chartRevealed: true only after webViewReady + short delay to avoid black flash on first paint
const SpotChartSection = memo(
  ({ chartUri, webViewReady, chartRevealed, isSpotFocused, onChartLoaded, chartRef, showChartSkeleton: showChartSkeletonProp }) => {
    const { colors: themeColors, theme, isDark } = useTheme();
    const showChartSkeleton = showChartSkeletonProp !== undefined ? showChartSkeletonProp : (!chartRevealed && isSpotFocused);
    const bg = themeColors.background ?? CHART_BG_FALLBACK;
    return (
      <View style={{ position: "relative", backgroundColor: bg, overflow: "hidden" }}>
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
          <ChartWebView
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
SpotChartSection.displayName = "SpotChartSection";

export const DataLimit = [
  { id: "0.1", name: "Limit" },
  { id: "0.1", name: "Market" },
];

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
              // const candleColors = { ...colors, themeElevationColor: theme === "Dark" ? "#444444" : "#D0D0D0" };
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
 * - Chart: stays mounted when blurred (unmountOnBlur: false); no refetch on return.
 * - Skeletons: order book only when no data (!orderBookReady); chart only until first reveal.
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

  const webview = useRef(null);
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
  const webViewReadyFallbackRef = useRef(null);
  const chartReadyDelayRef = useRef(null);
  const chartSymbolChangeTimeoutRef = useRef(null);
  const lastSubscribedExchangeRef = useRef(null);
  const lastSubscribedPairRef = useRef(null);
  const lastFlushedBuyRef = useRef(null);
  const lastFlushedSellRef = useRef(null);
  const pendingOrderBookOnBlurRef = useRef(null);
  const flushSocketToStateRef = useRef(null);
  const activeTabRef = useRef(1);
  const chartRevealedOnceRef = useRef(false);

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

  const chartBaseUrl = useMemo(
    () => `https://zillion.wrathcode.com/chart/${theme === "Dark" ? "dark" : "light"}/`,
    [theme]
  );
  const [chartUri, setChartUri] = useState("");
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  // console.log(chartUri, "chartBaseUrl");

  const onChartLoaded = useCallback(() => {
    if (webViewReadyFallbackRef.current) {
      clearTimeout(webViewReadyFallbackRef.current);
      webViewReadyFallbackRef.current = null;
    }
    setInitialLoadDone(true);
    if (chartReadyDelayRef.current) clearTimeout(chartReadyDelayRef.current);
    // Delay so WebView has time to paint; avoids black flash when revealing chart after skeleton
    chartReadyDelayRef.current = setTimeout(() => {
      chartReadyDelayRef.current = null;
      setWebViewReady(true);
    }, 1000);
  }, []);

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

  // Removed automatic restoration from Redux cache to ensure only fresh socket data is shown.
  // This satisfies the requirement: "if data comes from backend, show; otherwise don't".


  const lastChartPairRef = useRef(null);
  const lastChartThemeRef = useRef(theme);

  // Sync Redux to local + chart when spotSelectedPair changes. Chart loads only when Spot is focused (no heavy load in background).
  // When pair changes: clear order book so skeleton shows until new pair's data loads (prevents showing previous pair's data).
  useEffect(() => {
    if (!spotSelectedPair) return;
    const newKey = `${spotSelectedPair.base_currency}_${spotSelectedPair.quote_currency}`;

    if (currentCurrencyRef.current?.base_currency !== spotSelectedPair.base_currency ||
      currentCurrencyRef.current?.quote_currency !== spotSelectedPair.quote_currency) {
      setCurrency(spotSelectedPair);
      currentCurrencyRef.current = spotSelectedPair;
      setAmount("1");
      setPrice(formatPrice(spotSelectedPair.buy_price).toString());
      setActivePercentage("");
      // Clear order book so skeleton shows until new pair's socket data arrives (no UI fluctuation)
      setLastSocketData(null);
      setLocalBuyOrders([]);
      setLocalSellOrders([]);
      dispatch(setBuyOrders([]));
      dispatch(setSellOrders([]));
      setRecentTrades([]);
    }

    if (lastChartPairRef.current === newKey && lastChartThemeRef.current === theme) return;

    if (lastChartThemeRef.current === theme && webview.current && initialLoadDone) {
      lastChartPairRef.current = newKey;
      changeSymbolChart(newKey);
    } else {
      lastChartPairRef.current = newKey;
      lastChartThemeRef.current = theme;
      setWebViewReady(false);
      setChartRevealed(false);
      setChartUri(`${chartBaseUrl}${newKey}`);
    }
  }, [spotSelectedPair?.base_currency, spotSelectedPair?.quote_currency, chartBaseUrl, initialLoadDone, theme]);

  // Manual change (TradingDataModal): dispatch to Redux - sync effect will handle rest
  // Clear order book so we don't show previous pair's data; new data will replace when socket responds
  const handleCurrencyChange = (coin) => {
    dispatch(setSpotSelectedPair(coin));
    setLastSocketData(null);
    setLocalBuyOrders([]);
    setLocalSellOrders([]);
    dispatch(setBuyOrders([]));
    dispatch(setSellOrders([]));
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

  // --- Save webview in redux for later use ---
  // useEffect(() => {
  //   if (webview.current) {
  //     dispatch(setSpotWebView(webview.current));
  //   }
  // }, []);

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



  const [activeTab, setActiveTab] = useState(1);
  activeTabRef.current = activeTab;
  const [tab, setTab] = useState("Buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("1");
  const [isLimit, setIsLimit] = useState(true);
  const [isBuy, setIsBuy] = useState(true);
  const [total, setTotal] = useState("");
  // const [chartLoading, setChartLoading] = useState(true);
  // const [preloadedUrl, setPreloadedUrl] = useState(null);
  // const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [webViewReady, setWebViewReady] = useState(false);
  const [chartRevealed, setChartRevealed] = useState(false);
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

  const [numberSelectLimit, setNumberLimit] = useState("Limit");
  const [activePercentage, setActivePercentage] = useState(0);
  const [balance, setBalance] = useState(0);
  const [_balance, _setBalance] = useState(0);
  const [numberSelect, setNumberSelect] = useState("0.0001");
  const [isConfirm, setIsConfirm] = useState(false);
  const [visible, setVisible] = useState(false);
  const [focusSettling, setFocusSettling] = useState(false);
  const focusSettlingTimeoutRef = useRef(null);

  // Fallback: if chart doesn't fire onLoadEnd within 3s, show content anyway so spinner turns off
  useEffect(() => {
    if (!chartUri || webViewReady) return;

    if (webViewReadyFallbackRef.current) clearTimeout(webViewReadyFallbackRef.current);

    webViewReadyFallbackRef.current = setTimeout(() => {
      webViewReadyFallbackRef.current = null;
      setWebViewReady(true);
    }, 3000); // Increased to 3s to give chart more time to actually load

    return () => {
      if (webViewReadyFallbackRef.current) {
        clearTimeout(webViewReadyFallbackRef.current);
        webViewReadyFallbackRef.current = null;
      }
    };
  }, [chartUri, webViewReady]);

  // Reveal chart only after a short delay once webViewReady; avoids black flash from WebView first paint
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
      chartRevealedOnceRef.current = true;
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


  const orderBookReady = !!lastSocketData || (buyOrders?.length > 0 || sellOrders?.length > 0);
  const showOrderBookSkeleton = !orderBookReady;






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
        // Clear order book before subscribing so we don't show stale data during connection
        dispatch(setBuyOrders([]));
        dispatch(setSellOrders([]));
        setLastSocketData(null);
        setLocalBuyOrders([]);
        setLocalSellOrders([]);

        const newKey = `${currentPair.base_currency_id}-${currentPair.quote_currency_id}`;
        const lastExchange = lastSubscribedExchangeRef.current;
        const alreadySubscribed = lastExchange && `${lastExchange.base_currency_id}-${lastExchange.quote_currency_id}` === newKey;
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
        if (webViewReadyFallbackRef.current) {
          clearTimeout(webViewReadyFallbackRef.current);
          webViewReadyFallbackRef.current = null;
        }
        if (chartReadyDelayRef.current) {
          clearTimeout(chartReadyDelayRef.current);
          chartReadyDelayRef.current = null;
        }
        if (chartRevealDelayRef.current) {
          clearTimeout(chartRevealDelayRef.current);
          chartRevealDelayRef.current = null;
        }
        if (chartSymbolChangeTimeoutRef.current) {
          clearTimeout(chartSymbolChangeTimeoutRef.current);
          chartSymbolChangeTimeoutRef.current = null;
        }

        if (socketThrottleTimerRef.current) {
          clearTimeout(socketThrottleTimerRef.current);
          socketThrottleTimerRef.current = null;
        }
        pendingSocketFlushRef.current = null;

        // Do not reset webViewReady on blur so when user returns to Spot the chart is still visible (data persistence).

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
      const throttleMs = (activeTabRef.current === 1 || activeTabRef.current === 2)
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
          if (pending) flushSocketToState(pending);
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

  // Use local orders for LOCAL pairs - only after chart loaded to prevent blink during chart load
  useEffect(() => {
    if (currency?.available === "LOCAL" && initialLoadDone) {
      dispatch(setBuyOrders(LocalBuyOrders));
      dispatch(setSellOrders(LocalSellOrders));
      setRecentTrades(LocalRecentTrade);
    }
  }, [LocalBuyOrders, LocalSellOrders, LocalRecentTrade, currency, initialLoadDone]);

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
  }, [isLimit]);





  const validateOrder = (price, quantity, side) => {
    const tick_size = currencyData?.tick_size || 0.01;
    const step_size = currencyData?.step_size || 0.00001;
    const min_notional = currencyData?.min_notional || 5;
    const max_order_qty = currencyData?.max_order_qty || 9000;

    const numPrice = parseFloat(price);
    const numQuantity = parseFloat(quantity);
    const total = numPrice * numQuantity;

    const pricePrecisionVal = getDecimalPlaces(tick_size);
    const priceMultiplier = Math.pow(10, pricePrecisionVal);
    if (Math.round(numPrice * priceMultiplier) % Math.round(tick_size * priceMultiplier) !== 0) {
      showError(`Price must be a multiple of ${tick_size}`);
      return false;
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

  // useEffect(() => {
  //   if (isBuy && _balance) {
  //     setBalance(_balance?.quote_currency_balance);
  //   } else {
  //     setBalance(_balance?.base_currency_balance);
  //   }
  // }, [isBuy, _balance]);

  const handleTotalPercentage = (value) => {
    setActivePercentage(value);
    if (isBuy) {
      const val = percentCalculation(
        coinBalance?.quote_currency_balance || 0,
        value
      );
      const finalQuantity = toFixed8(
        val / (isLimit ? price || buy_price : buy_price)
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
    if (item.name == "Limit") {
      setIsLimit(true);
    } else {
      setIsLimit(false);
    }
    rbSheetlimit?.current?.close();
  };

  const onSubmit = () => {
    // if (kycVerified !== 2) {
    //   NavigationService.navigate(KYC_STATUS_SCREEN);
    //   return;
    // }
    if (skip_buy_sell) {
      const orderPrice = !isLimit ? buy_price : isLimit && price ? price : buy_price;
      // Validate order before placing
      if (!validateOrder(orderPrice, amount, isBuy ? "BUY" : "SELL")) {
        return;
      }
      let data = {
        base_currency_id: base_currency_id,
        order_type: isLimit ? "LIMIT" : "MARKET",
        price: orderPrice,
        quantity: amount,
        quote_currency_id: quote_currency_id,
        side: isBuy ? "BUY" : "SELL",
      };
      dispatch(placeOrder(data, setVisible));

      // setTimeout(() => {
      //   let _data = {
      //     message: "exchange",
      //     userId: id,
      //     base_currency_id: base_currency_id,
      //     quote_currency_id: quote_currency_id,
      //   };

      //   if (id && base_currency_id && quote_currency_id) {
      //     socket?.emit("exchange", _data);
      //     console.log("event name exchange emitted");
      //   }
      // }, 2000);
    } else {
      setIsConfirm(true);
    }
  };

  const onConfirm = () => {
    const orderPrice = !isLimit ? buy_price : isLimit && price ? price : buy_price;
    // Validate order before placing
    if (!validateOrder(orderPrice, amount, isBuy ? "BUY" : "SELL")) {
      setIsConfirm(false);
      return;
    }
    let data = {
      base_currency_id: base_currency_id,
      order_type: isLimit ? "LIMIT" : "MARKET",
      price: orderPrice,
      quantity: amount,
      quote_currency_id: quote_currency_id,
      side: isBuy ? "BUY" : "SELL",
    };
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

  const renderLimit = () => {
    return DataLimit?.map((item) => {
      return (
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => selectNumberLimitOn(item)}
          style={[styles.selectContainer, { paddingVertical: 12, height: 'auto' }]}
        >
          <AppText type={THIRTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 14 }}>
            {item.name}
          </AppText>
          {numberSelectLimit == item.name ? (
            <FastImage
              source={checkIc}
              tintColor={colors.buttonBg}
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

  // Stable keyExtractors for order FlatLists (avoid inline functions)
  const openOrderKeyExtractor = useCallback((item, idx) => item?._id ?? `open_${idx}`, []);
  const pastOrderKeyExtractor = useCallback((item, idx) => item?._id ?? `past_${idx}`, []);

  // Memoize filtered open orders for better performance
  const filteredOpenOrders = useMemo(() => {
    if (!openOrders?.length) return [];
    const filtered = orderFilter === "All"
      ? openOrders
      : openOrders.filter((item) => item?.side === orderFilter);
    // Sort by createdAt descending (latest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a?.createdAt || 0).getTime();
      const dateB = new Date(b?.createdAt || 0).getTime();
      return dateB - dateA; // Descending order (latest first)
    });
  }, [openOrders, orderFilter]);

  // Memoize filtered past orders for better performance
  const filteredPastOrders = useMemo(() => {
    if (!pastOrders?.length) return [];
    const filtered = pastOrderFilter === "All"
      ? [...pastOrders]
      : pastOrders.filter((item) => item?.side === pastOrderFilter);
    return filtered.sort((a, b) => {
      const dateA = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
      const dateB = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
      return dateB - dateA;
    });
  }, [pastOrders, pastOrderFilter]);

  // Total: when amount is 0/empty show same default price as Limit field; else amount * price
  const totalDisplayValue = useMemo(() => {
    const amt = (amount === "" || amount === undefined) ? 0 : (Number(amount) || 0);
    const effectivePrice = isLimit
      ? (Number(price) || Number(buy_price) || 0)
      : (Number(buy_price) || 0);
    return amt * effectivePrice;
  }, [amount, price, buy_price, isLimit]);

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

  const changeSymbolChart = useCallback((symbol) => {

    if (webview.current) {
      webview.current.postMessage(
        JSON.stringify({ type: "CHANGE_SYMBOL", symbol: symbol }) // dynamic symbol
      );
    }
  }, []);

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
            onCandlePress={handleCandlePress}
          />
          <View
            style={[
              styles.minicontainer,
              { backgroundColor: themeColors.background },
            ]}
          >
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Text
                  style={{
                    color: (buy_price ?? 0) < 0 ? themeColors.red : themeColors.green,
                    fontSize: 15,
                  }}
                >
                  {buy_price ?? "-"}
                </Text>
                <FastImage
                  source={buy_price < 0 ? downIcon : upIcon}
                  resizeMode="contain"
                  style={{ width: 10, height: 10 }}
                  tintColor={buy_price < 0 ? themeColors.red : themeColors.green}
                />
              </View>
              <Text
                style={{ color: (change_percentage ?? 0) < 0 ? themeColors.red : themeColors.green }}
              >
                {" "}
                {change_percentage != null ? `${toFixedThree(change_percentage)}%` : "-"}
              </Text>
            </View>
            <View style={{ width: "50%" }}>
              <View>
                <View style={styles.contain}>
                  <AppText style={{ color: themeColors.secondaryText }}>24h High</AppText>
                  <AppText
                    style={{
                      color: themeColors.text,
                      fontWeight: "500",
                    }}
                  >
                    {high ?? "-"}
                  </AppText>
                </View>
                <View style={styles.contain}>
                  <AppText style={{ color: themeColors.secondaryText }}>24h Low</AppText>
                  <AppText
                    style={{
                      color: themeColors.text,
                      fontWeight: "500",
                    }}
                  >
                    {low ?? "-"}
                  </AppText>
                </View>
                <View style={styles.contain}>
                  <AppText style={{ color: themeColors.secondaryText }}>24h Vol</AppText>
                  <AppText
                    style={{
                      color: themeColors.text,
                      fontWeight: "500",
                    }}
                  >
                    {volume != null ? twoFixedTwo(volume) : "-"} {base_currency ?? effectiveCurrency?.base_currency ?? ""}
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          <Reanimated.View style={animatedChartContainerStyle}>
            <Reanimated.View style={animatedChartContentStyle}>
              <SpotChartSection
                chartUri={chartUri}
                webViewReady={webViewReady}
                chartRevealed={chartRevealed}
                isSpotFocused={isSpotFocused}
                theme={theme}
                colors={colors}
                onChartLoaded={onChartLoaded}
                chartRef={webview}
                showChartSkeleton={!chartRevealed && isSpotFocused && !chartRevealedOnceRef.current}
              />
            </Reanimated.View>
          </Reanimated.View>


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
                    marginBottom: 10,
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => { setTab("Buy"); setIsBuy(true); }}
                  style={{ flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "center", paddingVertical: 16 }}
                >
                  <ImageBackground
                    source={trade_btn}
                    tintColor={tab === "Buy" ? themeColors.green : themeColors.background}
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
                    <AppText weight={SEMI_BOLD} style={[styles.tabText, { color: tab === "Buy" ? themeColors.textOnButton : themeColors.secondaryText }]}>Buy</AppText>
                  </ImageBackground>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => { setTab("Sell"); setIsBuy(false); }}
                  style={{ flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "center", paddingVertical: 16 }}
                >
                  <ImageBackground
                    source={trade_btn}
                    tintColor={tab === "Sell" ? themeColors.red : themeColors.background}
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

              <TouchableOpacity
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: themeColors.themeElevationColor,
                  },
                ]}
                onPress={() => rbSheetlimit?.current?.open()}
              >
                <AppText style={[styles.dropdownText, { color: themeColors.text }]} >{numberSelectLimit}</AppText>
                <FastImage
                  source={downIcon}
                  resizeMode="contain"
                  style={{ width: 10, height: 10 }}
                  tintColor={themeColors.text}
                />
              </TouchableOpacity>

              {isLimit && (
                <View style={styles.spotOrderInputBlock}>
                  <AppText style={[styles.spotOrderInputLabel, { color: themeColors.secondaryText }]}>
                    Limit ({quote_currency})
                  </AppText>
                  <View style={[styles.spotOrderInputBox, { backgroundColor: themeColors.themeElevationColor, borderWidth: 0.5, borderColor: themeColors.themeBorderColor }]}>
                    <TouchableOpacity onPress={() => handlePriceStep(-1)} style={styles.spotOrderStepBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                      <AppText style={[styles.spotOrderStepBtnText, { color: themeColors.secondaryText }]}>−</AppText>
                    </TouchableOpacity>
                    <TextInput
                      placeholder={String(buy_price)}
                      placeholderTextColor={themeColors.secondaryText}
                      value={price || formatTotal(buy_price)}
                      onChangeText={(text) => handlePriceInput(text, setPrice)}
                      onBlur={() => handlePriceBlur(price, setPrice)}
                      keyboardType="numeric"
                      style={[styles.spotOrderInputValue, { color: themeColors.text }]}
                      editable={isLimit}
                    />
                    <TouchableOpacity onPress={() => handlePriceStep(1)} style={styles.spotOrderStepBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                      <AppText style={[styles.spotOrderStepBtnText, { color: themeColors.secondaryText }]}>+</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.spotOrderInputBlock}>
                <AppText style={[styles.spotOrderInputLabel, { color: themeColors.secondaryText }]}>
                  Amount ({base_currency})
                </AppText>
                <View style={[styles.spotOrderInputBox, { backgroundColor: themeColors.themeElevationColor, borderWidth: 0.5, borderColor: themeColors.themeBorderColor }]}>
                  <TouchableOpacity onPress={() => handleAmountStep(-1)} style={styles.spotOrderStepBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <AppText style={[styles.spotOrderStepBtnText, { color: themeColors.secondaryText }]}>−</AppText>
                  </TouchableOpacity>
                  <TextInput
                    placeholder={"Amount"}
                    placeholderTextColor={themeColors.secondaryText}
                    value={amount}
                    onChangeText={(text) => handleQty(text)}
                    onBlur={() => handleQuantityBlur(amount, setAmount)}
                    keyboardType="numeric"
                    style={[styles.spotOrderInputValue, { color: themeColors.text }]}
                  />
                  <TouchableOpacity onPress={() => handleAmountStep(1)} style={styles.spotOrderStepBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <AppText style={[styles.spotOrderStepBtnText, { color: themeColors.secondaryText }]}>+</AppText>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.spotOrderInputBlock}>
                <AppText style={[styles.spotOrderInputLabel, { color: themeColors.secondaryText }]}>
                  Total ({quote_currency})
                </AppText>
                <View style={[styles.spotOrderInputBox, { backgroundColor: themeColors.themeElevationColor, borderWidth: 0.5, borderColor: themeColors.themeBorderColor }]}>
                  <AppText
                    style={[
                      styles.spotOrderInputValue,
                      styles.spotOrderTotalValue,
                      { color: themeColors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {formatTotal(totalDisplayValue) ?? "0"}
                  </AppText>
                </View>
              </View>


              <PercentQuickSelect
                activeValue={activePercentage}
                onSelect={handleTotalPercentage}
                theme={theme}
              />

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

                <View style={[styles.assetRow, { marginTop: 6 }]}>
                  {["Deposit", "Transfer", "Withdraw"].map((btn, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.assetActionBtn,
                        {
                          backgroundColor: themeColors.themeElevationColor,
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

                {/* Fee Information */}
                {currencyData && (
                  <View style={[styles.assetRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: themeColors.themeBorderColor }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11 }}>
                          Taker Fee
                        </AppText>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontWeight: "600" }}>
                          {currencyData?.taker_fee || "0"}%
                        </AppText>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11 }}>
                          Maker Fee
                        </AppText>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontWeight: "600" }}>
                          {currencyData?.maker_fee || "0"}%
                        </AppText>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Buy Button */}
              {/* <TouchableOpacity style={styles.buyBtn}>
            <AppText style={styles.buyBtnText}>Buy BTC</AppText>
          </TouchableOpacity> */}
              <Button
                children={
                  isBuy
                    ? `Buy ${base_currency}`
                    : `Sell ${base_currency}`
                }
                disabled={!amount}
                containerStyle={[
                  { backgroundColor: isBuy ? colors.buyBtnGreen : colors.sellButtonColor },
                ]}
                onPress={() => onSubmit()}
                titleStyle={{ color: colors.white }}
              />
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

        {/* Open Orders / Order History tabs - row with history icon on the right */}
        {orderBookReady && (
          <View
            style={{
              flexDirection: "row",
              marginTop: 20,
              alignItems: "center",
              marginHorizontal: 15,
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (activeTab === 1) return;
                  LayoutAnimation.configureNext({
                    duration: 280,
                    update: { type: LayoutAnimation.Types.easeInEaseOut },
                    create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
                  });
                  setExpandedRowIndex(null);
                  setActiveTab(1);
                }}
                style={{ alignItems: "center", minHeight: 36, justifyContent: "center" }}
              >
                <AppText
                  numberOfLines={1}
                  style={{
                    color: activeTab == 1 ? themeColors.text : themeColors.secondaryText,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Open Orders {openOrders?.length > 0 ? `(${openOrders.length})` : ""}
                </AppText>
                <View
                  style={{
                    width: 30, // Increased slightly for better visibility
                    height: 2, // Slightly thicker
                    marginTop: 4,
                    backgroundColor: activeTab == 1 ? colors.buttonBg : 'transparent',
                    borderRadius: 1,
                  }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (activeTab === 2) return;
                  LayoutAnimation.configureNext({
                    duration: 280,
                    update: { type: LayoutAnimation.Types.easeInEaseOut },
                    create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
                  });
                  setExpandedRowIndex(null);
                  setActiveTab(2);
                }}
                style={{ alignItems: "center", minHeight: 36, justifyContent: "center" }}
              >
                <AppText
                  numberOfLines={1}
                  style={{
                    color: activeTab == 2 ? themeColors.text : themeColors.secondaryText,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Order History {pastOrders?.length > 0 ? `(${pastOrders.length})` : ""}
                </AppText>
                <View
                  style={{
                    width: 30, // Increased slightly
                    height: 2, // Slightly thicker
                    marginTop: 4,
                    backgroundColor: activeTab == 2 ? colors.buttonBg : "transparent",
                    borderRadius: 1,
                  }}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => NavigationService.navigate("Trade_History")}
              style={{ paddingVertical: 8, paddingLeft: 4, justifyContent: "center", right: 10 }}
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
              {openOrders?.length > 0 ? (
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
          height={180}
          animationType="none"
          customStyles={{
            container: {
              backgroundColor: themeColors.themeElevationColor,
              height: 180,
              borderRadius: 10,
              paddingHorizontal: universalPaddingHorizontal,
              paddingTop: 10,
            },
            wrapper: {
              backgroundColor: "#0006",
            },
            draggableIcon: {
              backgroundColor: themeColors.themeBorderColor,
              width: 50,
            },
          }}
        >
          {renderLimit(theme)}
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
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  webview: {
    flex: 1,
  },
  // secondcontainer: {
  //   padding: 12,
  //   backgroundColor: '#fff',
  // },
  secondcontainer: {
    flexDirection: "row",
    padding: 10,
    marginRight: 10,
  },
  leftPanel: {
    flex: 6,
    paddingRight: 8,
    // backgroundColor:"red",
  },
  rightPanel: {
    flex: 4,
    // borderLeftWidth: 1,
    // borderColor: '#ddd',
    paddingLeft: 8,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 10,
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
    // borderWidth: 1,
    // borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    justifyContent: "space-between",
    marginBottom: 10,

    alignItems: "center",
  },
  dropdownText: {
    fontSize: 12,

    // color: "#000",
  },
  spotOrderInputBlock: {
    marginBottom: 8,
  },
  spotOrderInputLabel: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 3,
  },
  spotOrderInputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 6,
    paddingHorizontal: 6,
    minHeight: 36,
  },
  spotOrderStepBtn: {
    paddingVertical: 4,
    paddingHorizontal: 0,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  spotOrderStepBtnText: {
    fontSize: 16,
    fontWeight: "400",
  },
  spotOrderInputValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 5,
    paddingHorizontal: 4,
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
    padding: 6,
    marginTop: 2,
    marginBottom: 8,
  },
  assetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  assetLabel: {
    // color: "#222",
    fontSize: 12,
    fontWeight: "600",
  },
  assetValue: {
    fontSize: 12,
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