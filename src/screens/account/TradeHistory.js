import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import { useIsFocused } from "@react-navigation/native";
import {
  AppSafeAreaView,
  AppText,
  Toolbar,
  MEDIUM,
  SEMI_BOLD,
} from "../../shared";
import { colors, lightTheme } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import { useAppSelector } from "../../store/hooks";
import FastImage from "react-native-fast-image";
import { NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT, right_ic, downIcon } from "../../helper/ImageAssets";
import { useDispatch } from "react-redux";
import { getPastOrders, cancelOrder } from "../../actions/homeActions";
import { getTradeHistory } from "../../actions/walletActions";
import moment from "moment";
import TradeHistorySkeleton from "./TradeHistorySkeleton";
import {
  spotOpenOrderMarketLabel,
  tradeHistoryBaseAsset,
} from "../../helper/utility";
import NavigationService from "../../navigation/NavigationService";
import { SPOT_ORDER_HISTORY_DETAIL } from "../../navigation/routes";

const { width: screenW } = Dimensions.get("window");

function orderHistoryEventTime(item) {
  return item?.updated_at || item?.updatedAt || item?.created_at || item?.createdAt || item?.date || item?.timestamp || item?.time;
}

function orderHistoryMarketLabel(item, base, quote) {
  return spotOpenOrderMarketLabel(item, base, quote);
}

function orderHistoryQuoteCurrency(item) {
  const lbl = orderHistoryMarketLabel(item);
  const parts = lbl.split("/");
  return parts.length > 1 ? parts[1] : "";
}

function orderHistoryExecutionsList(item) {
  if (Array.isArray(item?.executions)) return item.executions;
  if (Array.isArray(item?.trades)) return item.trades;
  return [];
}

function orderHistoryTifDisplay(item) {
  return item?.time_in_force || item?.timeInForce || "GTC";
}

function safeToFixed8(val, fallback = "0") {
  if (val == null || val === "" || isNaN(Number(val))) return fallback;
  return Number(val).toFixed(8);
}

/**
 * Optimized Key-Value Row for Cards
 */
const TradeKvRow = React.memo(({ label, value, color, labelColor, textColor }) => (
  <View style={styles.tradeKvRow}>
    <AppText style={[styles.tradeKvK, { color: labelColor }]}>{label}</AppText>
    <AppText style={[styles.tradeKvV, { color: color ?? textColor }]} numberOfLines={3}>
      {value}
    </AppText>
  </View>
));

/**
 * Memoized Order Card component
 */
const OrderCard = React.memo(({
  item,
  spotSelectedPair,
  themeColors,
  onCancel,
  showTrades,
  onToggleExpand,
  getSideColor
}) => {
  const orderId = item?._id || item?.id || item?.order_id;
  const baseHint = spotSelectedPair?.base_currency ?? spotSelectedPair?.base_currency_short_name;
  const quoteHint = spotSelectedPair?.quote_currency ?? spotSelectedPair?.quote_currency_short_name;

  const currencyPair = useMemo(() => spotOpenOrderMarketLabel(item, baseHint, quoteHint), [item, baseHint, quoteHint]);
  const side = useMemo(() => String(item?.side || "").toUpperCase(), [item?.side]);
  const sideColor = useMemo(() => getSideColor(side), [side, getSideColor]);
  const typeUpper = useMemo(() => String(item?.order_type || item?.type || item?.orderType || "Market").toUpperCase(), [item]);

  const canCancel = useMemo(() => {
    const status = String(item?.status || item?.user_status || "").toUpperCase();
    return !!orderId && !["FILLED", "CANCELLED", "CANCELED", "COMPLETED", "EXECUTED", "REJECTED"].includes(status);
  }, [item, orderId]);

  const eventM = useMemo(() => {
    const ts = orderHistoryEventTime(item);
    return ts ? moment(ts) : null;
  }, [item]);

  const dateStr = eventM?.isValid() ? eventM.format("DD/MM/YYYY") : "—";
  const timeStr = eventM?.isValid() ? eventM.format("HH:mm:ss") : "—";
  const headerDateTime = eventM?.isValid() ? eventM.format("DD/MM/YYYY HH:mm:ss") : "—";

  const executions = useMemo(() => orderHistoryExecutionsList(item), [item]);
  const hasExecutedTrades = executions.length > 0;
  const quoteCc = useMemo(() => orderHistoryQuoteCurrency(item), [item]);
  const baseSym = useMemo(() => item?.ask_currency || item?.base_currency || (currencyPair.includes("/") ? currencyPair.split("/")[0] : ""), [item, currencyPair]);

  const priceDisplay = useMemo(() => {
    return String(item?.order_type || item?.type || "").toUpperCase() === "MARKET"
      ? "Market"
      : safeToFixed8(item?.price ?? 0, "—");
  }, [item]);

  const labelColor = themeColors.secondaryText ?? "#8E8E93";
  const textColor = themeColors.text ?? "#000000";
  const execBorder = themeColors.themeBorderColor ?? themeColors.border ?? "#EEEEEE";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item })}
      style={[styles.orderSpotCard, { backgroundColor: colors.white }]}
    >
      <View>
        <View style={styles.orderSpotHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <AppText style={[styles.orderSpotTitle, { color: textColor, fontSize: 17 }]} weight={SEMI_BOLD}>
                {currencyPair}
              </AppText>
              <FastImage source={right_ic} style={{ width: 12, height: 12, marginLeft: 4 }} resizeMode="contain" tintColor={labelColor} />
            </View>
            <AppText weight={MEDIUM} style={{ color: textColor, fontSize: 14, marginTop: 4 }}>{headerDateTime}</AppText>
            <AppText style={{ color: sideColor, fontSize: 15, marginTop: 4 }} weight={SEMI_BOLD}>
              {side} · {typeUpper}
            </AppText>
          </View>
        </View>

        <TradeKvRow label="Date" value={dateStr} labelColor={labelColor} textColor={textColor} />
        <TradeKvRow label="Time" value={timeStr} labelColor={labelColor} textColor={textColor} />
        <TradeKvRow label="Market" value={currencyPair} labelColor={labelColor} textColor={textColor} />
        <TradeKvRow label="Side" value={side} color={sideColor} labelColor={labelColor} textColor={textColor} />
        <TradeKvRow label="Type" value={typeUpper} labelColor={labelColor} textColor={textColor} />
        <TradeKvRow label="TIF" value={orderHistoryTifDisplay(item)} labelColor={labelColor} textColor={textColor} />
        <TradeKvRow label="Price" value={priceDisplay} labelColor={labelColor} textColor={textColor} />

        {hasExecutedTrades && (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.execTradesBtnSpot, { borderColor: colors.secondBorder }]}
              onPress={() => onToggleExpand(item)}
            >
              <View style={styles.execTradesBtnRowSpot}>
                <FastImage
                  source={downIcon}
                  tintColor={'grey'}
                  style={[styles.orderHistoryChevronSpot, { transform: [{ rotate: showTrades ? "180deg" : "0deg" }] }]}
                  resizeMode="contain"
                />
                <AppText style={[styles.execTradesBtnTextSpot, { color: textColor }]}> Executed trades</AppText>
              </View>
            </TouchableOpacity>

            {showTrades && (
              <View style={styles.execTradesBoxSpot}>
                {executions.map((tr, i) => (
                  <View key={`${orderId}_${tr?.trade_id ?? i}`} style={[styles.execTradeItemSpot, i === executions.length - 1 && { borderBottomWidth: 0, marginBottom: 0 }]}>
                    <View style={styles.execTradeHeaderRowSpot}>
                      <AppText style={[styles.execTradeHeaderTextSpot, { color: labelColor }]} weight={MEDIUM}>Trade #{i + 1}</AppText>
                    </View>
                    <TradeKvRow label="Price:" value={`${safeToFixed8(tr?.price || 0, "0")} ${quoteCc}`} labelColor={labelColor} textColor={textColor} />
                    <TradeKvRow label="Executed:" value={`${safeToFixed8(tr?.quantity || 0, "0")} ${baseSym}`} labelColor={labelColor} textColor={textColor} />
                    <TradeKvRow label="Fee:" value={`${safeToFixed8(tr?.fee || 0, "0")} ${quoteCc}`} labelColor={labelColor} textColor={textColor} />
                    <TradeKvRow label="Total:" value={safeToFixed8((Number(tr?.price) || 0) * (Number(tr?.quantity) || 0), "0")} labelColor={labelColor} textColor={textColor} />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {canCancel && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.red }]} onPress={() => onCancel(item)}>
            <AppText style={{ color: colors.red, fontWeight: "600", fontSize: 13 }}>Cancel order</AppText>
          </TouchableOpacity>
        </View>
      )}
      <View style={[styles.orderSpotDivider, { backgroundColor: colors.iconBgColor }]} />
    </TouchableOpacity>
  );
});

/**
 * Memoized Trade Fill Card component
 */
const TradeCard = React.memo(({ item, spotSelectedPair, themeColors, getSideColor }) => {
  const baseHint = spotSelectedPair?.base_currency ?? spotSelectedPair?.base_currency_short_name;
  const quoteHint = spotSelectedPair?.quote_currency ?? spotSelectedPair?.quote_currency_short_name;

  const mLabel = useMemo(() => orderHistoryMarketLabel(item, baseHint, quoteHint), [item, baseHint, quoteHint]);
  const baseSym = useMemo(() => tradeHistoryBaseAsset(item, baseHint, quoteHint), [item, baseHint, quoteHint]);
  const side = useMemo(() => String(item?.side || "").toUpperCase(), [item?.side]);
  const sideColor = useMemo(() => getSideColor(side), [side, getSideColor]);
  const role = useMemo(() => (item?.is_maker === true ? "Maker" : item?.is_maker === false ? "Taker" : "—"), [item?.is_maker]);

  const eventM = useMemo(() => {
    const ts = item?.executed_at || item?.executedAt || item?.created_at;
    return ts ? moment(ts) : null;
  }, [item]);

  const dateStr = eventM?.isValid() ? eventM.format("DD/MM/YYYY") : "—";
  const timeStr = eventM?.isValid() ? eventM.format("HH:mm:ss") : "—";
  const labelColor = themeColors.secondaryText ?? "#8E8E93";
  const textColor = themeColors.text ?? "#000000";
  const borderColor = themeColors.themeBorderColor ?? themeColors.border ?? "#EEEEEE";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item })}
      style={[styles.tradeFillCard, { borderBottomColor: colors.iconBgColor, backgroundColor: colors.white }]}
    >
      <View style={styles.pairRow}>
        <AppText style={{ color: textColor, fontSize: 17 }} weight={SEMI_BOLD}>{mLabel}</AppText>
        <FastImage source={right_ic} style={{ width: 11, height: 11, marginLeft: 4 }} resizeMode="contain" tintColor={labelColor} />
      </View>
      <AppText weight={MEDIUM} style={{ color: textColor, fontSize: 14, marginBottom: 2 }}>{dateStr} {timeStr}</AppText>
      <AppText style={{ color: sideColor, fontSize: 15, marginBottom: 12 }} weight={SEMI_BOLD}>{side} · {role}</AppText>

      <TradeKvRow label="Date" value={dateStr} labelColor={labelColor} textColor={textColor} />
      <TradeKvRow label="Time" value={timeStr} labelColor={labelColor} textColor={textColor} />
      <TradeKvRow label="Pair" value={mLabel} labelColor={labelColor} textColor={textColor} />
      <TradeKvRow label="Side" value={side} color={sideColor} labelColor={labelColor} textColor={textColor} />
      <TradeKvRow label="Role" value={role} labelColor={labelColor} textColor={textColor} />
      <TradeKvRow label="Price" value={safeToFixed8(item?.price, "—")} labelColor={labelColor} textColor={textColor} />
      <TradeKvRow label="Quantity" value={`${safeToFixed8(item?.quantity, "—")}${baseSym ? ` ${baseSym}` : ""}`} labelColor={labelColor} textColor={textColor} />
    </TouchableOpacity>
  );
});

const TradeHistory = ({ route }) => {
  const dispatch = useDispatch();
  const { isDark, themeColors } = useTheme();
  const memoizedTheme = useMemo(() => themeColors || {}, [themeColors, isDark]);
  const isFocused = useIsFocused();

  const { pastOrders: pastOrdersRedux } = useAppSelector((state) => state.home);
  const { tradeHistory: walletTradeHistory } = useAppSelector((state) => state.wallet);
  const spotSelectedPair = useAppSelector((state) => state.home.spotSelectedPair);

  const [activeTab, setActiveTab] = useState(route?.params?.activeTab ?? 0);
  const pagerX = useRef(new Animated.Value(-activeTab * screenW)).current;

  const [ordersData, setOrdersData] = useState([]);
  const [tradesData, setTradesData] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [tradesPage, setTradesPage] = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [hasMoreTrades, setHasMoreTrades] = useState(true);

  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [showExecutedTrades, setShowExecutedTrades] = useState({});

  const ordersListRef = useRef(null);
  const tradesListRef = useRef(null);
  const limit = 20;

  // Stability for Redux data syncing
  useEffect(() => {
    const next = Array.isArray(pastOrdersRedux) ? pastOrdersRedux : [];
    const currentId = ordersData[0]?._id ?? ordersData[0]?.id;
    const nextId = next[0]?._id ?? next[0]?.id;

    if (next.length !== ordersData.length || nextId !== currentId) {
      console.log("[TradeHistory] Updating ordersData. New Count:", next.length);
      setOrdersData(next);
      setHasMoreOrders(next.length >= limit);
    }
  }, [pastOrdersRedux, ordersData]);

  useEffect(() => {
    const next = Array.isArray(walletTradeHistory) ? walletTradeHistory : [];
    const currentId = tradesData[0]?._id ?? tradesData[0]?.id;
    const nextId = next[0]?._id ?? next[0]?.id;

    if (next.length !== tradesData.length || nextId !== currentId) {
      console.log("[TradeHistory] Updating tradesData. New Count:", next.length);
      setTradesData(next);
      setHasMoreTrades(next.length >= limit);
    }
  }, [walletTradeHistory, tradesData]);

  const fetchOrders = useCallback(async (page = 1, isLoadMore = false) => {
    if (loadingOrders || (isLoadMore && loadingMore)) return;
    if (isLoadMore) setLoadingMore(true); else setLoadingOrders(true);
    try {
      await dispatch(getPastOrders({ page, page_size: limit }, { useGlobalLoader: false }));
    } finally {
      if (isLoadMore) setLoadingMore(false); else setLoadingOrders(false);
    }
  }, [dispatch, loadingOrders, loadingMore]);

  const fetchTrades = useCallback(async (page = 1, isLoadMore = false) => {
    if (loadingTrades || (isLoadMore && loadingMore)) return;
    if (isLoadMore) setLoadingMore(true); else setLoadingTrades(true);
    const skip = (page - 1) * limit;
    console.log("[TradeHistory] fetchTrades calling getTradeHistory skip:", skip);
    try {
      const res = await dispatch(getTradeHistory(skip, limit, "", { useGlobalLoader: false, clearBeforeFetch: false }));
      console.log("[TradeHistory] getTradeHistory response success:", res?.success);
    } finally {
      if (isLoadMore) setLoadingMore(false); else setLoadingTrades(false);
    }
  }, [dispatch, loadingTrades, loadingMore]);

  useEffect(() => {
    if (isFocused) {
      if (ordersData.length === 0) fetchOrders(1);
      if (tradesData.length === 0) fetchTrades(1);
    }
  }, [isFocused]);

  const handleLoadMore = useCallback(() => {
    if (activeTab === 0 && hasMoreOrders && !loadingMore && !loadingOrders) {
      const next = ordersPage + 1;
      setOrdersPage(next);
      fetchOrders(next, true);
    } else if (activeTab === 1 && hasMoreTrades && !loadingMore && !loadingTrades) {
      const next = tradesPage + 1;
      setTradesPage(next);
      fetchTrades(next, true);
    }
  }, [activeTab, hasMoreOrders, hasMoreTrades, loadingMore, loadingOrders, loadingTrades, ordersPage, tradesPage, fetchOrders, fetchTrades]);

  const toggleExpand = useCallback((item) => {
    const id = item._id || item.id || item.order_id;
    setShowExecutedTrades(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const getSideColor = useCallback((side) => {
    const s = String(side).toUpperCase();
    if (s === "BUY") return memoizedTheme?.green ?? "#00c087";
    if (s === "SELL") return memoizedTheme?.red ?? "#ff4b5c";
    return memoizedTheme?.text ?? "#000";
  }, [memoizedTheme]);

  const onCancelPress = useCallback((item) => {
    setOrderToCancel(item);
    setIsCancelModalVisible(true);
  }, []);

  const listKeyExtractor = useCallback((item, index) => {
    const id = item?._id ?? item?.id ?? item?.trade_id;
    return id != null ? String(id) : `row_${index}`;
  }, []);

  const renderOrder = useCallback(({ item }) => (
    <OrderCard
      item={item}
      spotSelectedPair={spotSelectedPair}
      themeColors={memoizedTheme}
      onCancel={onCancelPress}
      showTrades={!!showExecutedTrades?.[item?._id || item?.id || item?.order_id]}
      onToggleExpand={toggleExpand}
      getSideColor={getSideColor}
    />
  ), [spotSelectedPair, memoizedTheme, onCancelPress, showExecutedTrades, toggleExpand, getSideColor]);

  const renderTrade = useCallback(({ item }) => {
    // console.log("[TradeHistory] renderTrade called for:", item?._id || item?.id);
    return (
      <TradeCard
        item={item}
        spotSelectedPair={spotSelectedPair}
        themeColors={memoizedTheme}
        getSideColor={getSideColor}
      />
    );
  }, [spotSelectedPair, memoizedTheme, getSideColor]);

  useEffect(() => {
    Animated.timing(pagerX, {
      toValue: -activeTab * screenW,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  return (
    <AppSafeAreaView style={[styles.container, { backgroundColor: memoizedTheme.background ?? "#FFFFFF" }]}>
      <Toolbar isSecond title={"History"} style={{ width: "58%", backgroundColor: "transparent" }} />

      <View style={[styles.tabBar, { borderBottomColor: memoizedTheme?.themeBorderColor ?? "#EEEEEE" }]}>
        <TouchableOpacity onPress={() => setActiveTab(0)} style={[styles.tab, activeTab === 0 && { borderBottomColor: colors.buttonBg, borderBottomWidth: 2 }]}>
          <AppText weight={SEMI_BOLD} style={[styles.tabText, { color: activeTab === 0 ? (memoizedTheme?.text ?? "#000000") : (memoizedTheme?.secondaryText ?? "#8E8E93"), fontSize: 16 }]}>Orders</AppText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab(1)} style={[styles.tab, activeTab === 1 && { borderBottomColor: colors.buttonBg, borderBottomWidth: 2 }]}>
          <AppText weight={SEMI_BOLD} style={[styles.tabText, { color: activeTab === 1 ? (memoizedTheme?.text ?? "#000000") : (memoizedTheme?.secondaryText ?? "#8E8E93"), fontSize: 16 }]}>Trades</AppText>
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, overflow: "hidden" }}>
        <Animated.View style={{ flex: 1, flexDirection: "row", width: screenW * 2, transform: [{ translateX: pagerX }] }}>
          <View style={{ width: screenW }}>
            {loadingOrders && ordersData.length === 0 ? <TradeHistorySkeleton /> : (
              <FlatList
                data={ordersData}
                renderItem={renderOrder}
                keyExtractor={listKeyExtractor}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                initialNumToRender={6}
                windowSize={5}
                removeClippedSubviews={true}
                contentContainerStyle={styles.ordersListContent}
                ListEmptyComponent={<View style={styles.noDataRow}><FastImage source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT} style={{ width: 80, height: 80 }} resizeMode="contain" /><AppText style={{ marginTop: 10, color: memoizedTheme?.secondaryText }}>No data found</AppText></View>}
              />
            )}
          </View>
          <View style={{ width: screenW }}>
            {loadingTrades && tradesData.length === 0 ? <TradeHistorySkeleton /> : (
              <FlatList
                data={tradesData}
                renderItem={renderTrade}
                keyExtractor={listKeyExtractor}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                initialNumToRender={6}
                windowSize={5}
                removeClippedSubviews={true}
                contentContainerStyle={styles.tradesListContent}
                ListEmptyComponent={<View style={styles.noDataRow}><FastImage source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT} style={{ width: 80, height: 80 }} resizeMode="contain" /><AppText style={{ marginTop: 10, color: memoizedTheme?.secondaryText }}>No data found</AppText></View>}
              />
            )}
          </View>
        </Animated.View>
      </Animated.View>

      <ReactNativeModal isVisible={isCancelModalVisible} onBackdropPress={() => setIsCancelModalVisible(false)} style={{ margin: 0, justifyContent: "flex-end" }}>
        <View style={[styles.modalContent, { backgroundColor: memoizedTheme?.background }]}>
          <AppText style={[styles.modalTitle, { color: memoizedTheme?.text }]} weight={SEMI_BOLD}>Cancel Order?</AppText>
          <AppText style={{ textAlign: "center", color: memoizedTheme?.secondaryText, marginBottom: 24 }}>Are you sure you want to cancel this order?</AppText>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setIsCancelModalVisible(false)}><AppText style={{ color: memoizedTheme?.text }}>No, Keep it</AppText></TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.red, borderColor: colors.red }]}
              onPress={async () => {
                const orderId = orderToCancel?._id || orderToCancel?.id;
                if (!orderId) return;
                setIsCancelLoading(true);
                const res = await dispatch(cancelOrder({ order_id: orderId }));
                setIsCancelLoading(false);
                if (res?.success) {
                  setOrdersData(prev => prev.filter(o => (o._id || o.id) !== orderId));
                  setIsCancelModalVisible(false);
                }
              }}
            >
              {isCancelLoading ? <ActivityIndicator color="#fff" size="small" /> : <AppText style={{ color: "#fff" }}>Yes, Cancel</AppText>}
            </TouchableOpacity>
          </View>
        </View>
      </ReactNativeModal>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  ordersListContent: { paddingHorizontal: 5, paddingBottom: 100 },
  tradesListContent: { paddingHorizontal: 5, paddingBottom: 100 },
  orderSpotCard: { padding: 14, paddingBottom: 0, width: "100%", alignSelf: "center" },
  orderSpotHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  orderSpotTitle: { fontSize: 17, marginRight: 6, fontWeight: "600" },
  execTradesBtnSpot: { alignSelf: "flex-end", paddingVertical: 4, paddingHorizontal: 5, borderWidth: 0.7, borderRadius: 5 },
  execTradesBtnRowSpot: { flexDirection: "row", alignItems: "center" },
  orderHistoryChevronSpot: { width: 10, height: 10, marginTop: 2 },
  execTradesBtnTextSpot: { fontSize: 13, fontWeight: "600" },
  execTradesBoxSpot: { marginTop: 8, backgroundColor: "rgba(128, 128, 128, 0.08)", paddingVertical: 8, paddingHorizontal: 8, borderRadius: 8 },
  execTradeItemSpot: { backgroundColor: "transparent", borderBottomWidth: 1, borderBottomColor: "rgba(128, 128, 128, 0.15)", paddingVertical: 6, paddingHorizontal: 4, marginBottom: 0 },
  execTradeHeaderRowSpot: { marginBottom: 4 },
  execTradeHeaderTextSpot: { fontSize: 13 },
  execTradeKvRowSpot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 1 },
  execTradeKvKSpot: { fontSize: 16, flex: 1 },
  execTradeKvVSpot: { fontSize: 16, flex: 1, textAlign: "right" },
  orderSpotDivider: { height: 1.5, marginTop: 12, marginBottom: 4 },
  tradeFillCard: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1.5 },
  tradeKvRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 },
  tradeKvK: { fontSize: 16, flexShrink: 0, maxWidth: "42%" },
  tradeKvV: { fontSize: 16, fontWeight: "500", flex: 1, textAlign: "right" },
  tabBar: { flexDirection: "row", height: 44, borderBottomWidth: 1 },
  tab: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabText: { fontSize: 16, fontWeight: "600" },
  pairRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingBottom: 16 },
  cancelBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4, borderWidth: 1, borderColor: colors.red },
  noDataRow: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  modalContent: { padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 18, textAlign: "center", marginBottom: 12 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  modalBtn: { flex: 1, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#eee" },
});

export default TradeHistory;
