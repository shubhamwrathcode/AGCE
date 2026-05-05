import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
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
import { NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT, right_ic } from "../../helper/ImageAssets";
import { useDispatch } from "react-redux";
import { getPastOrders, cancelOrder } from "../../actions/homeActions";
import { getTradeHistory } from "../../actions/walletActions";
import moment from "moment";
import TradeHistorySkeleton from "./TradeHistorySkeleton";
import { toFixedEight } from "../../helper/utility";
import NavigationService from "../../navigation/NavigationService";
import { SPOT_ORDER_HISTORY_DETAIL } from "../../navigation/routes";
import { fontFamilyBold } from "../../theme/typography";
import { appOperation } from "../../appOperation";

const TradeHistory = () => {
  const dispatch = useDispatch();
  const { colors: themeColors, isDark } = useTheme();

  // Sync with exactly the same Redux state as Spot.jsx
  const pastOrdersRedux = useAppSelector((state) => state.home.pastOrders) || [];
  const walletTradeHistory = useAppSelector((state) => state.wallet.tradeHistory) || [];

  const [tradeHistory, setTradeHistory] = useState([]);
  const [allTrades, setAllTrades] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [showExecutedTrades, setShowExecutedTrades] = useState({});
  const limit = 50;

  // Initial Fetch - Exactly like Spot.jsx but without pair filter
  useEffect(() => {
    fetchData(1, true);
  }, []);

  // Synchronize local state with Redux (Crucial for parity with Spot.jsx)
  useEffect(() => {
    if (Array.isArray(pastOrdersRedux)) {
      setTradeHistory(prev => {
        if (isInitialLoad) {
          setIsInitialLoad(false);
          return pastOrdersRedux;
        }
        // Merge without duplicates
        const existingIds = new Set(prev.map(o => o._id || o.id || o.order_id));
        const newItems = pastOrdersRedux.filter(o => !existingIds.has(o._id || o.id || o.order_id));
        if (newItems.length === 0) return prev;
        return [...prev, ...newItems];
      });
      if (pastOrdersRedux.length < limit && !isInitialLoad) setHasMore(false);
    }
    setLoading(false);
  }, [pastOrdersRedux]);

  const fetchData = async (currentPage, isInitial = false) => {
    if (loading || (!hasMore && !isInitial)) return;
    setLoading(true);
    try {
      // 1. Fetch Orders
      dispatch(getPastOrders({ page: currentPage, page_size: limit }));

      // 2. Fetch Global Trades from the specialized transaction API
      const tradeRes = await appOperation.customer.trade_history({ page: currentPage, limit: 100 });
      const globalTrades = tradeRes?.data?.items || tradeRes?.data || [];
      if (Array.isArray(globalTrades)) {
        setAllTrades(prev => {
          const existingIds = new Set(prev.map(t => t._id || t.id || t.trade_id));
          const newTrades = globalTrades.filter(t => !existingIds.has(t._id || t.id || t.trade_id));
          return [...prev, ...newTrades];
        });
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

  const KVRow = useMemo(() => ({ label, value, valueColor, fontSize = 12 }) => {
    const textColor = themeColors.text;
    const labelColor = themeColors.secondaryText;
    return (
      <View style={styles.kvRow}>
        <AppText style={[styles.kvK, { color: labelColor, fontSize }]}>{label}</AppText>
        <AppText style={[styles.kvV, { color: valueColor || textColor, fontSize }]}>{value}</AppText>
      </View>
    );
  }, [themeColors]);

  const toggleExpand = useCallback(async (inv) => {
    const orderId = inv?._id || inv?.order_id || inv?.id || "";
    const isExpanding = !showExecutedTrades[orderId];

    setShowExecutedTrades(prev => ({ ...prev, [orderId]: isExpanding }));

    if (isExpanding) {
      const embeddedTrades = inv?.executed_prices || inv?.executions || inv?.trades || [];
      if (embeddedTrades.length === 0 && inv?.pair) {
        try {
          const res = await appOperation.customer.past_orders({ page: 1, page_size: 50, pair: inv.pair });
          const items = res?.data?.items || res?.data || [];
          const updatedOrder = items.find(o => String(o._id || o.id || o.order_id) === String(orderId));

          if (updatedOrder && (Array.isArray(updatedOrder.executed_prices) || Array.isArray(updatedOrder.executions) || Array.isArray(updatedOrder.trades))) {
            setTradeHistory(prev => prev.map(o =>
              String(o._id || o.id || o.order_id) === String(orderId) ? updatedOrder : o
            ));
          }
        } catch (e) {
        }
      }
    }
  }, [showExecutedTrades, dispatch]);

  const renderCard = useCallback(({ item: inv }) => {
    const orderId = inv?._id || inv?.order_id || inv?.id || "";
    let baseSym = inv?.ask_currency || inv?.base_currency || "";
    let quoteSym = inv?.pay_currency || inv?.quote_currency || "";
    let currencyPair = (baseSym && quoteSym) ? `${baseSym}/${quoteSym}` : (inv?.pair || "---");

    // Symbol and Pair reconstruction if missing
    if (currencyPair !== "---") {
      if (!currencyPair.includes("/")) {
        const quotes = ["USDT", "BTC", "ETH", "INR", "BNB"];
        for (const q of quotes) {
          if (currencyPair.toUpperCase().endsWith(q)) {
            const base = currencyPair.toUpperCase().replace(q, "");
            baseSym = baseSym || base;
            quoteSym = quoteSym || q;
            currencyPair = `${base}/${q}`;
            break;
          }
        }
      } else {
        const parts = currencyPair.split("/");
        baseSym = baseSym || parts[0];
        quoteSym = quoteSym || parts[1];
      }
    }

    const qty = Number(inv?.quantity ?? inv?.filled ?? 0) || 0;
    const filled = Number(inv?.filled_quantity || inv?.filled || 0);
    const price = Number(inv?.price) || 0;
    const side = String(inv?.side || "").toUpperCase();
    const type = String(inv?.order_type || inv?.type || "MARKET").toUpperCase();

    const d = inv?.updatedAt || inv?.updated_at || inv?.createdAt || inv?.created_at;
    const dateStr = d ? moment(d).format("DD/MM/YYYY") : "---";
    const timeStr = d ? moment(d).format("HH:mm:ss") : "---";

    const textColor = themeColors.text;
    const labelColor = themeColors.secondaryText;
    const sideColor = side === "BUY" ? colors.green : colors.red;

    // --- Data Source Merger (API + Wallet History + Local Cache) ---
    const embeddedTrades = inv?.executed_prices || inv?.executions || inv?.trades || [];
    const combinedGlobalTrades = [...walletTradeHistory, ...allTrades];
    const walletTrades = combinedGlobalTrades.filter(t =>
      String(t.order_id || t.orderId || t.parent_order_id) === String(orderId)
    );

    const tradesList = embeddedTrades.length > 0 ? embeddedTrades : walletTrades;
    const hasExecutedTrades = filled > 0 || tradesList.length > 0;
    const isExpanded = !!showExecutedTrades[orderId];
    const canCancel = !!orderId && !["FILLED", "CANCELLED", "CANCELED", "COMPLETED", "EXECUTED", "REJECTED"].includes(String(inv?.status || "").toUpperCase());

    return (
      <View style={[styles.card, { backgroundColor: themeColors.background }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item: inv })}
        >
          <View style={styles.topHeader}>
            <View style={styles.pairRow}>
              <AppText style={[styles.pairTitle, { color: textColor, fontSize: 16 }]} weight={MEDIUM}>{currencyPair}</AppText>
              <FastImage source={right_ic} style={styles.chevron} resizeMode="contain" tintColor={labelColor} />
            </View>
          </View>
          
          <AppText style={{ color: labelColor, fontSize: 12, marginBottom: 2 }}>{dateStr} {timeStr}</AppText>
          
          <AppText style={{ color: sideColor, fontSize: 13, marginBottom: 8, fontWeight: "600" }}>
            {side} · {type}
          </AppText>

          {/* Screenshot-matched KV Rows */}
          <KVRow label="Date" value={dateStr} />
          <KVRow label="Time" value={timeStr} />
          <KVRow label="Market" value={currencyPair} />
          <KVRow label="Side" value={side} valueColor={sideColor} />
          <KVRow label="Type" value={type} />
          <KVRow label="TIF" value={inv?.time_in_force || inv?.tif || "GTC"} />
          <KVRow label="Price" value={toFixedEight(price)} />
        </TouchableOpacity>

        {hasExecutedTrades && (
          <View style={styles.cardFooter}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.executedBtn, { backgroundColor: isDark ? "#2A2E33" : "#F5F5F5", borderColor: themeColors.border }]}
              onPress={() => toggleExpand(inv)}
            >
              <View style={styles.executedBtnContent}>
                <View style={[styles.triangleDown, { transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }]} />
                <AppText style={[styles.executedBtnText, { color: textColor }]}>Executed trades</AppText>
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View style={[styles.execTradesBox, { backgroundColor: "rgba(128, 128, 128, 0.08)", borderColor: themeColors.border }]}>
                {tradesList.length > 0 ? (
                  tradesList?.map((tr, i) => (
                    <View key={`${orderId}_${tr?.trade_id ?? i}`} style={styles.execTradeItem}>
                      <View style={{ marginBottom: 6 }}>
                        <AppText style={{ fontSize: 11, color: labelColor }} weight={MEDIUM}>Trade #{i + 1}</AppText>
                      </View>
                      <View style={styles.execRow}><AppText style={styles.execK}>Price:</AppText><AppText style={styles.execV}>{toFixedEight(Number(tr?.price || tr?.execution_price) || 0)} {quoteSym || "---"}</AppText></View>
                      <View style={styles.execRow}><AppText style={styles.execK}>Executed:</AppText><AppText style={styles.execV}>{toFixedEight(Number(tr?.quantity || tr?.filled_quantity || tr?.filled) || 0)} {baseSym || "---"}</AppText></View>
                      <View style={styles.execRow}><AppText style={styles.execK}>Fee:</AppText><AppText style={styles.execV}>{toFixedEight(Number(tr?.fee || tr?.total_fee) || 0)} {quoteSym || "---"}</AppText></View>
                      <View style={styles.execRow}><AppText style={styles.execK}>Total:</AppText><AppText style={styles.execV}>{toFixedEight((Number(tr?.price || tr?.execution_price) || 0) * (Number(tr?.quantity || tr?.filled_quantity || tr?.filled) || 0))}</AppText></View>
                      {i < tradesList.length - 1 && <View style={[styles.itemDivider, { backgroundColor: themeColors.border }]} />}
                    </View>
                  ))
                ) : (
                  <AppText style={{ fontSize: 11, color: labelColor, textAlign: "center", paddingVertical: 10 }}>No detailed trades found</AppText>
                )}
              </View>
            )}
          </View>
        )
        }

        {canCancel && (
          <View style={styles.actionRow}>
            <AppText style={[styles.kvK, { color: labelColor }]}>Action:</AppText>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setOrderToCancel(inv);
                setIsCancelModalVisible(true);
              }}
            >
              <AppText style={{ color: colors.red, fontWeight: "600", fontSize: 13 }}>Cancel</AppText>
            </TouchableOpacity>
          </View>
        )}
        <View style={[styles.cardDivider, { backgroundColor: themeColors.border }]} />
      </View >
    );
  }, [themeColors, KVRow, isDark, showExecutedTrades, walletTradeHistory, toggleExpand]);

  return (
    <AppSafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Toolbar isSecond title={"Spot Orders History"} style={{ width: "70%", backgroundColor: "transparent" }} />
      {isInitialLoad ? (
        <TradeHistorySkeleton />
      ) : (
        <FlatList
          data={tradeHistory}
          renderItem={renderCard}
          keyExtractor={(item) => item._id || item.id || item.order_id || Math.random().toString()}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => loading ? <ActivityIndicator size="large" color="#000" style={{ marginVertical: 20 }} /> : <View style={{ height: 60 }} />}
          ListEmptyComponent={() => (
            <View style={styles.noDataRow}>
              <FastImage source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT} style={{ width: 80, height: 80 }} resizeMode="contain" />
            </View>
          )}
        />
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
                  setTradeHistory(prev => prev.filter(o => (o._id || o.id) !== (orderToCancel._id || orderToCancel.id)));
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
  card: { padding: 12, paddingBottom: 0 },
  topHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  pairRow: { flexDirection: "row", alignItems: "center" },
  pairTitle: { fontSize: 16, fontWeight: "600", marginRight: 6 },
  chevron: { width: 12, height: 12 },
  kvRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  kvK: { fontSize: 12 },
  kvV: { fontSize: 12, fontWeight: "500" },
  cardFooter: { marginTop: 12 },
  executedBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, alignSelf: "flex-end" },
  executedBtnContent: { flexDirection: "row", alignItems: "center" },
  triangleDown: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 6, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#999", marginRight: 8 },
  executedBtnText: { fontSize: 12, fontWeight: "600" },
  execTradesBox: { marginTop: 10, padding: 12, borderRadius: 8, borderWidth: 1 },
  execTradeItem: { marginBottom: 10 },
  execRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  execK: { fontSize: 11, color: "#999" },
  execV: { fontSize: 11, fontWeight: "500" },
  itemDivider: { height: 1, marginVertical: 8 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingBottom: 16 },
  cancelBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4, borderWidth: 1, borderColor: colors.red },
  cardDivider: { height: 1, marginTop: 10 },
  noDataRow: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  modalContent: { padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 18, textAlign: "center", marginBottom: 12 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  modalBtn: { flex: 1, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#eee" },
});

export default TradeHistory;
