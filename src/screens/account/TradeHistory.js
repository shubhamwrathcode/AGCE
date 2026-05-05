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
import { toFixedEight, spotOpenOrderMarketLabel, tradeHistoryBaseAsset } from "../../helper/utility";
import NavigationService from "../../navigation/NavigationService";
import { SPOT_ORDER_HISTORY_DETAIL } from "../../navigation/routes";
import { fontFamilyBold } from "../../theme/typography";
import { useRoute } from "@react-navigation/core";

const TradeHistory = () => {
  const dispatch = useDispatch();
  const route = useRoute();
  const { colors: themeColors, isDark } = useTheme();

  // 0 = Orders History, 1 = Trade History (Fills)
  const [activeTab, setActiveTab] = useState(route?.params?.activeTab ?? 0);

  // Data Sources
  const pastOrdersRedux = useAppSelector((state) => state.home.pastOrders) || [];
  const walletTradeHistory = useAppSelector((state) => state.wallet.tradeHistory) || [];

  const [ordersData, setOrdersData] = useState([]);
  const [tradesData, setTradesData] = useState([]);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Cancellation state
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [showExecutedTrades, setShowExecutedTrades] = useState({});

  const limit = 20;

  useEffect(() => {
    fetchData(1, true);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 0 && Array.isArray(pastOrdersRedux)) {
      setOrdersData(prev => {
        if (isInitialLoad) { setIsInitialLoad(false); return pastOrdersRedux; }
        const existingIds = new Set(prev.map(o => o._id || o.id || o.order_id));
        const newItems = pastOrdersRedux.filter(o => !existingIds.has(o._id || o.id || o.order_id));
        return newItems.length === 0 ? prev : [...prev, ...newItems];
      });
      if (pastOrdersRedux.length < limit && !isInitialLoad) setHasMore(false);
    } else if (activeTab === 1 && Array.isArray(walletTradeHistory)) {
      setTradesData(prev => {
        if (isInitialLoad) { setIsInitialLoad(false); return walletTradeHistory; }
        const existingIds = new Set(prev.map(t => t._id || t.id || t.trade_id));
        const newItems = walletTradeHistory.filter(t => !existingIds.has(t._id || t.id || t.trade_id));
        return newItems.length === 0 ? prev : [...prev, ...newItems];
      });
      if (walletTradeHistory.length < limit && !isInitialLoad) setHasMore(false);
    }
    setLoading(false);
  }, [pastOrdersRedux, walletTradeHistory, activeTab]);

  const fetchData = async (currentPage, isInitial = false) => {
    if (loading || (!hasMore && !isInitial)) return;
    setLoading(true);
    try {
      if (activeTab === 0) {
        await dispatch(getPastOrders({ page: currentPage, page_size: limit }));
      } else {
        // walletActions.ts expects (skip, limit, pair)
        const skip = (currentPage - 1) * limit;
        await dispatch(getTradeHistory(skip, limit));
      }
    } catch (e) {
      console.log("Fetch history error", e);
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

  const toggleExpand = useCallback((item) => {
    const id = item._id || item.id || item.order_id;
    setShowExecutedTrades(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const renderOrderCard = useCallback(({ item: inv }) => {
    const orderId = inv?._id || inv?.id || inv?.order_id;
    let currencyPair = inv?.pair || inv?.symbol || "---/---";
    const side = String(inv?.side || "").toUpperCase();
    const type = String(inv?.order_type || inv?.type || "MARKET").toUpperCase();
    const sideColor = side === "BUY" ? colors.green : colors.red;
    const d = inv?.updatedAt || inv?.updated_at || inv?.createdAt || inv?.created_at;
    const dateStr = d ? moment(d).format("DD/MM/YYYY") : "---";
    const timeStr = d ? moment(d).format("HH:mm:ss") : "---";
    const canCancel = !!orderId && !["FILLED", "CANCELLED", "CANCELED", "COMPLETED", "EXECUTED", "REJECTED"].includes(String(inv?.status || "").toUpperCase());

    return (
      <View style={[styles.card, { backgroundColor: themeColors.background }]}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item: inv })}>
          <View style={styles.topHeader}>
            <View style={styles.pairRow}>
              <AppText style={[styles.pairTitle, { color: themeColors.text }]} weight={MEDIUM}>{currencyPair}</AppText>
              <FastImage source={right_ic} style={styles.chevron} resizeMode="contain" tintColor={themeColors.secondaryText} />
            </View>
          </View>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 12, marginBottom: 2 }}>{dateStr} {timeStr}</AppText>
          <AppText style={{ color: sideColor, fontSize: 13, marginBottom: 8, fontWeight: "600" }}>{side} · {type}</AppText>
          <View style={styles.kvRow}><AppText style={styles.kvK}>Price</AppText><AppText style={styles.kvV}>{toFixedEight(inv?.price)}</AppText></View>
          <View style={styles.kvRow}><AppText style={styles.kvK}>Quantity</AppText><AppText style={styles.kvV}>{toFixedEight(inv?.quantity)}</AppText></View>
          <View style={styles.kvRow}><AppText style={styles.kvK}>Status</AppText><AppText style={[styles.kvV, { color: themeColors.text }]}>{inv?.status}</AppText></View>
        </TouchableOpacity>
        {canCancel && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setOrderToCancel(inv); setIsCancelModalVisible(true); }}>
              <AppText style={{ color: colors.red, fontWeight: "600", fontSize: 13 }}>Cancel</AppText>
            </TouchableOpacity>
          </View>
        )}
        <View style={[styles.cardDivider, { backgroundColor: themeColors.border }]} />
      </View>
    );
  }, [themeColors]);

  const renderTradeCard = useCallback(({ item }) => {
    const mLabel = spotOpenOrderMarketLabel(item);
    const baseSym = tradeHistoryBaseAsset(item);
    const side = String(item?.side || "").toUpperCase();
    const role = item?.is_maker === true ? "Maker" : item?.is_maker === false ? "Taker" : "—";
    const sideColor = side === "BUY" ? colors.green : colors.red;
    const ts = item?.executed_at || item?.executedAt || item?.created_at;
    const m = moment(ts);
    const dateStr = m.isValid() ? m.format("DD/MM/YYYY") : "—";
    const timeStr = m.isValid() ? m.format("HH:mm:ss") : "—";

    return (
      <View style={[styles.card, { borderBottomWidth: 1, borderBottomColor: themeColors.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
          <AppText style={{ color: themeColors.text, fontSize: 14 }} weight={MEDIUM}>{mLabel}</AppText>
          <FastImage source={right_ic} style={{ width: 11, height: 11, marginLeft: 4 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
        </View>
        <AppText style={{ color: themeColors.secondaryText, fontSize: 12, marginBottom: 2 }}>{dateStr} {timeStr}</AppText>
        <AppText style={{ color: sideColor, fontSize: 13, marginBottom: 12 }} weight={MEDIUM}>{side} · {role}</AppText>
        <View style={styles.kvRow}><AppText style={styles.kvK}>Price</AppText><AppText style={styles.kvV}>{toFixedEight(item?.price)}</AppText></View>
        <View style={styles.kvRow}><AppText style={styles.kvK}>Quantity</AppText><AppText style={styles.kvV}>{toFixedEight(item?.quantity)} {baseSym}</AppText></View>
      </View>
    );
  }, [themeColors]);

  return (
    <AppSafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Toolbar isSecond title={"History"} style={{ width: "58%", backgroundColor: "transparent" }} />

      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => { setActiveTab(0); setIsInitialLoad(true); setPage(1); setHasMore(true); }} style={[styles.tab, activeTab === 0 && { borderBottomColor: colors.buttonBg, borderBottomWidth: 2 }]}>
          <AppText style={[styles.tabText, { color: activeTab === 0 ? themeColors.text : themeColors.secondaryText }]}>Orders</AppText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setActiveTab(1); setIsInitialLoad(true); setPage(1); setHasMore(true); }} style={[styles.tab, activeTab === 1 && { borderBottomColor: colors.buttonBg, borderBottomWidth: 2 }]}>
          <AppText style={[styles.tabText, { color: activeTab === 1 ? themeColors.text : themeColors.secondaryText }]}>Trades</AppText>
        </TouchableOpacity>
      </View>

      {isInitialLoad ? (
        <TradeHistorySkeleton />
      ) : (
        <FlatList
          data={activeTab === 0 ? ordersData : tradesData}
          renderItem={activeTab === 0 ? renderOrderCard : renderTradeCard}
          keyExtractor={(item, index) => item?._id || item?.id || item?.trade_id || String(index)}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => loading ? <ActivityIndicator size="large" color={themeColors.text} style={{ marginVertical: 20 }} /> : <View style={{ height: 60 }} />}
          ListEmptyComponent={() => (
            <View style={styles.noDataRow}>
              <FastImage source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT} style={{ width: 80, height: 80 }} resizeMode="contain" />
              <AppText style={{ marginTop: 10, color: themeColors.secondaryText }}>No data found</AppText>
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
  tabBar: { flexDirection: "row", height: 44, borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabText: { fontSize: 14, fontWeight: "600" },
  card: { padding: 12, paddingBottom: 12 },
  topHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  pairRow: { flexDirection: "row", alignItems: "center" },
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
