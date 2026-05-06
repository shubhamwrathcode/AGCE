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
import {
  AppSafeAreaView,
  AppText,
  Toolbar,
  MEDIUM,
} from "../../shared";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import { useAppSelector } from "../../store/hooks";
import FastImage from "react-native-fast-image";
import { NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT, right_ic, downIcon } from "../../helper/ImageAssets";
import { useDispatch } from "react-redux";
import { getPastOrders, cancelOrder } from "../../actions/homeActions";
import { getTradeHistory } from "../../actions/walletActions";
import moment from "moment";
import TradeHistorySkeleton from "./TradeHistorySkeleton";
import { spotOpenOrderMarketLabel, tradeHistoryBaseAsset } from "../../helper/utility";
import NavigationService from "../../navigation/NavigationService";
import { SPOT_ORDER_HISTORY_DETAIL } from "../../navigation/routes";
import { fontFamilyBold } from "../../theme/typography";
import { useRoute } from "@react-navigation/core";
import { useIsFocused } from "@react-navigation/native";

/** Align with web `TradePage` / `TradeHistorySection` — order history & trade fills. */
function safeToFixed8(value, fallback = "0") {
  const parsed = parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) return fallback;
  const s = parsed.toFixed(8).replace(/\.?0+$/, "");
  return s === "" ? "0" : s;
}

function orderHistoryMarketLabel(item) {
  return spotOpenOrderMarketLabel(item, item?.ask_currency, item?.pay_currency);
}

function orderHistoryEventTime(item) {
  return item?.updated_at || item?.updatedAt || item?.created_at || item?.createdAt;
}

function formatOrderHistoryDateTime(item, format) {
  const ts = orderHistoryEventTime(item);
  if (ts == null || ts === "") return "—";
  const m = moment(ts);
  return m.isValid() ? m.format(format) : "—";
}

function orderHistoryQuoteCurrency(item) {
  const lbl = orderHistoryMarketLabel(item);
  const parts = lbl.split("/");
  if (parts.length === 2 && parts[1] && parts[1] !== "---") return parts[1];
  return item?.pay_currency || "";
}

/** Same sources as Spot `pastOrdersNormalized` — fills shown under Executed trades. */
function orderHistoryExecutionsList(inv) {
  const ep = inv?.executed_prices;
  const ex = inv?.executions;
  if (Array.isArray(ep) && ep.length > 0) return ep;
  if (Array.isArray(ex) && ex.length > 0) return ex;
  return [];
}

function orderHistoryTifDisplay(item) {
  const t = item?.time_in_force ?? item?.tif ?? item?.timeInForce;
  if (t == null || String(t).trim() === "") return "—";
  return String(t).toUpperCase();
}

function tradeHistoryRoleLabel(item) {
  if (item?.is_maker === true) return "Maker";
  if (item?.is_maker === false) return "Taker";
  return "—";
}

const TradeHistory = () => {
  const dispatch = useDispatch();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { colors: themeColors, isDark } = useTheme();
  const screenW = Dimensions.get("window").width;

  // 0 = Orders History, 1 = Trade History (Fills)
  const [activeTab, setActiveTab] = useState(route?.params?.activeTab ?? 0);
  const prevTabRef = useRef(activeTab);
  const tabAnimX = useRef(new Animated.Value(0)).current;

  // Data Sources
  const pastOrdersRedux = useAppSelector((state) => state.home.pastOrders) || [];
  const walletTradeHistory = useAppSelector((state) => state.wallet.tradeHistory) || [];
  const spotSelectedPair = useAppSelector((state) => state.home.spotSelectedPair);

  const [ordersData, setOrdersData] = useState([]);
  const [tradesData, setTradesData] = useState([]);

  const [ordersPage, setOrdersPage] = useState(1);
  const [tradesPage, setTradesPage] = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingTrades, setLoadingTrades] = useState(false);
  /** Pagination only — bottom footer spinner (initial load uses `loading` + skeleton). */
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [hasMoreTrades, setHasMoreTrades] = useState(true);
  /** Prevent rapid refetch loops (ms timestamps). */
  const lastOrdersFetchAtRef = useRef(0);
  const lastTradesFetchAtRef = useRef(0);

  // Cancellation state
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [showExecutedTrades, setShowExecutedTrades] = useState({});
  const listRef = useRef(null);

  const limit = 20;

  useEffect(() => {
    const arr = Array.isArray(pastOrdersRedux) ? pastOrdersRedux : [];
    setOrdersData(arr);
    setHasMoreOrders(arr.length >= limit);
  }, [pastOrdersRedux]);

  useEffect(() => {
    const arr = Array.isArray(walletTradeHistory) ? walletTradeHistory : [];
    setTradesData(arr);
    setHasMoreTrades(arr.length >= limit);
  }, [walletTradeHistory]);

  /**
   * Prefetch both tabs on focus (if cache empty).
   * This makes switching Orders ↔ Trades feel instant, regardless of entry point (Spot vs ProfileDrawer).
   */
  useEffect(() => {
    if (!isFocused) return;
    let cancelled = false;

    const now = Date.now();

    const maybeFetchOrders = async () => {
      if (loadingOrders) return;
      if ((pastOrdersRedux?.length ?? 0) > 0) return;
      // Debounce refetches (e.g. quick focus flickers)
      if (now - lastOrdersFetchAtRef.current < 1200) return;
      lastOrdersFetchAtRef.current = now;
      setLoadingOrders(true);
      try {
        await dispatch(getPastOrders({ page: 1, page_size: limit }, { useGlobalLoader: false }));
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    };

    const maybeFetchTrades = async () => {
      if (loadingTrades) return;
      if ((walletTradeHistory?.length ?? 0) > 0) return;
      if (now - lastTradesFetchAtRef.current < 1200) return;
      lastTradesFetchAtRef.current = now;
      setLoadingTrades(true);
      try {
        await dispatch(
          getTradeHistory(0, limit, undefined, {
            useGlobalLoader: false,
            clearBeforeFetch: true,
          }),
        );
      } finally {
        if (!cancelled) setLoadingTrades(false);
      }
    };

    // Fire-and-forget; they update Redux + local lists.
    maybeFetchOrders();
    maybeFetchTrades();

    return () => {
      cancelled = true;
    };
  }, [
    isFocused,
    dispatch,
    limit,
    loadingOrders,
    loadingTrades,
    pastOrdersRedux?.length,
    walletTradeHistory?.length,
  ]);

  const handleLoadMore = useCallback(async () => {
    if ((activeTab === 0 ? loadingOrders : loadingTrades) || loadingMore) return;
    if (activeTab === 0 && !hasMoreOrders) return;
    if (activeTab === 1 && !hasMoreTrades) return;

    setLoadingMore(true);
    try {
      if (activeTab === 0) {
        const next = ordersPage + 1;
        setOrdersPage(next);
        await dispatch(
          getPastOrders({ page: next, page_size: limit }, { useGlobalLoader: false }),
        );
      } else {
        const next = tradesPage + 1;
        setTradesPage(next);
        const skip = (next - 1) * limit;
        await dispatch(
          getTradeHistory(skip, limit, undefined, {
            useGlobalLoader: false,
            clearBeforeFetch: false,
          }),
        );
      }
    } catch (e) {
      console.log("Fetch history error", e);
    } finally {
      setLoadingMore(false);
    }
  }, [
    activeTab,
    loadingOrders,
    loadingTrades,
    loadingMore,
    hasMoreOrders,
    hasMoreTrades,
    ordersPage,
    tradesPage,
    dispatch,
  ]);

  const toggleExpand = useCallback((item) => {
    const id = item._id || item.id || item.order_id;
    setShowExecutedTrades(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  /** Orders tab — includes Executed trades expand section. */
  const renderOrderCard = useCallback(
    ({ item: inv }) => {
      const orderId = inv?._id || inv?.id || inv?.order_id;
      const baseHint =
        spotSelectedPair?.base_currency ?? spotSelectedPair?.base_currency_short_name ?? undefined;
      const quoteHint =
        spotSelectedPair?.quote_currency ?? spotSelectedPair?.quote_currency_short_name ?? undefined;
      const currencyPair = spotOpenOrderMarketLabel(inv, baseHint, quoteHint);
      const side = String(inv?.side || "").toUpperCase();
      const sideColor = side === "BUY" ? themeColors.green : themeColors.red;
      const typeUpper = String(inv?.order_type || inv?.type || inv?.orderType || "Market").toUpperCase();
      const canCancel =
        !!orderId &&
        !["FILLED", "CANCELLED", "CANCELED", "COMPLETED", "EXECUTED", "REJECTED"].includes(
          String(inv?.status || inv?.user_status || "").toUpperCase(),
        );

      const eventTs =
        inv?.updatedAt || inv?.updated_at || inv?.createdAt || inv?.created_at || inv?.date || inv?.timestamp || inv?.time;
      const eventM = eventTs ? moment(eventTs) : null;
      const dateStr = eventM?.isValid() ? eventM.format("DD/MM/YYYY") : "—";
      const timeStr = eventM?.isValid() ? eventM.format("HH:mm:ss") : "—";
      const headerDateTime = eventM?.isValid() ? eventM.format("DD/MM/YYYY HH:mm:ss") : "—";

      const quoteCc = orderHistoryQuoteCurrency(inv);
      const baseSym =
        inv?.ask_currency || inv?.base_currency || (currencyPair.includes("/") ? currencyPair.split("/")[0] : "");

      const priceDisplay =
        String(inv?.order_type || inv?.type || "").toUpperCase() === "MARKET"
          ? "Market"
          : safeToFixed8(inv?.price ?? 0, "—");

      const executions = orderHistoryExecutionsList(inv);
      const hasExecutedTrades = executions.length > 0;
      const showTrades = !!showExecutedTrades?.[orderId];

      const labelColor = themeColors.secondaryText;
      const textColor = themeColors.text;
      const borderDivider = themeColors.themeBorderColor ?? themeColors.border;
      const execBorder = themeColors.themeBorderColor ?? themeColors.border;

      const kv = (label, value, opts = {}) => (
        <View key={label} style={styles.tradeKvRow}>
          <AppText style={[styles.tradeKvK, { color: labelColor }]}>{label}</AppText>
          <AppText style={[styles.tradeKvV, { color: opts.color ?? textColor }]} numberOfLines={3}>
            {value}
          </AppText>
        </View>
      );

      return (
        <View style={[styles.orderSpotCard, { backgroundColor: themeColors.background }]}>
          <View>
            <View style={styles.orderSpotHeaderRow}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item: inv })}
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  <AppText style={[styles.orderSpotTitle, { color: textColor }]} weight={MEDIUM}>
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
                <AppText style={{ color: sideColor, fontSize: 12, marginTop: 4 }} weight={MEDIUM}>
                  {side} · {typeUpper}
                </AppText>
              </View>
            </View>

            {kv("Date", dateStr)}
            {kv("Time", timeStr)}
            {kv("Market", currencyPair)}
            {kv("Side", side, { color: sideColor })}
            {kv("Type", typeUpper)}
            {kv("TIF", orderHistoryTifDisplay(inv))}
            {kv("Price", priceDisplay)}

            {hasExecutedTrades ? (
              <View style={{ marginTop: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.execTradesBtnSpot, { borderColor: execBorder }]}
                  onPress={() => toggleExpand(inv)}
                >
                  <View style={styles.execTradesBtnRowSpot}>
                    <FastImage
                      source={downIcon}
                      tintColor={themeColors.secondaryText}
                      style={[
                        styles.orderHistoryChevronSpot,
                        { transform: [{ rotate: showTrades ? "180deg" : "0deg" }] },
                      ]}
                      resizeMode="contain"
                    />
                    <AppText style={[styles.execTradesBtnTextSpot, { color: textColor }]}> Executed trades</AppText>
                  </View>
                </TouchableOpacity>

                {showTrades ? (
                  <View style={styles.execTradesBoxSpot}>
                    {executions.map((tr, i) => (
                      <View
                        key={`${orderId}_${tr?.trade_id ?? i}`}
                        style={[
                          styles.execTradeItemSpot,
                          i === executions.length - 1 ? { borderBottomWidth: 0, marginBottom: 0 } : null,
                        ]}
                      >
                        <View style={styles.execTradeHeaderRowSpot}>
                          <AppText style={[styles.execTradeHeaderTextSpot, { color: labelColor }]} weight={MEDIUM}>
                            Trade #{i + 1}
                          </AppText>
                        </View>
                        <View style={styles.execTradeKvRowSpot}>
                          <AppText style={[styles.execTradeKvKSpot, { color: labelColor }]}>Price:</AppText>
                          <AppText style={[styles.execTradeKvVSpot, { color: textColor }]}>
                            {safeToFixed8(Number(tr?.price) || 0, "0")} {quoteCc}
                          </AppText>
                        </View>
                        <View style={styles.execTradeKvRowSpot}>
                          <AppText style={[styles.execTradeKvKSpot, { color: labelColor }]}>Executed:</AppText>
                          <AppText style={[styles.execTradeKvVSpot, { color: textColor }]}>
                            {safeToFixed8(Number(tr?.quantity) || 0, "0")} {baseSym}
                          </AppText>
                        </View>
                        <View style={styles.execTradeKvRowSpot}>
                          <AppText style={[styles.execTradeKvKSpot, { color: labelColor }]}>Fee:</AppText>
                          <AppText style={[styles.execTradeKvVSpot, { color: textColor }]}>
                            {safeToFixed8(Number(tr?.fee) || 0, "0")} {quoteCc}
                          </AppText>
                        </View>
                        <View style={styles.execTradeKvRowSpot}>
                          <AppText style={[styles.execTradeKvKSpot, { color: labelColor }]}>Total:</AppText>
                          <AppText style={[styles.execTradeKvVSpot, { color: textColor }]}>
                            {safeToFixed8((Number(tr?.price) || 0) * (Number(tr?.quantity) || 0), "0")}
                          </AppText>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          {canCancel ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.red }]}
                onPress={() => {
                  setOrderToCancel(inv);
                  setIsCancelModalVisible(true);
                }}
              >
                <AppText style={{ color: colors.red, fontWeight: "600", fontSize: 13 }}>Cancel order</AppText>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={[styles.orderSpotDivider, { backgroundColor: borderDivider }]} />
        </View>
      );
    },
    [themeColors, spotSelectedPair, showExecutedTrades, toggleExpand],
  );

  /** Same layout + fields as Spot screen Trade History API preview (`tradeHistorySectionNode`). */
  const renderTradeCard = useCallback(
    ({ item }) => {
      const baseHint =
        spotSelectedPair?.base_currency ?? spotSelectedPair?.base_currency_short_name ?? undefined;
      const quoteHint =
        spotSelectedPair?.quote_currency ?? spotSelectedPair?.quote_currency_short_name ?? undefined;
      const mLabel = spotOpenOrderMarketLabel(item, baseHint, quoteHint);
      const baseSym = tradeHistoryBaseAsset(item, baseHint, quoteHint);
      const side = String(item?.side || "").toUpperCase();
      const role = tradeHistoryRoleLabel(item);
      const sideColor = side === "BUY" ? themeColors.green : themeColors.red;
      const ts = item?.executed_at || item?.executedAt || item?.created_at;
      const m = moment(ts);
      const dateStr = m.isValid() ? m.format("DD/MM/YYYY") : "—";
      const timeStr = m.isValid() ? m.format("HH:mm:ss") : "—";
      const borderColor = themeColors.themeBorderColor ?? themeColors.border;

      const kv = (label, value, opts = {}) => (
        <View key={label} style={styles.tradeKvRow}>
          <AppText style={[styles.tradeKvK, { color: themeColors.secondaryText }]}>{label}</AppText>
          <AppText
            style={[styles.tradeKvV, { color: opts.color ?? themeColors.text }]}
            numberOfLines={3}
          >
            {value}
          </AppText>
        </View>
      );

      return (
        <View style={[styles.tradeFillCard, { borderBottomColor: borderColor, backgroundColor: themeColors.background }]}>
          <View style={styles.pairRow}>
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

          {kv("Date", dateStr)}
          {kv("Time", timeStr)}
          {kv("Pair", mLabel)}
          {kv("Side", side, { color: sideColor })}
          {kv("Role", role)}
          {kv("Price", safeToFixed8(item?.price, "—"))}
          {kv("Quantity", `${safeToFixed8(item?.quantity, "—")}${baseSym ? ` ${baseSym}` : ""}`)}
        </View>
      );
    },
    [themeColors, spotSelectedPair],
  );

  const listForTab = activeTab === 0 ? ordersData : tradesData;
  /** Full skeleton only on first load for the visible tab — not on Orders ↔ Trades switch. */
  const showFullSkeleton =
    (activeTab === 0 ? loadingOrders : loadingTrades) && listForTab.length === 0;

  const listKeyExtractor = useCallback((item, index) => {
    const id = item?._id ?? item?.id ?? item?.trade_id;
    return id != null ? String(id) : `row_${index}`;
  }, []);

  const listFooter = useMemo(() => {
    if (loadingMore && listForTab.length > 0) {
      return (
        <View style={styles.listFooterLoading}>
          <ActivityIndicator size="small" color={themeColors.text} />
          <AppText style={[styles.listFooterLoadingText, { color: themeColors.secondaryText }]}>
            Loading more…
          </AppText>
        </View>
      );
    }
    return <View style={styles.listFooterSpacer} />;
  }, [loadingMore, listForTab.length, themeColors.text, themeColors.secondaryText]);

  const scrollListToTop = useCallback(() => {
    // FlatList ref may be null on first render
    try {
      listRef.current?.scrollToOffset?.({ offset: 0, animated: true });
    } catch (e) {}
  }, []);

  const animateTabSwitch = useCallback(
    (nextTab) => {
      const prev = prevTabRef.current;
      prevTabRef.current = nextTab;
      const dir = nextTab > prev ? 1 : -1; // 0->1 swipe left, 1->0 swipe right
      tabAnimX.setValue(dir * screenW * 0.25);
      Animated.timing(tabAnimX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    },
    [screenW, tabAnimX],
  );

  return (
    <AppSafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Toolbar isSecond title={"History"} style={{ width: "58%", backgroundColor: "transparent" }} />

      <View style={[styles.tabBar, { borderBottomColor: themeColors.themeBorderColor ?? "#eee" }]}>
        <TouchableOpacity
          onPress={() => {
            animateTabSwitch(0);
            setActiveTab(0);
            scrollListToTop();
          }}
          style={[styles.tab, activeTab === 0 && { borderBottomColor: colors.buttonBg, borderBottomWidth: 2 }]}
        >
          <AppText style={[styles.tabText, { color: activeTab === 0 ? themeColors.text : themeColors.secondaryText }]}>Orders</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            animateTabSwitch(1);
            setActiveTab(1);
            scrollListToTop();
          }}
          style={[styles.tab, activeTab === 1 && { borderBottomColor: colors.buttonBg, borderBottomWidth: 2 }]}
        >
          <AppText style={[styles.tabText, { color: activeTab === 1 ? themeColors.text : themeColors.secondaryText }]}>Trades</AppText>
        </TouchableOpacity>
      </View>

      {showFullSkeleton ? (
        <TradeHistorySkeleton />
      ) : (
        <Animated.View style={{ flex: 1, transform: [{ translateX: tabAnimX }] }}>
          <FlatList
            ref={listRef}
            data={listForTab}
            renderItem={activeTab === 0 ? renderOrderCard : renderTradeCard}
            keyExtractor={listKeyExtractor}
            extraData={{ activeTab, loadingMore, showExecutedTrades }}
            removeClippedSubviews={Platform.OS === "android"}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={8}
            updateCellsBatchingPeriod={50}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            contentContainerStyle={activeTab === 1 ? styles.tradesListContent : styles.ordersListContent}
            ListFooterComponent={listFooter}
            ListEmptyComponent={() => (
              <View style={styles.noDataRow}>
                <FastImage source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT} style={{ width: 80, height: 80 }} resizeMode="contain" />
                <AppText style={{ marginTop: 10, color: themeColors.secondaryText }}>No data found</AppText>
              </View>
            )}
          />
        </Animated.View>
      )}

      <ReactNativeModal isVisible={isCancelModalVisible} onBackdropPress={() => setIsCancelModalVisible(false)} style={{ margin: 0, justifyContent: "flex-end" }}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.background }]}>
          <AppText style={[styles.modalTitle, { color: themeColors.text }]} weight={fontFamilyBold}>Cancel Order</AppText>
          <AppText style={{ color: themeColors.secondaryText, textAlign: "center", marginBottom: 20 }}>Are you sure you want to cancel this order?</AppText>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setIsCancelModalVisible(false)}><AppText style={{ color: themeColors.text }}>No</AppText></TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.red }]}
              onPress={async () => {
                if (!orderToCancel) return;
                setIsCancelLoading(true);
                try {
                  await dispatch(cancelOrder({ order_id: orderToCancel._id || orderToCancel.id }));
                  setOrdersData(prev => prev.filter(o => (o._id || o.id) !== (orderToCancel._id || orderToCancel.id)));
                } finally {
                  setIsCancelLoading(false);
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
  ordersListContent: {
    paddingHorizontal: 5,
    paddingBottom: 8,
  },
  tradesListContent: {
    paddingHorizontal: 5,
    paddingBottom: 8,
  },
  orderSpotCard: {
    padding: 14,
    paddingBottom: 0,
    width: "100%",
    alignSelf: "center",
  },
  orderSpotHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  orderSpotTitle: {
    fontSize: 14,
    marginRight: 6,
    fontWeight: "600",
  },
  execTradesBtnSpot: {
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderRadius: 5,
  },
  execTradesBtnRowSpot: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderHistoryChevronSpot: {
    width: 10,
    height: 10,
    marginTop: 2,
  },
  execTradesBtnTextSpot: {
    fontSize: 11,
    fontWeight: "600",
  },
  execTradesBoxSpot: {
    marginTop: 8,
    backgroundColor: "rgba(128, 128, 128, 0.08)",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  execTradeItemSpot: {
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 0,
  },
  execTradeHeaderRowSpot: {
    marginBottom: 4,
  },
  execTradeHeaderTextSpot: {
    fontSize: 11,
  },
  execTradeKvRowSpot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 1,
  },
  execTradeKvKSpot: {
    fontSize: 11,
    flex: 1,
  },
  execTradeKvVSpot: {
    fontSize: 11,
    flex: 1,
    textAlign: "right",
  },
  orderSpotDivider: {
    height: 1,
    marginTop: 12,
    marginBottom: 4,
  },
  tradeFillCard: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  tradeKvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 8,
  },
  tradeKvK: { fontSize: 11, flexShrink: 0, maxWidth: "42%" },
  tradeKvV: { fontSize: 11, fontWeight: "500", flex: 1, textAlign: "right" },
  tabBar: { flexDirection: "row", height: 44, borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabText: { fontSize: 14, fontWeight: "600" },
  pairRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingBottom: 16 },
  cancelBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4, borderWidth: 1, borderColor: colors.red },
  noDataRow: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  modalContent: { padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 18, textAlign: "center", marginBottom: 12 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  modalBtn: { flex: 1, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#eee" },
  listFooterLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  listFooterLoadingText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 10,
  },
  listFooterSpacer: {
    height: 48,
  },
});

export default TradeHistory;
