import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import FastImage from "react-native-fast-image";
import { useNavigation } from "@react-navigation/native";
import { useAppSelector } from "../../../store/hooks";
import { useTheme } from "../../../hooks/useTheme";
import { AppText, MEDIUM, SEMI_BOLD, TEN, THIRTEEN, TWELVE } from "../../../shared";
import { downIcon, order_1, order_2, order_3 } from "../../../helper/ImageAssets";
import { darkTheme } from "../../../theme/colors";
import { showError } from "../../../helper/logger";
import NavigationService from "../../../navigation/NavigationService";
import {
  LOGIN_SCREEN,
  MARGIN_BORROW_REPAY_SCREEN,
  NAVIGATION_AUTH_STACK,
} from "../../../navigation/routes";
import { ShimmerBox } from "./ShimmerBox";
import {
  ORDER_BOOK_LIST_MAX_HEIGHT,
  ORDER_BOOK_ROW_LAYOUT_HEIGHT,
  ORDER_BOOK_VISIBLE_ROWS,
} from "./spotConstants";
import {
  aggregateSpotOrderBookRows,
  clamp01OB,
  formatSpotAggStepLabel,
  getSpotOrderBookAggOptionsForPair,
  orderBookDataEqual,
  SPOT_ORDER_BOOK_AGG_DEFAULTS,
  toFiniteOB,
} from "./spotOrderHelpers";

const { width: Width } = Dimensions.get("window");
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
  const depthRed = isDark ? "rgba(232, 97, 97, 0.18)" : "rgba(255, 77, 79, 0.14)";

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
        <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.orderPrice, { color: themeColors.red }]}>{formatPrice(item?.price)}</AppText>
        <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.orderSize, { color: themeColors.text }]}>{formatQuantity(item?.remaining)}</AppText>
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

  const depthGreen = isDark ? "rgba(0, 192, 118, 0.16)" : "rgba(0, 192, 118, 0.12)";

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
            backgroundColor: depthGreen,
          }}
        />
        <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.orderPrice, { color: themeColors.green }]}>{formatPrice(item?.price)}</AppText>
        <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.orderSize, { color: themeColors.text }]}>{formatQuantity(item?.remaining)}</AppText>
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
  prev.quoteHourlyRate === next.quoteHourlyRate &&
  prev.isHourlyRateLoading === next.isHourlyRateLoading &&
  prev.headerTab === next.headerTab &&
  prev.marginMode === next.marginMode &&
  prev.visibleRows === next.visibleRows &&
  orderBookDataEqual(prev.sellData, next.sellData) &&
  orderBookDataEqual(prev.buyData, next.buyData);

/** Extra rows per side so Cross ML card + CTA line up with the order book. */
const ORDER_BOOK_CROSS_EXTRA_ROWS = 1;
/** Use fixed height (not maxHeight) so switching view modes never collapses the panel. */
const ORDER_BOOK_LIST_STYLE = { height: ORDER_BOOK_LIST_MAX_HEIGHT, flexGrow: 0 };

const getOrderBookVisibleRows = (headerTab, marginMode, hasUser) =>
  headerTab === "Margin" && (marginMode === "Cross" || marginMode === "Isolated") && hasUser
    ? ORDER_BOOK_VISIBLE_ROWS + ORDER_BOOK_CROSS_EXTRA_ROWS
    : ORDER_BOOK_VISIBLE_ROWS;
const ORDER_BOOK_HEADER_ROW_STYLE = { flexDirection: "row", justifyContent: "space-between" };
const ORDER_BOOK_HEADER_LABEL_STYLE = { color: "#9D9D9D" };
/** Keep order book area stable when toggling view (both/bids/asks). */
const ORDER_BOOK_PANEL_FIXED_HEIGHT = ORDER_BOOK_LIST_MAX_HEIGHT * 2 + 70;
const ORDER_BOOK_SHIMMER_STRIP_WIDTH = 240;

const OrderBookSkeleton = ({ rows = ORDER_BOOK_VISIBLE_ROWS }) => {
  const { colors: themeColors, isDark } = useTheme();
  const ROWS = rows;
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
  headerTab,
  marginMode,
  visibleRows = ORDER_BOOK_VISIBLE_ROWS,
  quoteHourlyRate,
  isHourlyRateLoading,
}) => {
  const { colors: themeColors, theme, isDark } = useTheme();
  const navigation = useNavigation();
  const userData = useAppSelector((state) => state.auth?.userData);
  const isSingleSide = !(showAskSide && showBidSide);
  const listHeight = visibleRows * ORDER_BOOK_ROW_LAYOUT_HEIGHT;
  const extraListTotal = (visibleRows - ORDER_BOOK_VISIBLE_ROWS) * ORDER_BOOK_ROW_LAYOUT_HEIGHT * 2;
  const dualSideListStyle = useMemo(
    () => (visibleRows === ORDER_BOOK_VISIBLE_ROWS
      ? ORDER_BOOK_LIST_STYLE
      : { height: listHeight, flexGrow: 0 }),
    [visibleRows, listHeight]
  );
  const singleSideListStyle = useMemo(
    () => ({ height: listHeight * 2 + 10, flexGrow: 0 }),
    [listHeight]
  );
  const sellListStyle = isSingleSide ? singleSideListStyle : dualSideListStyle;
  const buyListStyle = isSingleSide ? singleSideListStyle : dualSideListStyle;
  const listEmptySell = useMemo(
    () => (
      <View style={styles.emptyOrderBook}>
        {showOrderBookSkeleton ? (
          <OrderBookSkeleton rows={visibleRows} />
        ) : (
          <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText }}>No ask data</AppText>
        )}
      </View>
    ),
    [showOrderBookSkeleton, themeColors.secondaryText, styles.emptyOrderBook, theme, visibleRows]
  );
  const listEmptyBuy = useMemo(
    () => (
      <View style={styles.emptyOrderBook}>
        {showOrderBookSkeleton ? (
          <OrderBookSkeleton rows={visibleRows} />
        ) : (
          <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText }}>No bid data</AppText>
        )}
      </View>
    ),
    [showOrderBookSkeleton, themeColors.secondaryText, styles.emptyOrderBook, theme, isDark, visibleRows]
  );
  const [isPricePositive, setIsPricePositive] = React.useState(true);
  const prevPriceRef = React.useRef(0);

  React.useEffect(() => {
    const currentNum = Number(buy_price);
    if (currentNum > prevPriceRef.current && prevPriceRef.current !== 0) {
      setIsPricePositive(true);
    } else if (currentNum < prevPriceRef.current && prevPriceRef.current !== 0) {
      setIsPricePositive(false);
    }
    if (currentNum > 0) {
      prevPriceRef.current = currentNum;
    }
  }, [buy_price]);

  const currentPriceColor = isPricePositive ? themeColors.green : themeColors.red;
  const renderCurrentPrice = () => (
    <View style={styles.currentPriceBox}>
      {showOrderBookSkeleton ? (
        <View style={{ flexDirection: "column", gap: 4, width: "100%" }}>
          <ShimmerBox width="60%" height={22} borderRadius={4} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} />
          <ShimmerBox width="45%" height={14} borderRadius={4} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} style={{ marginTop: 2 }} />
        </View>
      ) : (
        <>
          <AppText style={[styles.currentPrice, { color: currentPriceColor }]}>{buy_price}</AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
            <AppText style={styles.currentPriceUSD}>
              ≈ ${buy_price}
            </AppText>
            {/* <AppText style={{ fontSize: 11, fontWeight: "600", color: currentPriceColor }}>
              {Number(change_percentage) >= 0 ? "+" : ""}{Number(change_percentage || 0).toFixed(2)}%
            </AppText> */}
          </View>
        </>
      )}
    </View>
  );
  const containerHeight = (headerTab === "Margin"
    ? ORDER_BOOK_PANEL_FIXED_HEIGHT + 45
    : ORDER_BOOK_PANEL_FIXED_HEIGHT) + extraListTotal;

  return (
    <View style={{ height: containerHeight, flexGrow: 0 }}>
      {headerTab === "Margin" && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 6,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: themeColors.themeBorderColor,
            marginBottom: 6,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (!userData) {
                showError("Please login first to access Margin Borrow/Repay");
                NavigationService.navigate(NAVIGATION_AUTH_STACK, { screen: LOGIN_SCREEN });
                return;
              }
              navigation.navigate(MARGIN_BORROW_REPAY_SCREEN, { pair: `${base_currency}/${quote_currency}`, marginMode });
            }}
            style={{
              backgroundColor: isDark ? "#2C2C2E" : "#E5E5EA",
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <AppText weight={SEMI_BOLD} style={{ fontSize: 10, color: themeColors.text }}>B/R</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (!userData) {
                showError("Please login first to view Margin details");
                NavigationService.navigate(NAVIGATION_AUTH_STACK, { screen: LOGIN_SCREEN });
                return;
              }
              navigation.navigate(MARGIN_BORROW_REPAY_SCREEN, { pair: `${base_currency}/${quote_currency}`, marginMode });
            }}
            style={{ alignItems: "flex-end" }}
          >
            <AppText style={{ fontSize: 9, color: themeColors.secondaryText, lineHeight: 11 }}>Hourly Rate ({quote_currency})...</AppText>
            {isHourlyRateLoading ? (
              <ShimmerBox width={40} height={12} borderRadius={2} shimmerStripWidth={ORDER_BOOK_SHIMMER_STRIP_WIDTH} style={{ marginTop: 2 }} />
            ) : (
              <AppText weight={SEMI_BOLD} style={{ fontSize: 10, color: themeColors.text, lineHeight: 12 }}>{quoteHourlyRate}</AppText>
            )}
          </TouchableOpacity>
        </View>
      )}
      <View style={ORDER_BOOK_HEADER_ROW_STYLE}>
        <View>
          <AppText weight={MEDIUM} style={ORDER_BOOK_HEADER_LABEL_STYLE}>Price</AppText>
          <AppText weight={MEDIUM} style={ORDER_BOOK_HEADER_LABEL_STYLE}>({quote_currency})</AppText>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <AppText weight={MEDIUM} style={ORDER_BOOK_HEADER_LABEL_STYLE}>Qty</AppText>
          <AppText weight={MEDIUM} style={ORDER_BOOK_HEADER_LABEL_STYLE}>({base_currency})</AppText>
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
            initialNumToRender={visibleRows + 2}
            maxToRenderPerBatch={visibleRows + 2}
            windowSize={5}
            updateCellsBatchingPeriod={100}
            inverted={true}
            style={sellListStyle}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
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
            initialNumToRender={visibleRows + 2}
            maxToRenderPerBatch={visibleRows + 2}
            windowSize={5}
            updateCellsBatchingPeriod={100}
            style={buyListStyle}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
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
            initialNumToRender={visibleRows + 4}
            maxToRenderPerBatch={visibleRows + 4}
            windowSize={7}
            updateCellsBatchingPeriod={80}
            style={buyListStyle}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
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
            initialNumToRender={visibleRows + 4}
            maxToRenderPerBatch={visibleRows + 4}
            windowSize={7}
            updateCellsBatchingPeriod={80}
            inverted={true}
            style={sellListStyle}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
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

export const OrderBookSection = memo(({
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
  headerTab,
  marginMode,
  quoteHourlyRate,
  isHourlyRateLoading,
}) => {
  const { theme, colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth?.userData);
  const buyOrders = useAppSelector((state) => state.home.buyOrders);
  const sellOrders = useAppSelector((state) => state.home.sellOrders);
  const visibleRows = getOrderBookVisibleRows(headerTab, marginMode, !!userData);
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
    () => {
      if (showOrderBookSkeleton) return [];
      if (!orderBookReady || !showAskSide) return [];
      const isSingleSide = !(showAskSide && showBidSide);
      const minRows = isSingleSide ? visibleRows * 2 : visibleRows;
      const data = [...asksAggregated];
      while (data.length < minRows) {
        data.push({ isPlaceholder: true, price: `placeholder-ask-${data.length}`, remaining: 0 });
      }
      return data;
    },
    [showOrderBookSkeleton, orderBookReady, showAskSide, showBidSide, asksAggregated, visibleRows]
  );
  const buyOrdersForDisplay = useMemo(
    () => {
      if (showOrderBookSkeleton) return [];
      if (!orderBookReady || !showBidSide) return [];
      const isSingleSide = !(showAskSide && showBidSide);
      const minRows = isSingleSide ? visibleRows * 2 : visibleRows;
      const data = [...bidsAggregated];
      while (data.length < minRows) {
        data.push({ isPlaceholder: true, price: `placeholder-bid-${data.length}`, remaining: 0 });
      }
      return data;
    },
    [showOrderBookSkeleton, orderBookReady, showAskSide, showBidSide, bidsAggregated, visibleRows]
  );

  const maxBuyVolume = useMemo(
    () => {
      // Match web/mobile perception: scale depth by *visible* rows, so one huge order deep in book
      // doesn't make all shown bars look tiny.
      const vis = bidsAggregated.slice(0, visibleRows);
      // Do not force >= 1 (many pairs have < 1 quantities). Denom fallback handled in row component.
      return Math.max(0, ...vis.map((o) => toFiniteOB(o?.remaining)).filter(Number.isFinite));
    },
    [bidsAggregated, visibleRows]
  );
  const maxSellVolume = useMemo(
    () => {
      const vis = asksAggregated.slice(0, visibleRows);
      return Math.max(0, ...vis.map((o) => toFiniteOB(o?.remaining)).filter(Number.isFinite));
    },
    [asksAggregated, visibleRows]
  );

  /** Binance-like OB ratio bar uses visible rows volume sum. */
  const obRatio = useMemo(() => {
    const takeN = visibleRows;
    const bidSum = bidsAggregated.slice(0, takeN).reduce((s, o) => s + (toFiniteOB(o?.remaining) || 0), 0);
    const askSum = asksAggregated.slice(0, takeN).reduce((s, o) => s + (toFiniteOB(o?.remaining) || 0), 0);
    const total = bidSum + askSum;
    if (!total || !Number.isFinite(total)) return { bidPct: 50, askPct: 50 };
    const bidPct = (bidSum / total) * 100;
    return { bidPct, askPct: 100 - bidPct };
  }, [bidsAggregated, asksAggregated, visibleRows]);

  const renderSellOrderItem = useCallback(
    ({ item }) => {
      if (item.isPlaceholder) {
        return (
          <View style={[sty.orderRow, { height: 28, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: "#9D9D9D", opacity: 0.15 }}>—</AppText>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: "#9D9D9D", opacity: 0.15 }}>—</AppText>
          </View>
        );
      }
      return (
        <OrderBookSellRow
          item={item}
          maxVolume={maxSellVolume}
          theme={theme}
          onPress={onOrderBookPress}
          formatPrice={formatPrice}
          formatQuantity={formatQuantity}
          styles={sty}
        />
      );
    },
    [maxSellVolume, theme, onOrderBookPress, formatPrice, formatQuantity, sty]
  );
  const renderBuyOrderItem = useCallback(
    ({ item }) => {
      if (item.isPlaceholder) {
        return (
          <View style={[sty.orderRow, { height: 28, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: "#9D9D9D", opacity: 0.15 }}>—</AppText>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: "#9D9D9D", opacity: 0.15 }}>—</AppText>
          </View>
        );
      }
      return (
        <OrderBookBuyRow
          item={item}
          maxVolume={maxBuyVolume}
          theme={theme}
          onPress={onOrderBookPress}
          formatPrice={formatPrice}
          formatQuantity={formatQuantity}
          styles={sty}
        />
      );
    },
    [maxBuyVolume, theme, onOrderBookPress, formatPrice, formatQuantity, sty]
  );

  const sellKeyExtractor = useCallback((item) => {
    if (item.isPlaceholder) return item.price;
    const p = item?.price != null ? String(Number(item.price)) : "";
    return `sell_${p}`;
  }, []);
  const buyKeyExtractor = useCallback((item) => {
    if (item.isPlaceholder) return item.price;
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
        headerTab={headerTab}
        marginMode={marginMode}
        visibleRows={visibleRows}
        quoteHourlyRate={quoteHourlyRate}
        isHourlyRateLoading={isHourlyRateLoading}
      />

      <View style={[sty.ratioIndicatorBar, { marginVertical: 3, gap: 4 }]}>
        <View style={{ justifyContent: "flex-start", flexShrink: 0 }}>
          <AppText numberOfLines={1} weight={SEMI_BOLD} style={{ color: "#38B781", fontSize: 10 }}>
            {obRatio.bidPct.toFixed(1)}%
          </AppText>
        </View>
        <View style={[sty.ratioIndicatorTrack, { flex: 1, height: 3 }]}>
          <View style={[sty.ratioIndicatorFill, { width: `${obRatio.bidPct}%`, backgroundColor: "#38B781", borderTopLeftRadius: 2, borderBottomLeftRadius: 2 }]} />
          <View style={[sty.ratioIndicatorFill, { flex: 1, backgroundColor: "#ED4E4E", borderTopRightRadius: 2, borderBottomRightRadius: 2 }]} />
        </View>
        <View style={{ justifyContent: "flex-end", flexShrink: 0 }}>
          <AppText numberOfLines={1} weight={SEMI_BOLD} style={{ color: "#ED4E4E", fontSize: 10 }}>
            {obRatio.askPct.toFixed(1)}%
          </AppText>
        </View>
      </View>

      <View style={sty.spotObToolbarRow}>
        <TouchableOpacity
          ref={aggTriggerRef}
          activeOpacity={0.75}
          onPress={openAggMenu}
          style={[
            sty.spotObAggTrigger,
            {
              backgroundColor: isDark ? darkTheme.darkThemeInputColor : themeColors.input,
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
              backgroundColor: isDark ? darkTheme.darkThemeInputColor : themeColors.input,
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
                backgroundColor: isDark ? themeColors.sheetDarkColor : themeColors.card,
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
