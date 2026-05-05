import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
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
import { getPastOrders } from "../../actions/homeActions";
import moment from "moment";
import TradeHistorySkeleton from "./TradeHistorySkeleton";
import { toFixedEight } from "../../helper/utility";
import NavigationService from "../../navigation/NavigationService";
import { SPOT_ORDER_HISTORY_DETAIL } from "../../navigation/routes";
import { fontFamilyBold, fontFamilySemiBold } from "../../theme/typography";
import { cancelOrder } from "../../actions/homeActions";

const TradeHistory = () => {
  const dispatch = useDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const tradeHistoryRedux = useAppSelector((state) => state.home.pastOrders);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const limit = 10;

  useEffect(() => {
    setSkip(0);
    setHasMore(true);
    setTradeHistory([]);
    setIsInitialLoad(true);
    loadMoreData(0, true);
  }, []);

  useEffect(() => {
    if (tradeHistoryRedux == null) return;
    if (isInitialLoad) {
      setTradeHistory(tradeHistoryRedux);
      setIsInitialLoad(false);
    } else {
      // Append only if it's a new page (pagination)
      setTradeHistory(prev => [...prev, ...tradeHistoryRedux]);
    }
    if (tradeHistoryRedux.length < limit) setHasMore(false);
    setLoading(false);
  }, [tradeHistoryRedux]);

  const loadMoreData = (currentSkip, isInitial = false) => {
    if (loading || (!hasMore && !isInitial)) return;
    setLoading(true);
    setSkip(currentSkip);
    dispatch(getPastOrders({ skip: currentSkip, limit }));
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    if (isCloseToBottom && hasMore && !loading) {
      const nextSkip = skip + limit;
      loadMoreData(nextSkip);
    }
  };

  const getStatusColor = (status = "") => {
    const s = String(status).toUpperCase().trim();
    if (s === "FILLED" || s === "COMPLETED" || s === "EXECUTED") return colors.green;
    if (s === "REJECTED" || s === "CANCELLED" || s === "CANCELED") return colors.red;
    if (s === "PARTIAL") return colors.amber;
    if (s === "OPEN" || s === "PENDING") return colors.lightYellow || "#EAB308";
    return themeColors.secondaryText;
  };

  const getStatusLabel = (s = "") => {
    const statusUpper = s.toUpperCase().trim();
    if (statusUpper === "FILLED") return "Filled";
    if (statusUpper === "CANCELLED" || statusUpper === "CANCELED") return "Cancelled";
    if (statusUpper === "REJECTED") return "Rejected";
    if (statusUpper === "PARTIAL") return "Partial";
    if (statusUpper === "OPEN") return "Open";
    if (statusUpper === "PENDING") return "Pending";
    return s || "---";
  };

  const renderCard = (inv, idx) => {
    const baseSym = inv?.ask_currency || inv?.base_currency || "";
    const quoteSym = inv?.pay_currency || inv?.quote_currency || "";
    let currencyPair = (baseSym && quoteSym) ? `${baseSym}/${quoteSym}` : (inv?.pair || "---");

    if (currencyPair !== "---" && !currencyPair.includes("/")) {
      const quotes = ["USDT", "BTC", "ETH", "INR", "BNB"];
      for (const q of quotes) {
        if (currencyPair.endsWith(q)) {
          currencyPair = currencyPair.replace(q, `/${q}`);
          break;
        }
      }
    }

    const qty = Number(inv?.quantity ?? inv?.filled ?? 0) || 0;
    const filled = Number(inv?.filled_quantity ?? inv?.filled ?? 0);
    const remaining = Number(inv?.remaining_quantity ?? inv?.remaining ?? Math.max(0, qty - filled));
    const price = Number(inv?.price) || 0;
    const avgPrice = Number(inv?.avg_execution_price ?? inv?.avgPrice ?? inv?.average_price ?? price) || 0;
    const value = Number(inv?.executed_value ?? inv?.executedValue ?? (avgPrice * filled));
    const side = String(inv?.side || "").toUpperCase();
    const type = String(inv?.order_type || inv?.type || "MARKET").toUpperCase();
    const statusRaw = inv?.status || "";

    const d = inv?.updatedAt || inv?.updated_at || inv?.createdAt || inv?.created_at;
    const dateStr = d ? moment(d).format("DD/MM/YYYY") : "---";
    const timeStr = d ? moment(d).format("HH:mm:ss") : "---";

    const textColor = themeColors.text;
    const labelColor = themeColors.secondaryText;
    const canCancel = !!(inv?._id || inv?.id) && !["FILLED", "CANCELLED", "CANCELED", "COMPLETED", "EXECUTED", "REJECTED"].includes(String(statusRaw).toUpperCase());

    const KVRow = ({ label, value, valueColor }) => (
      <View style={styles.kvRow}>
        <AppText style={[styles.kvK, { color: labelColor }]}>{label}</AppText>
        <AppText style={[styles.kvV, { color: valueColor || textColor }]}>{value}</AppText>
      </View>
    );

    return (
      <View key={idx} style={[styles.card, { backgroundColor: themeColors.background }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item: inv })}
        >
          <View style={styles.topHeader}>
            <View style={styles.pairRow}>
              <AppText style={[styles.pairTitle, { color: textColor }]} weight={MEDIUM}>{currencyPair}</AppText>
              <FastImage source={right_ic} style={styles.chevron} resizeMode="contain" tintColor={labelColor} />
            </View>
            <AppText style={{ color: labelColor, fontSize: 11, marginTop: 2 }}>{dateStr} {timeStr}</AppText>
          </View>

          <AppText style={{ color: side === "BUY" ? colors.green : colors.red, fontSize: 12, marginBottom: 8 }} weight={MEDIUM}>
            {type} / {side}
          </AppText>

          <KVRow label="Amount:" value={`${toFixedEight(filled)} / ${toFixedEight(qty)}`} />
          <KVRow label="Avg. / Price:" value={`${toFixedEight(avgPrice)} / ${toFixedEight(price)}`} />
          <KVRow label="Status:" value={getStatusLabel(statusRaw)} valueColor={getStatusColor(statusRaw)} />
        </TouchableOpacity>

        {canCancel && (
          <View style={[styles.actionRow, { marginTop: 4 }]}>
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
      </View>
    );
  };

  return (
    <AppSafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Toolbar isSecond title={"Spot Orders History"} style={{ width: "65%", backgroundColor: "transparent" }} />

      {(tradeHistoryRedux == null && isInitialLoad) ? (
        <TradeHistorySkeleton />
      ) : tradeHistory?.length > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={400}
        >
          {tradeHistory.map((inv, idx) => renderCard(inv, idx))}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.buttonBg || "#007AFF"} />
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.noDataRow}>
          <FastImage
            source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
            resizeMode="contain"
            style={{ width: 80, height: 80 }}
          />
        </View>
      )}

      <ReactNativeModal
        isVisible={isCancelModalVisible}
        animationIn="zoomIn"
        animationOut="zoomOut"
        backdropOpacity={0.5}
        onBackdropPress={() => setIsCancelModalVisible(false)}
        onBackButtonPress={() => setIsCancelModalVisible(false)}
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <View style={[styles.modalContent, { backgroundColor: themeColors.themeElevationColor, borderColor: themeColors.border }]}>
          <AppText style={[styles.modalTitle, { color: themeColors.text }]}>Cancel Order</AppText>
          <AppText style={[styles.modalSub, { color: themeColors.secondaryText }]}>Are you sure you want to cancel this order?</AppText>
          <View style={{ flexDirection: "row", width: "100%", gap: 10 }}>
            <TouchableOpacity onPress={() => setIsCancelModalVisible(false)} style={[styles.modalBtn, { borderColor: themeColors.themeBorderColor }]}>
              <AppText style={{ fontSize: 14, fontWeight: "600", color: themeColors.text }}>No, Keep</AppText>
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
                }
              }}
              style={[styles.modalBtn, { backgroundColor: colors.red, borderWeight: 0 }]}
            >
              {isCancelLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <AppText style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>Yes, Cancel</AppText>}
            </TouchableOpacity>
          </View>
        </View>
      </ReactNativeModal>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
  },
  cardDivider: {
    height: 1,
    marginTop: 18,
    opacity: 0.3,
  },
  topHeader: {
    marginBottom: 12,
  },
  pairRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pairTitle: {
    fontSize: 14,
    marginRight: 6,
  },
  chevron: {
    width: 12,
    height: 12,
  },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  kvK: {
    fontSize: 11,
    flex: 1,
  },
  kvV: {
    fontSize: 11,
    flex: 1,
    textAlign: "right",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.red,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  loadingContainer: { paddingVertical: 20, alignItems: "center" },
  noDataRow: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  modalContent: {
    borderRadius: 20,
    padding: 25,
    width: Dimensions.get("window").width * 0.85,
    alignItems: "center",
    borderWidth: 1,
  },
  modalTitle: { fontSize: 20, fontFamily: fontFamilyBold, marginBottom: 15 },
  modalSub: { fontSize: 15, textAlign: "center", marginBottom: 25, lineHeight: 22 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});

export default TradeHistory;
