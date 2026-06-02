import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { showMessage } from "react-native-flash-message";
import FastImage from "react-native-fast-image";
import moment from "moment";
import { useSelector } from "react-redux";
import NavigationService from "../../navigation/NavigationService";
import { SPOT_ORDER_HISTORY_DETAIL } from "../../navigation/routes";
import CustomDropdown from "../../shared/components/CustomDropdown";
import { AppText, BOLD, MEDIUM, SEMI_BOLD, FIFTEEN, FOURTEEN, THIRTEEN, TWELVE } from "../../shared";
import { colors } from "../../theme/colors";
import {
  NO_NOTIFICATION_ICON,
  NO_NOTIFICATION_ICON_LIGHT,
  right_ic,
  downIcon,
} from "../../helper/ImageAssets";
import { appOperation } from "../../appOperation";
import { CUSTOMER_TYPE } from "../../appOperation/types";

const TABS = [
  { id: "size", label: "Size" },
  { id: "positionHistory", label: "Position History" },
  { id: "positions", label: "Open Orders" },
  { id: "orderHistory", label: "Order History" },
  { id: "tradeHistory", label: "Trade History" },
  { id: "loanManagement", label: "Loan Management" },
  { id: "assetHistory", label: "Asset History" },
];

const AH_SUB_TABS = [
  { id: "borrow", label: "Borrow" },
  { id: "repay", label: "Repay" },
  { id: "interest", label: "Interest" },
  { id: "transfer", label: "Transfer" },
];

const parseNum = (val) => {
  if (val && val.$numberDecimal != null) return parseFloat(val.$numberDecimal);
  return parseFloat(val);
};

const toFixedEight = (val) => {
  const n = parseNum(val);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(8).replace(/\.?0+$/, "") || "0";
};

const aggregateExecutedLegs = (rawExecutions) => {
  if (!Array.isArray(rawExecutions) || rawExecutions.length === 0) return [];

  const unwrapDecimal = (v) => {
    if (v != null && typeof v === "object" && v.$numberDecimal != null) return v.$numberDecimal;
    return v;
  };

  const priceGroupKey = (p) => {
    const n = Number(p);
    if (!Number.isFinite(n)) return `s:${String(p ?? "")}`;
    return `n:${n.toFixed(14)}`;
  };
  
  const buckets = new Map();
  const keysInOrder = [];
  
  rawExecutions.forEach((trade) => {
    const pRaw = unwrapDecimal(trade?.price) || unwrapDecimal(trade?.p);
    const qRaw = unwrapDecimal(trade?.quantity) || unwrapDecimal(trade?.q) || unwrapDecimal(trade?.amount) || unwrapDecimal(trade?.a);
    const fRaw = unwrapDecimal(trade?.fee) || unwrapDecimal(trade?.f);
    
    const price = pRaw;
    const qty = Number(qRaw) || 0;
    const fee = Number(fRaw) || 0;
    
    const gk = priceGroupKey(price);
    if (!buckets.has(gk)) {
      keysInOrder.push(gk);
      buckets.set(gk, {
        price: price,
        sumQty: 0,
        sumFee: 0,
      });
    }
    const b = buckets.get(gk);
    b.sumQty += qty;
    b.sumFee += fee;
  });

  return keysInOrder.map((gk) => {
    const b = buckets.get(gk);
    return {
      price: b.price,
      quantity: b.sumQty,
      fee: b.sumFee,
    };
  });
};

const toFixedFour = (val) => {
  const n = parseNum(val);
  if (!Number.isFinite(n)) return "0.0000";
  return n.toFixed(4);
};

const toFixedTwo = (val) => {
  const n = parseNum(val);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
};

const formatWalletName = (name) => {
  if (!name) return "";
  const lower = name.toLowerCase();
  if (lower === "spot") return "Spot";
  if (lower === "main") return "Main";
  if (lower === "funding") return "Funding";
  if (lower === "futures") return "Futures";
  if (lower === "margin") return "Margin";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const fmtHistDate = (iso) => {
  if (!iso) return { date: "—", time: "—" };
  const m = moment(iso);
  if (!m.isValid()) return { date: "—", time: "—" };
  return {
    date: m.format("YYYY-MM-DD"),
    time: m.format("HH:mm:ss")
  };
};

const MarginHistorySection = ({ currencyData = {}, themeColors, isDark }) => {
  const [activeTab, setActiveTab] = useState("size");
  const [subTab, setSubTab] = useState("borrow"); // used in Asset History tab
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [openOrderTypeFilter, setOpenOrderTypeFilter] = useState("All");
  const [openOrderSideFilter, setOpenOrderSideFilter] = useState("All Sides");

  const [orderHistoryTypeFilter, setOrderHistoryTypeFilter] = useState("All");
  const [showExecutedTrades, setShowExecutedTrades] = useState({});

  const { orderData } = useSelector((state) => state.home);

  const baseSymbol = currencyData?.base_currency || "";
  const quoteSymbol = currencyData?.quote_currency || "";
  const pairSymbol = `${baseSymbol}${quoteSymbol}`.toUpperCase();
  const pairId = currencyData?._id || "";

  const borderThemeColor = themeColors.themeBorderColor || "rgba(0,0,0,0.06)";
  const textThemeColor = themeColors.text || colors.black;
  const secondaryTextThemeColor = themeColors.secondaryText || colors.placeholderColor;

  const fetchTabDetails = useCallback(async () => {
    if (!pairSymbol) return;
    setLoading(true);
    try {
      let res;
      if (activeTab === "size") {
        res = await appOperation.get(`margin/position/${pairSymbol}`, undefined, undefined, CUSTOMER_TYPE);
        if (res?.success) {
          setDataList(res.data ? [res.data] : []);
        } else {
          setDataList([]);
        }
      } else if (activeTab === "positionHistory") {
        res = await appOperation.get(`margin/position/${pairSymbol}/history`, { page: 1, limit: 50 }, undefined, CUSTOMER_TYPE);
        if (res?.success) {
          const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.items) ? res.data.items : []);
          setDataList(list);
        } else {
          setDataList([]);
        }
      } else if (activeTab === "positions") {
        res = await appOperation.get(`margin/orders/open`, { pair: pairSymbol, page: 1, limit: 100 }, undefined, CUSTOMER_TYPE);
        if (res?.success) {
          const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.items) ? res.data.items : []);
          setDataList(list);
        } else {
          setDataList([]);
        }
      } else if (activeTab === "orderHistory") {
        res = await appOperation.get(`margin/orders/history`, { pair: pairSymbol, page: 1, limit: 50 }, undefined, CUSTOMER_TYPE);
        if (res?.success) {
          const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.items) ? res.data.items : []);
          setDataList(list);
        } else {
          setDataList([]);
        }
      } else if (activeTab === "tradeHistory") {
        res = await appOperation.get(`margin/trades`, { pair: pairSymbol, page: 1, limit: 50 }, undefined, CUSTOMER_TYPE);
        if (res?.success) {
          const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.items) ? res.data.items : []);
          setDataList(list);
        } else {
          setDataList([]);
        }
      } else if (activeTab === "loanManagement") {
        res = await appOperation.get(`margin/loans`, { pair: pairSymbol }, undefined, CUSTOMER_TYPE);
        if (res?.success) {
          const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.items) ? res.data.items : []);
          setDataList(list);
        } else {
          setDataList([]);
        }
      } else if (activeTab === "assetHistory") {
        const path = `margin/history/${subTab}`;
        const query = { page: 1, limit: 50 };
        if (pairId) query.pairId = pairId;
        res = await appOperation.get(path, query, undefined, CUSTOMER_TYPE);
        if (res?.success) {
          const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.items) ? res.data.items : []);
          setDataList(list);
        } else {
          setDataList([]);
        }
      }
    } catch (e) {
      console.warn("[MarginHistory] Fetch details error:", e);
      setDataList([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, subTab, pairSymbol, pairId]);

  const getFilteredDataList = () => {
    let list = dataList;

    if (activeTab === "orderHistory") {
      if (orderHistoryTypeFilter !== "All") {
        list = list.filter(o => {
          const type = (o.type || o.order_type || "LIMIT").toUpperCase();
          if (orderHistoryTypeFilter === "Limit") return type === "LIMIT";
          if (orderHistoryTypeFilter === "Market") return type === "MARKET";
          if (orderHistoryTypeFilter === "Stop Limit") return type === "STOP_LIMIT";
          if (orderHistoryTypeFilter === "Stop Market") return type === "STOP_MARKET";
          return true;
        });
      }
      return list;
    }

    if (activeTab !== "positions") return list;
    if (openOrderTypeFilter === "Limit") {
      list = list.filter(o => {
        const type = (o.type || o.order_type || "LIMIT").toUpperCase();
        return type === "LIMIT" || type === "STOP_LIMIT";
      });
    } else if (openOrderTypeFilter === "Market") {
      list = list.filter(o => {
        const type = (o.type || o.order_type || "LIMIT").toUpperCase();
        return type === "MARKET" || type === "STOP_MARKET";
      });
    }

    if (openOrderSideFilter === "Buy") {
      list = list.filter(o => (o.side || "").toUpperCase() === "BUY");
    } else if (openOrderSideFilter === "Sell") {
      list = list.filter(o => (o.side || "").toUpperCase() === "SELL");
    }
    return list;
  };

  useFocusEffect(
    useCallback(() => {
      fetchTabDetails();
    }, [fetchTabDetails, orderData])
  );

  // Cancel order handler (Open Orders tab)
  const handleCancelOrder = async (orderId) => {
    if (!orderId) return;
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          setActionLoading(true);
          try {
            const res = await appOperation.delete(`margin/order/${orderId}`, undefined, CUSTOMER_TYPE);
            if (res?.success) {
              Alert.alert("Success", "Order canceled successfully");
              fetchTabDetails();
            } else {
              Alert.alert("Error", res?.message || "Failed to cancel order");
            }
          } catch (err) {
            Alert.alert("Error", err?.message || "Failed to cancel order");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  // Close position handler (Size tab)
  const handleClosePosition = async (pos) => {
    if (!pos?.pair) return;
    Alert.alert("Close Position", "Are you sure you want to close this position at Market Price?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          setActionLoading(true);
          try {
            const res = await appOperation.post(
              `margin/position/${encodeURIComponent(pos.pair)}/close`,
              { type: "MARKET" },
              CUSTOMER_TYPE
            );
            if (res?.success) {
              Alert.alert("Success", "Position close request submitted");
              fetchTabDetails();
            } else {
              Alert.alert("Error", res?.message || "Failed to close position");
            }
          } catch (err) {
            Alert.alert("Error", err?.message || "Failed to close position");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const getSideColor = (side) => {
    const s = String(side || "").toUpperCase().trim();
    if (s === "BUY" || s === "LONG") return themeColors.spotTradeBuy || colors.green;
    if (s === "SELL" || s === "SHORT") return themeColors.spotTradeSell || colors.red;
    return textThemeColor;
  };

  const fmtDate = (iso) => {
    if (!iso) return "---";
    const m = moment(iso);
    return m.isValid() ? m.format("DD/MM/YYYY HH:mm:ss") : "---";
  };

  const renderNoData = () => (
    <View style={styles.noDataContainer}>
      <FastImage
        source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
        resizeMode="contain"
        style={{ width: 80, height: 80 }}
      />

    </View>
  );

  const renderItemCard = (item, index) => {
    if (activeTab === "size") {
      const ml = item?.margin_level != null ? parseFloat(item.margin_level) : null;
      const marginLevelDisplay = ml === null ? "—" : ml >= 999 ? "∞" : ml.toFixed(2);
      const isLong = item?.side === "LONG";
      return (
        <View key={item?._id || index} style={[styles.card, { borderBottomColor: borderThemeColor }]}>
          <View style={[styles.cardHeader, { alignItems: "flex-start", marginBottom: 12 }]}>
            <View>
              <AppText style={[styles.pairText, { color: textThemeColor }]} weight={BOLD}>
                {`${baseSymbol}/${quoteSymbol}`}
              </AppText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                <View style={{
                  borderWidth: 1, 
                  borderColor: isLong ? themeColors.spotTradeBuy || colors.green : themeColors.spotTradeSell || colors.red,
                  borderRadius: 3, 
                  paddingHorizontal: 5, 
                  paddingVertical: 1,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <AppText style={{ color: isLong ? themeColors.spotTradeBuy || colors.green : themeColors.spotTradeSell || colors.red, fontSize: 12 }} weight={BOLD}>
                    {isLong ? "L" : "S"}
                  </AppText>
                </View>
                <AppText style={{ color: secondaryTextThemeColor, fontSize: 12 }}>Isolated</AppText>
                {!!item?.leverage && (
                  <AppText style={{ color: secondaryTextThemeColor, fontSize: 12 }}>{item.leverage}x</AppText>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: "#374151",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 4,
              }}
              onPress={() => handleClosePosition(item)}
              activeOpacity={0.8}
            >
              <AppText style={{ color: colors.white, fontSize: 12 }} weight={MEDIUM}>Market Close</AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Holding</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{toFixedEight(item?.quantity || item?.size)}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Value</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{toFixedFour(item?.notional || item?.value)}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Entry Price</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{toFixedFour(item?.entry_price)}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Index Price</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{toFixedFour(item?.index_price ?? item?.mark_price)}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Est. Liq. Price</AppText>
              <AppText style={[styles.value, { color: colors.orangeTheme }]} weight={SEMI_BOLD}>{toFixedTwo(item?.liquidation_price)}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Maint. Margin Ratio</AppText>
              <AppText style={[styles.value, { color: themeColors.spotTradeBuy || colors.green }]} weight={SEMI_BOLD}>
                {item?.maintenance_margin_ratio != null ? `${(parseFloat(item.maintenance_margin_ratio) * 100).toFixed(2)}%` : (ml != null ? `${ml >= 999 ? "999+" : ml.toFixed(0)}%` : "—")}
              </AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Unrealized PnL</AppText>
              <AppText style={[styles.value, { color: getSideColor(parseFloat(item?.unrealized_pnl) >= 0 ? "LONG" : "SHORT") }]} weight={SEMI_BOLD}>
                {item?.unrealized_pnl ? `${parseFloat(item.unrealized_pnl) > 0 ? "+" : ""}${parseFloat(item.unrealized_pnl).toFixed(4)} (${parseFloat(item.unrealized_pnl_pct || 0) > 0 ? "+" : ""}${parseFloat(item.unrealized_pnl_pct || 0).toFixed(2)}%)` : "0.0000"}
              </AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Realized PnL</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>
                {item?.realized_pnl ? parseFloat(item.realized_pnl).toFixed(4) : "0.0000"}
              </AppText>
            </View>
          </View>
        </View>
      );
    }

    if (activeTab === "positionHistory") {
      const isLong = item?.side === "LONG";
      const statusMap = { CLOSED: "Close All", LIQUIDATED: "Liquidated", OPEN: "Open Position" };
      const statusText = statusMap[item?.status] || item?.status || "—";
      const entryDt = fmtHistDate(item?.opened_at || item?.created_at);
      const closeDt = fmtHistDate(item?.closed_at || item?.updated_at || item?.end_time);
      const rpnl = parseFloat(item?.realized_pnl || 0);

      return (
        <View key={item?._id || index} style={[styles.histCard, { borderBottomColor: borderThemeColor }]}>
          {/* Row 1: Spot/Leverage | Side */}
          <View style={styles.histRow}>
            <View style={styles.histCellLeft}>
              <AppText style={[styles.histLabel, { color: secondaryTextThemeColor }]} weight={MEDIUM}>Spot/Leverage</AppText>
              <View style={styles.pairRow}>
                <AppText style={[styles.histPairText, { color: textThemeColor }]} weight={BOLD}>
                  {`${baseSymbol}/${quoteSymbol}`}
                </AppText>
                <View style={[styles.tagPill, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#EAEAEA" }]}>
                  <AppText style={[styles.tagText, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Isolated</AppText>
                </View>
              </View>
              {/* Status Tag */}
              <View style={[styles.statusTagPill, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#EAEAEA" }]}>
                <AppText style={[styles.statusTagText, { color: textThemeColor }]} weight={SEMI_BOLD}>
                  {statusText}
                </AppText>
              </View>
            </View>

            <View style={styles.histCellRight}>
              <AppText style={[styles.histLabel, { color: secondaryTextThemeColor }]} weight={MEDIUM}>Side</AppText>
              <AppText style={{ color: getSideColor(item?.side === "LONG" ? "LONG" : "SHORT"), fontSize: 16 }} weight={BOLD}>
                {item?.side === "LONG" || item?.side === "BUY" ? "L" : "S"}
              </AppText>
            </View>
          </View>

          {/* Row 2: Entry Time | Close-All Time */}
          <View style={styles.histRow}>
            <View style={styles.histCellLeft}>
              <AppText style={[styles.histLabel, { color: secondaryTextThemeColor }]} weight={MEDIUM}>Entry Time</AppText>
              <AppText style={[styles.histValPrimary, { color: textThemeColor }]} weight={SEMI_BOLD}>{entryDt.date}</AppText>
              <AppText style={[styles.histValSecondary, { color: secondaryTextThemeColor }]} weight={MEDIUM}>{entryDt.time}</AppText>
            </View>

            <View style={styles.histCellRight}>
              <AppText style={[styles.histLabel, { color: secondaryTextThemeColor }]} weight={MEDIUM}>Close-All Time</AppText>
              <AppText style={[styles.histValPrimary, { color: textThemeColor }]} weight={SEMI_BOLD}>{closeDt.date}</AppText>
              <AppText style={[styles.histValSecondary, { color: secondaryTextThemeColor }]} weight={MEDIUM}>{closeDt.time}</AppText>
            </View>
          </View>

          {/* Row 3: Entry Price | Exit Price */}
          <View style={styles.histRow}>
            <View style={styles.histCellLeft}>
              <AppText style={[styles.histLabel, { color: secondaryTextThemeColor }]} weight={MEDIUM}>Entry Price</AppText>
              <AppText style={[styles.histValPrimary, { color: textThemeColor }]} weight={SEMI_BOLD}>
                {toFixedFour(item?.entry_price)} <AppText style={{ color: secondaryTextThemeColor, fontSize: 12 }}>{quoteSymbol}</AppText>
              </AppText>
            </View>

            <View style={styles.histCellRight}>
              <AppText style={[styles.histLabel, { color: secondaryTextThemeColor }]} weight={MEDIUM}>Exit Price</AppText>
              <AppText style={[styles.histValPrimary, { color: textThemeColor }]} weight={SEMI_BOLD}>
                {item?.close_price ? toFixedFour(item.close_price) : "—"} <AppText style={{ color: secondaryTextThemeColor, fontSize: 12 }}>{quoteSymbol}</AppText>
              </AppText>
            </View>
          </View>

          {/* Row 4: Peak Position | Notional */}
          <View style={styles.histRow}>
            <View style={styles.histCellLeft}>
              <AppText style={[styles.histLabel, { color: secondaryTextThemeColor }]} weight={MEDIUM}>Peak Position</AppText>
              <AppText style={[styles.histValPrimary, { color: textThemeColor }]} weight={SEMI_BOLD}>
                {toFixedFour(item?.quantity)} <AppText style={{ color: secondaryTextThemeColor, fontSize: 12 }}>{baseSymbol}</AppText>
              </AppText>
            </View>

            <View style={styles.histCellRight}>
              <AppText style={[styles.histLabel, { color: secondaryTextThemeColor }]} weight={MEDIUM}>Notional</AppText>
              <AppText style={[styles.histValPrimary, { color: textThemeColor }]} weight={SEMI_BOLD}>
                {toFixedFour(item?.notional)} <AppText style={{ color: secondaryTextThemeColor, fontSize: 12 }}>{quoteSymbol}</AppText>
              </AppText>
            </View>
          </View>

          {/* Row 5: Realized PnL | Fees */}
          <View style={styles.histRow}>
            <View style={styles.histCellLeft}>
              <AppText style={[styles.histLabel, { color: secondaryTextThemeColor }]} weight={MEDIUM}>Realized PnL</AppText>
              <AppText style={{ color: getSideColor(rpnl >= 0 ? "LONG" : "SHORT"), fontSize: 14 }} weight={SEMI_BOLD}>
                {rpnl >= 0 ? "+" : ""}{rpnl.toFixed(4)} <AppText style={{ color: secondaryTextThemeColor, fontSize: 12 }}>{quoteSymbol}</AppText>
              </AppText>
            </View>

            <View style={styles.histCellRight}>
              <AppText style={[styles.histLabel, { color: secondaryTextThemeColor }]} weight={MEDIUM}>Fees</AppText>
              <AppText style={[styles.histValPrimary, { color: textThemeColor }]} weight={SEMI_BOLD}>
                {toFixedFour(item?.total_fees)} <AppText style={{ color: secondaryTextThemeColor, fontSize: 12 }}>{quoteSymbol}</AppText>
              </AppText>
            </View>
          </View>
        </View>
      );
    }

    if (activeTab === "positions") {
      // Open Orders
      const orderId = item?._id || item?.id;
      const m = moment(item?.created_at || item?.timestamp);
      const dateStr = m.isValid() ? m.format("DD/MM/YYYY") : "—";
      const timeStr = m.isValid() ? m.format("HH:mm:ss") : "—";
      const typeStr = (item?.type || item?.order_type || "LIMIT").toUpperCase();
      const sideStr = (item?.side || "").toUpperCase();
      const priceStr = typeStr === "MARKET" ? "Market" : toFixedEight(item?.price);
      const qtyStr = toFixedEight(item?.quantity || item?.amount);

      return (
        <TouchableOpacity 
          key={orderId || index} 
          style={[styles.card, { borderBottomColor: borderThemeColor }]}
          activeOpacity={0.8}
          onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item })}
        >
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AppText style={[styles.pairText, { color: textThemeColor }]} weight={BOLD}>
                {`${baseSymbol}/${quoteSymbol}`}
              </AppText>
              <FastImage source={right_ic} tintColor={secondaryTextThemeColor} style={{ width: 14, height: 14 }} resizeMode="contain" />
            </View>
          </View>
          <AppText style={{ color: getSideColor(item?.side), marginBottom: 12, marginTop: -4 }} weight={SEMI_BOLD} type={TWELVE}>
            {sideStr} · {typeStr}
          </AppText>
          <View style={styles.grid}>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Date</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{dateStr}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Time</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{timeStr}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Side</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{sideStr}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Type</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{typeStr}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>TIF</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{item?.time_in_force || "GTC"}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Price</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{priceStr}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Quantity</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{qtyStr}</AppText>
            </View>
          </View>
          <View style={[styles.actionRow, { justifyContent: "flex-end", marginTop: 16 }]}>
            <TouchableOpacity
              style={{ paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: themeColors.red, borderRadius: 4 }}
              onPress={() => handleCancelOrder(orderId)}
              activeOpacity={0.8}
            >
              <AppText style={{ color: themeColors.red, fontSize: 14 }} weight={MEDIUM}>Cancel order</AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    if (activeTab === "orderHistory") {
      const orderId = item?._id || item?.order_id || index;
      const isExpanded = showExecutedTrades[orderId];
      const m = moment(item?.created_at || item?.timestamp);
      const dateStr = m.isValid() ? m.format("YYYY-MM-DD") : "—";
      const timeStr = m.isValid() ? m.format("HH:mm:ss") : "—";
      const typeStr = (item?.type || item?.order_type || "LIMIT").toUpperCase();
      const sideStr = (item?.side || "").toUpperCase();
      const isMarket = typeStr === "MARKET" || typeStr === "STOP_MARKET";
      const priceStr = isMarket ? "Smart Market" : `${toFixedEight(item?.price)} ${quoteSymbol}`;
      const fillPxStr = item?.avg_execution_price ? `${toFixedEight(item?.avg_execution_price)} ${quoteSymbol}` : "—";
      
      const filledNum = parseNum(item?.filled_quantity ?? item?.filled) || 0;
      const qtyNum = parseNum(item?.quantity) || 0;
      const fillPctRaw = qtyNum > 0 ? ((filledNum / qtyNum) * 100).toFixed(2) : "0.00";
      const fillPctStr = `${fillPctRaw}%`;
      
      const tifLabel = item?.time_in_force || item?.tif;
      const finalTif = tifLabel ? String(tifLabel).toUpperCase() : "—";

      const rawExecutions = (Array.isArray(item?.executed_prices) && item.executed_prices.length > 0)
        ? item.executed_prices
        : (Array.isArray(item?.executions) ? item.executions : []);
      const executions = aggregateExecutedLegs(rawExecutions);

      return (
        <TouchableOpacity 
          key={orderId || index} 
          style={[styles.card, { borderBottomColor: borderThemeColor }]}
          activeOpacity={0.8}
          onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item, isMargin: true })}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center" }}>
              <AppText style={{ color: textThemeColor, fontSize: 16 }} weight={BOLD}>
                {`${baseSymbol}/${quoteSymbol}`}
              </AppText>
              <FastImage source={right_ic} tintColor={textThemeColor} style={{ width: 12, height: 12, marginLeft: 6, marginTop: 2 }} resizeMode="contain" />
            </TouchableOpacity>
          </View>
          <AppText style={{ color: getSideColor(item?.side), marginBottom: 12, marginTop: -4 }} weight={SEMI_BOLD} type={TWELVE}>
            {sideStr} · {finalTif}
          </AppText>
          <View style={styles.grid}>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Creation Time</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{dateStr} {timeStr}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Fill Price</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{fillPxStr}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Price</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{priceStr}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Filled/Amount</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{toFixedEight(item?.filled_quantity ?? item?.filled)}/{toFixedEight(item?.quantity)} · {fillPctStr}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Status</AppText>
              <AppText style={[styles.value, { color: getSideColor("LONG") }]} weight={SEMI_BOLD}>{item?.status || "—"}</AppText>
            </View>
          </View>
          
          {executions.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  alignSelf: "flex-end",
                  paddingVertical: 4,
                  paddingHorizontal: 5,
                  borderWidth: 1,
                  borderColor: isDark ? "#333" : "#EAEAEA",
                  borderRadius: 5,
                }}
                onPress={() => setShowExecutedTrades(prev => ({ ...prev, [orderId]: !prev[orderId] }))}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <FastImage
                    source={downIcon}
                    tintColor={colors.lightGrey}
                    style={[
                      { width: 10, height: 10, marginRight: 4 },
                      { transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] },
                    ]}
                    resizeMode="contain"
                  />
                  <AppText style={{ color: textThemeColor, fontSize: 12 }} weight={SEMI_BOLD}>
                    Executed trades
                  </AppText>
                </View>
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={{ marginTop: 8, backgroundColor: isDark ? "rgba(128, 128, 128, 0.08)" : "rgba(128, 128, 128, 0.08)", paddingVertical: 8, paddingHorizontal: 8, borderRadius: 8 }}>
                  {executions.map((leg, i) => (
                    <View key={i} style={[{ backgroundColor: "transparent" }, i < executions.length - 1 ? { borderBottomWidth: 1, borderBottomColor: borderThemeColor, marginBottom: 8, paddingBottom: 8 } : null]}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <AppText style={{ color: secondaryTextThemeColor, fontSize: 13 }} weight={MEDIUM}>
                          Trade #{i + 1}:
                        </AppText>
                      </View>

                      <View style={{ gap: 4, marginTop: 4 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 1 }}>
                          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Price:</AppText>
                          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: textThemeColor, textAlign: "right", flex: 2 }} numberOfLines={3}>{toFixedEight(leg.price)} {quoteSymbol}</AppText>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 1 }}>
                          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Executed:</AppText>
                          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: textThemeColor, textAlign: "right", flex: 2 }} numberOfLines={3}>{toFixedEight(leg.quantity)} {baseSymbol}</AppText>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 1 }}>
                          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Fee:</AppText>
                          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: textThemeColor, textAlign: "right", flex: 2 }} numberOfLines={3}>{toFixedEight(leg.fee)} {quoteSymbol}</AppText>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 1 }}>
                          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Total:</AppText>
                          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: textThemeColor, textAlign: "right", flex: 2 }} numberOfLines={3}>{toFixedEight(Number(leg.price) * Number(leg.quantity))}</AppText>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (activeTab === "tradeHistory") {
      return (
        <View key={item?._id || index} style={[styles.card, { borderBottomColor: borderThemeColor }]}>
          <View style={styles.cardHeader}>
            <AppText style={[styles.pairText, { color: textThemeColor }]} weight={BOLD}>
              {`${baseSymbol}/${quoteSymbol}`}
            </AppText>
            <AppText style={[styles.timeText, { color: secondaryTextThemeColor }]} weight={MEDIUM}>
              {fmtDate(item?.created_at || item?.timestamp)}
            </AppText>
          </View>
          <AppText style={{ color: getSideColor(item?.side), marginBottom: 6 }} weight={SEMI_BOLD} type={TWELVE}>
            {item?.side}
          </AppText>
          <View style={styles.grid}>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Price</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{toFixedEight(item?.price)}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Amount</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{toFixedEight(item?.amount)}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Fee</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{toFixedEight(item?.fee)} {item?.fee_currency || quoteSymbol}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Total</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{toFixedEight(item?.total || (parseFloat(item?.amount || 0) * parseFloat(item?.price || 0)))} {quoteSymbol}</AppText>
            </View>
          </View>
        </View>
      );
    }

    if (activeTab === "loanManagement") {
      return (
        <View key={item?._id || index} style={[styles.card, { borderBottomColor: borderThemeColor }]}>
          <View style={styles.cardHeader}>
            <AppText style={[styles.pairText, { color: textThemeColor }]} weight={BOLD}>
              {item?.coin || "—"}
            </AppText>
            <AppText style={{ color: colors.orangeTheme }} weight={BOLD} type={TWELVE}>
              {item?.status || "Active"}
            </AppText>
          </View>
          <View style={styles.grid}>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Outstanding Loan</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{parseFloat(item?.outstanding || 0).toFixed(6)}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Interest Accrued</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{parseFloat(item?.interest_accrued || 0).toFixed(6)}</AppText>
            </View>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Hourly Rate</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{item?.hourly_rate != null ? `${(parseFloat(item.hourly_rate) * 100).toFixed(6)}%` : "—"}</AppText>
            </View>
          </View>
        </View>
      );
    }

    if (activeTab === "assetHistory") {
      return (
        <View key={item?.id || index} style={[styles.card, { borderBottomColor: borderThemeColor }]}>
          <View style={styles.cardHeader}>
            <AppText style={[styles.pairText, { color: textThemeColor }]} weight={BOLD}>
              {item?.coin || "—"}
            </AppText>
            <AppText style={[styles.timeText, { color: secondaryTextThemeColor }]} weight={MEDIUM}>
              {fmtDate(item?.time || item?.created_at || item?.timestamp)}
            </AppText>
          </View>
          <View style={styles.grid}>
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Pair</AppText>
              <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{item?.pair || "—"}</AppText>
            </View>
            {subTab === "transfer" && (
              <>
                <View style={styles.kvRow}>
                  <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Type</AppText>
                  <AppText style={[styles.value, { color: getSideColor(item?.transferType === "Transfer In" ? "LONG" : "SHORT") }]} weight={SEMI_BOLD}>
                    {item?.transferType || item?.type || "—"}
                  </AppText>
                </View>
                <View style={styles.kvRow}>
                  <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>From</AppText>
                  <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{formatWalletName(item?.from)}</AppText>
                </View>
                <View style={styles.kvRow}>
                  <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>To</AppText>
                  <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{formatWalletName(item?.to)}</AppText>
                </View>
              </>
            )}
            {subTab === "interest" && (
              <>
                <View style={styles.kvRow}>
                  <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Hourly Rate</AppText>
                  <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{item?.hourlyRate || "—"}</AppText>
                </View>
                <View style={styles.kvRow}>
                  <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>APR</AppText>
                  <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{item?.apr || "—"}</AppText>
                </View>
                <View style={styles.kvRow}>
                  <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Loan Amount</AppText>
                  <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{toFixedEight(item?.loanAmount)}</AppText>
                </View>
                <View style={styles.kvRow}>
                  <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Charged Interest</AppText>
                  <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{toFixedEight(item?.amount)}</AppText>
                </View>
              </>
            )}
            {(subTab !== "transfer" && subTab !== "interest") && (
              <View style={styles.kvRow}>
                <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Amount</AppText>
                <AppText style={[styles.value, { color: textThemeColor }]} weight={SEMI_BOLD}>{toFixedEight(item?.amount)}</AppText>
              </View>
            )}
            <View style={styles.kvRow}>
              <AppText style={[styles.label, { color: secondaryTextThemeColor }]} weight={SEMI_BOLD}>Status</AppText>
              <AppText style={[styles.value, { color: getSideColor("LONG") }]} weight={SEMI_BOLD}>
                {item?.status || "Completed"}
              </AppText>
            </View>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Primary Tab Bar */}
      <View style={[styles.tabsContainer, {}]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 10 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabButton}
                activeOpacity={0.8}
                onPress={() => {
                  setActiveTab(tab.id);
                  setDataList([]);
                }}
              >
                <AppText
                  style={{ color: isActive ? textThemeColor : secondaryTextThemeColor, fontSize: 14 }}
                  weight={SEMI_BOLD}
                >
                  {tab.label}
                </AppText>
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: isActive ? colors.black : "transparent" },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sub tabs for Asset History */}
      {activeTab === "assetHistory" && (
        <View style={styles.subTabsContainer}>
          {AH_SUB_TABS.map((st) => {
            const isSubActive = subTab === st.id;
            return (
              <TouchableOpacity
                key={st.id}
                style={[
                  styles.subTabButton,
                  {
                    backgroundColor: isSubActive ? (isDark ? "rgba(255,255,255,0.08)" : "#EAEAEA") : "transparent",
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  setSubTab(st.id);
                  setDataList([]);
                }}
              >
                <AppText
                  style={[
                    styles.subTabText,
                    { color: isSubActive ? textThemeColor : secondaryTextThemeColor },
                  ]}
                  weight={MEDIUM}
                >
                  {st.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {activeTab === "positions" && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 12, paddingHorizontal: 8 }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {["All", "Limit", "Market"].map(label => (
              <TouchableOpacity
                key={label}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 4,
                  backgroundColor: openOrderTypeFilter === label ? (isDark ? "#333" : "#EAEAEA") : "transparent",
                }}
                onPress={() => setOpenOrderTypeFilter(label)}
              >
                <AppText style={{ color: openOrderTypeFilter === label ? textThemeColor : secondaryTextThemeColor, fontSize: 13 }} weight={MEDIUM}>{label}</AppText>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <CustomDropdown
              width={100}
              data={["All Sides", "Buy", "Sell"]}
              selected={openOrderSideFilter}
              onSelect={(label) => setOpenOrderSideFilter(label)}
            />
            <TouchableOpacity onPress={() => { setOpenOrderTypeFilter("All"); setOpenOrderSideFilter("All Sides"); fetchTabDetails(); }} style={{ flexDirection: 'row', alignItems: 'center' }}>
               <AppText style={{ color: secondaryTextThemeColor, fontSize: 13 }} weight={MEDIUM}>Reset</AppText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === "orderHistory" && (
        <View style={{ marginVertical: 12, paddingHorizontal: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 10 }}>
            {["All", "Limit", "Market", "Stop Limit", "Stop Market"].map(label => (
              <TouchableOpacity
                key={label}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 4,
                  backgroundColor: orderHistoryTypeFilter === label ? (isDark ? "#333" : "#EAEAEA") : "transparent",
                }}
                onPress={() => setOrderHistoryTypeFilter(label)}
              >
                <AppText style={{ color: orderHistoryTypeFilter === label ? textThemeColor : secondaryTextThemeColor, fontSize: 13 }} weight={MEDIUM}>{label}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content panel */}
      {loading || actionLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={colors.black} />
        </View>
      ) : getFilteredDataList().length === 0 ? (
        renderNoData()
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {getFilteredDataList().map((item, index) => renderItemCard(item, index))}
        </ScrollView>
      )}
    </View>
  );
};

export default MarginHistorySection;

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    flex: 1,
    paddingHorizontal: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingBottom: 4,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIndicator: {
    height: 2,
    marginTop: 4,
    minWidth: 24,
    borderRadius: 1,
  },
  subTabsContainer: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  subTabButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subTabText: {
    fontSize: 12,
  },
  card: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  pairText: {
    fontSize: 15,
  },
  timeText: {
    fontSize: 12,
  },
  grid: {
    gap: 5,
  },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    flex: 1,
  },
  value: {
    fontSize: 13,
    textAlign: "right",
    flex: 2,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noDataText: {
    marginTop: 10,
    fontSize: 14,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  histCard: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  histRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  histCellLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  histCellRight: {
    flex: 1,
    alignItems: "flex-end",
    textAlign: "right",
  },
  histLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  histValPrimary: {
    fontSize: 14,
  },
  histValSecondary: {
    fontSize: 12,
    marginTop: 2,
  },
  histPairText: {
    fontSize: 16,
  },
  pairRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
  },
  statusTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  statusTagText: {
    fontSize: 12,
  },
});
