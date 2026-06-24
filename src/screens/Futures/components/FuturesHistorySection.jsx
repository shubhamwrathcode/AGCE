import React, { useState } from 'react';
import { View, TouchableOpacity, Platform, ToastAndroid, Alert } from 'react-native';
import FastImage from 'react-native-fast-image';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';

import { BOLD, fontFamilyMedium, fontFamilySemiBold, MEDIUM, SEMI_BOLD } from '../../../theme/typography';
import { colors } from '../../../theme/colors';
import { decNum, computePosition, computeClosedPosition } from '../../../helper/futuresUtils';
import { right_ic, NO_NOTIFICATION_ICON, filterIcon } from '../../../helper/ImageAssets';
import { AppText, FOURTEEN, TEN, THIRTEEN, TWELVE } from '../../../common';
import { SwipeListView } from 'react-native-swipe-list-view';
import FuturesCancelModal from './FuturesCancelModal';
import FuturesClosePositionModal from './FuturesClosePositionModal';
import FuturesHistoryFilterSheet from './FuturesHistoryFilterSheet';
import { appOperation } from '../../../appOperation';

const getStatusColor = (statusText, themeColors) => {
  if (!statusText) return themeColors.text;
  const normalized = statusText.toString().toLowerCase();
  if (normalized.includes("filled") || normalized.includes("success") || normalized.includes("completed") || normalized.includes("closed")) {
    return colors.green;
  }
  if (normalized.includes("cancel") || normalized.includes("reject") || normalized.includes("fail") || normalized.includes("liquidated")) {
    return colors.red;
  }
  if (normalized.includes("pending")) {
    return colors.orange || "#FFA500";
  }
  return themeColors.text;
};

const FuturesHistorySection = ({
  activeHistoryTab,
  futuresPositions,
  loadingPositions,
  futuresPositionHistory,
  loadingPositionHistory,
  futuresOpenOrders,
  loadingOpenOrders,
  futuresOrderHistory,
  loadingOrderHistory,
  futuresTransactionHistory,
  loadingTransactionHistory,
  themeColors,
  isDark,
  futuresPrice,
  selectedCoin,
  limit,
  onViewMore,
  onRefresh,
}) => {
  const navigation = useNavigation();
  const [cancelModalVisible, setCancelModalVisible] = React.useState(false);
  const [orderToCancel, setOrderToCancel] = React.useState(null);
  const [cancelLoading, setCancelLoading] = React.useState(false);

  const [closeModalVisible, setCloseModalVisible] = React.useState(false);
  const [posToClose, setPosToClose] = React.useState(null);
  const [closeLoading, setCloseLoading] = React.useState(false);

  const [orderKindFilter, setOrderKindFilter] = React.useState('all');
  const [orderSideFilter, setOrderSideFilter] = React.useState('All Sides');

  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [walletHistoryFilters, setWalletHistoryFilters] = useState({
    type: "", asset: "", contract: "", from: "", to: ""
  });

  const executeCancelOrder = async () => {
    if (!orderToCancel) return;
    setCancelLoading(true);
    try {
      const result = await appOperation.customer?.cancelFutureOrder({ orderId: orderToCancel._id || orderToCancel.id });
      if (result?.success) {
        ToastAndroid.show(result?.message || 'Order Cancelled', ToastAndroid.SHORT);
        setCancelModalVisible(false);
        setOrderToCancel(null);
        if (onRefresh) onRefresh();
      } else {
        ToastAndroid.show(result?.message || 'Failed to cancel', ToastAndroid.SHORT);
      }
    } catch (e) {
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
    } finally {
      setCancelLoading(false);
    }
  };

  const executeClosePosition = async ({ orderType, price, quantity }) => {
    if (!posToClose) return;
    setCloseLoading(true);
    try {
      const posSide = String(posToClose.side ?? "").toUpperCase();
      const closeSide = posSide === "SHORT" ? "BUY" : "SELL";
      const payload = {
        symbol: posToClose.symbol,
        side: closeSide,
        order_type: orderType,
        quantity: String(quantity),
        leverage: Number(posToClose.leverage) || 1,
        reduce_only: true,
      };
      if (orderType === "LIMIT") {
        payload.price = String(price);
      }
      const result = await appOperation.customer?.futuresPlaceOrder(payload);
      if (result?.success) {
        ToastAndroid.show('Position close order placed', ToastAndroid.SHORT);
        setCloseModalVisible(false);
        setPosToClose(null);
        if (onRefresh) onRefresh();
      } else {
        const msg = result?.error?.message || result?.message || 'Failed to close position';
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      }
    } catch (e) {
      const msg = e?.error?.message || e?.message || 'Something went wrong';
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } finally {
      setCloseLoading(false);
    }
  };

  const EmptyState = () => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40, minHeight: 300 }}>
      <FastImage source={NO_NOTIFICATION_ICON} style={{ width: 80, height: 80, marginBottom: 12, opacity: 0.8 }} />
    </View>
  );

  const renderFuturesPositionItem = ({ item: pos, isLast }) => {
    const { qty, entry, mark, pnl, margin, roe, marginRatio } = computePosition(pos, futuresPrice?.mark_price, selectedCoin);

    const isLong = String(pos.side ?? "").toUpperCase() === "LONG";
    const sideColor = isLong ? colors.green : colors.red;
    const pnlColor = pnl >= 0 ? colors.green : colors.red;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("FutureHistoryCardDetailPage", { pos, selectedCoin, title: activeHistoryTab })}
        activeOpacity={0.7}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 0,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: themeColors.themeBorderColor || "#e0e0e0",
        }}
      >
        <View style={{ marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
                {pos.symbol || "—"}
              </AppText>
              <FastImage
                source={right_ic}
                style={{ width: 10, height: 10, marginLeft: 6 }}
                tintColor={themeColors.secondaryText}
                resizeMode="contain"
              />
            </View>
            <AppText type={TWELVE} style={{ color: themeColors.text, fontFamily: fontFamilyMedium }}>
              <AppText type={TWELVE} style={{ color: sideColor, fontFamily: fontFamilySemiBold }}>
                {isLong ? "LONG" : "SHORT"}
              </AppText>
              {" · "}{pos.leverage || 1}x{" · "}{String(pos.margin_type ?? "ISOLATED").toUpperCase()}
            </AppText>
          </View>
          <TouchableOpacity
            onPress={() => {
              setPosToClose(pos);
              setCloseModalVisible(true);
            }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 4,
              backgroundColor: isDark ? "rgba(255,255,255,0.15)" : colors.black,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <AppText type={THIRTEEN} style={{ color: colors.white, fontFamily: fontFamilySemiBold }}>Close Position</AppText>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Size</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
              {Number(qty).toFixed(4)} {pos.symbol ? pos.symbol.replace(/USDT.*/, '') : "BTC"}
            </AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Entry Price</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
              {Number(entry) > 0 ? Number(entry).toFixed(4) : "—"}
            </AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Mark Price</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
              {Number(mark) > 0 ? Number(mark).toFixed(4) : "—"}
            </AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Liq. Price</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
              {pos.liquidation_price ? Number(pos.liquidation_price).toFixed(4) : "—"}
            </AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Margin Ratio</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
              {Number(marginRatio) > 0 ? `${Number(marginRatio).toFixed(2)}%` : "—"}
            </AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Margin</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
              {Number(margin).toFixed(4)} USDT
            </AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>PNL (ROE%)</AppText>
            <AppText type={FOURTEEN} style={{ color: pnlColor, fontFamily: fontFamilySemiBold }}>
              {pnl >= 0 ? "+" : ""}{Number(pnl).toFixed(4)} USDT ({roe >= 0 ? "+" : ""}{Number(roe).toFixed(2)}%)
            </AppText>
          </View>

        </View>
      </TouchableOpacity>
    );
  };

  const renderFuturesPositionHistoryItem = ({ item: pos, isLast }) => {
    const { entry, exit, qty, pnl, fees, funding, reason } = computeClosedPosition(pos);
    const isLong = String(pos.side ?? "").toUpperCase() === "LONG";
    const sideColor = isLong ? colors.green : colors.red;
    const pnlColor = pnl >= 0 ? colors.green : colors.red;
    const fundingColor = funding >= 0 ? colors.green : colors.red;

    const closedTime = pos.closed_at || pos.updatedAt || pos.createdAt;
    const openedTime = pos.opened_at || pos.createdAt;

    const closedDateFormatted = closedTime ? moment(closedTime).format("YYYY-MM-DD HH:mm:ss") : "—";
    const openedDateFormatted = openedTime ? moment(openedTime).format("YYYY-MM-DD HH:mm:ss") : "—";

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("FutureHistoryCardDetailPage", { pos, selectedCoin, title: activeHistoryTab })}
        activeOpacity={0.7}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 0,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: themeColors.themeBorderColor || "#e0e0e0",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
            {pos.symbol || "—"}
          </AppText>
          <FastImage
            source={right_ic}
            style={{ width: 11, height: 11, marginLeft: 4, }}
            resizeMode="contain"
            tintColor={colors.black}
          />
        </View>
        <AppText type={TWELVE} style={{ color: themeColors.text, marginBottom: 12, fontFamily: fontFamilySemiBold }}>
          {isLong ? "LONG" : "SHORT"} · {pos.leverage}x · {String(pos.margin_type ?? "ISOLATED").toUpperCase()}
        </AppText>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Closed Time</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{closedDateFormatted}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Opened Time</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{openedDateFormatted}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Size</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{Number(qty).toFixed(4)} {selectedCoin?.base_currency || "USDT"}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Entry Price</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{Number(entry).toFixed(2)}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Exit Price</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{Number(exit).toFixed(2)}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Realized PNL</AppText>
            <AppText type={FOURTEEN} style={{ color: pnlColor, fontFamily: fontFamilySemiBold }}>
              {pnl >= 0 ? "+" : ""}{Number(pnl).toFixed(4)} USDT
            </AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Funding</AppText>
            <AppText type={FOURTEEN} style={{ color: fundingColor, fontFamily: fontFamilySemiBold }}>
              {funding >= 0 ? "+" : ""}{Number(funding || 0).toFixed(4)} USDT
            </AppText>
          </View>
          {(pos.close_reason || pos.status) && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Status</AppText>
              <AppText type={FOURTEEN} style={{ color: getStatusColor(reason || pos.status, themeColors), fontFamily: fontFamilySemiBold }}>
                {reason || pos.status}
              </AppText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFuturesOpenOrderItem = ({ item: order, isLast }) => {
    console.log("Futures Open Order Data:", order);
    const isBuy = String(order.side ?? "").toUpperCase() === "BUY";
    const sideColor = isBuy ? colors.green : colors.red;
    const filledQty = decNum(order.executed_quantity ?? order.filledQty ?? 0);
    const totalQty = decNum(order.quantity ?? order.origQty ?? 0);

    const handleCancelOrder = () => {
      setOrderToCancel(order);
      setCancelModalVisible(true);
    };

    const orderType = String(order.order_type ?? order.type ?? "Limit").charAt(0).toUpperCase() + String(order.order_type ?? order.type ?? "Limit").slice(1).toLowerCase();
    const leverage = order.leverage ? `${order.leverage}x` : "1x";

    const createdTime = order.created_at || order.createdAt || order.updatedAt;
    const dateFormatted = createdTime ? moment(createdTime).format("YYYY-MM-DD") : "—";
    const timeFormatted = createdTime ? moment(createdTime).format("HH:mm:ss") : "—";

    const unfilledQty = totalQty - filledQty;
    const baseCoin = selectedCoin?.base_currency || (order.symbol ? order.symbol.replace(/USDT.*/, '') : "BTC");

    const tif = order.timeInForce || order.time_in_force || "GTC";
    const reduceOnly = order.reduceOnly || order.reduce_only ? "Yes" : "No";

    const triggerVal = decNum(order?.trigger_price ?? order?.triggerPrice ?? order?.stop_price ?? order?.stopPrice);
    const limitVal = decNum(order?.price);
    const rawType = String(order.order_type ?? order.type ?? "").toUpperCase();

    const fmtPrice = (n) => Number.isFinite(n) ? Number(n).toFixed(2) : "—";

    const tpSlText = () => {
      const tp = decNum(order.take_profit);
      const sl = decNum(order.stop_loss);
      if (!Number.isFinite(tp) && !Number.isFinite(sl)) return null;
      const parts = [];
      if (Number.isFinite(tp)) parts.push(`TP ${fmtPrice(tp)}`);
      if (Number.isFinite(sl)) parts.push(`SL ${fmtPrice(sl)}`);
      return parts.join(" · ");
    };

    const getTriggerText = () => {
      const attached = tpSlText();
      if (attached) return attached;

      if ((rawType === "STOP_LIMIT" || rawType === "TAKE_PROFIT_LIMIT") && Number.isFinite(triggerVal)) {
        return `Trigger ${fmtPrice(triggerVal)}`;
      }
      if (rawType === "CONDITIONAL" && Number.isFinite(triggerVal)) {
        if (Number.isFinite(limitVal) && limitVal > 0) {
          return `Trigger ${fmtPrice(triggerVal)} · Limit ${fmtPrice(limitVal)}`;
        }
        return `Trigger ${fmtPrice(triggerVal)}`;
      }
      if ((rawType === "STOP_MARKET" || rawType === "TAKE_PROFIT_MARKET") && Number.isFinite(triggerVal)) {
        return rawType === "TAKE_PROFIT_MARKET" ? "TP trigger" : "SL trigger";
      }
      return null;
    };

    const triggerText = getTriggerText();

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("FutureHistoryCardDetailPage", { pos: order, selectedCoin, title: activeHistoryTab })}
        activeOpacity={0.7}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 0,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: themeColors.themeBorderColor || "#e0e0e0",
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
                {order.symbol || "—"}
              </AppText>
              <FastImage source={right_ic} style={{ width: 10, height: 10, marginLeft: 6, marginTop: 2 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
            </View>
            <AppText type={TWELVE} style={{ color: themeColors.text, fontFamily: fontFamilyMedium }}>
              <AppText style={{ color: sideColor }}>{isBuy ? "BUY" : "SELL"}</AppText>
              {` · ${orderType} · ${leverage}`}
            </AppText>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Price</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{decNum(order.price) > 0 ? Number(decNum(order.price)).toFixed(2) : "Market"}</AppText>
          </View>
          {triggerText && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Trigger</AppText>
              <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{triggerText}</AppText>
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Date</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{dateFormatted}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Time</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{timeFormatted}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Amount / Filled</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{totalQty > 0 ? totalQty : "0"} / {filledQty > 0 ? filledQty : "0"} {baseCoin}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Unfilled</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{unfilledQty > 0 ? unfilledQty : "0"} {baseCoin}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>TIF</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{tif}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Reduce Only</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{reduceOnly}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Status</AppText>
            <AppText type={FOURTEEN} style={{ color: getStatusColor(order.status || "OPEN", themeColors), fontFamily: fontFamilySemiBold }}>{String(order.status || "OPEN").toUpperCase()}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12, }}>
            {/* <View style={{ gap: 4 }}>
              <AppText type={TWELVE} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Reduce Only</AppText>
              <AppText type={TWELVE} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{reduceOnly}</AppText>
            </View> */}
            <TouchableOpacity
              onPress={() => { setOrderToCancel(order); setCancelModalVisible(true); }}
              style={{
                paddingHorizontal: 30,
                paddingVertical: 10,
                borderRadius: 4,
                backgroundColor: isDark ? "rgba(255,255,255,0.15)" : colors.black,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText type={TWELVE} style={{ color: colors.white, fontFamily: fontFamilySemiBold }}>Cancel</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFuturesTransactionHistoryItem = ({ item: tx, isLast }) => {
    const dir = String(tx.direction ?? "").toUpperCase();
    const isCredit = dir === "CREDIT";
    const isDebit = dir === "DEBIT";
    const n = Number(tx.amount);
    const amountVal = isDebit ? -Math.abs(n) : n;

    let amountColor = themeColors.text;
    if (isCredit) amountColor = colors.green;
    if (isDebit) amountColor = colors.red;

    const prefix = amountVal >= 0 ? "+" : "-";
    const absVal = Math.abs(amountVal).toFixed(4);

    // Support web properties: tx.transaction_type and tx.created_at
    const txType = tx.transaction_type || tx.type || "Transfer In";
    const createdTime = tx.created_at || tx.createdAt || tx.updatedAt;

    return (
      <View style={{
        paddingVertical: 16,
        paddingHorizontal: 0,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: themeColors.themeBorderColor || "#e0e0e0",
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
              {txType}
            </AppText>
            {/* <FastImage source={right_ic} style={{ width: 10, height: 10, marginLeft: 6 }} resizeMode="contain" tintColor={themeColors.secondaryText} /> */}
          </View>
        </View>

        <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginBottom: 12, fontFamily: fontFamilySemiBold }}>
          {createdTime ? moment(createdTime).format("YYYY-MM-DD HH:mm:ss") : "—"}
        </AppText>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Amount</AppText>
            <AppText type={FOURTEEN} style={{ color: amountColor, fontFamily: fontFamilySemiBold }}>
              {prefix}{absVal} {tx.asset || "USDT"}
            </AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Symbol</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
              {tx.symbol || "—"}
            </AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold, marginRight: 16 }}>Description</AppText>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold, textAlign: "right" }}>
                {tx.description || "—"}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderFuturesOrderHistoryItem = ({ item: order, isLast }) => {
    const isBuy = String(order.side ?? "").toUpperCase() === "BUY";
    const orderType = String(order.order_type ?? order.type ?? "").toUpperCase();
    const sideColor = isBuy ? colors.green : colors.red;
    const filledQty = decNum(order.filled_quantity ?? order.executed_quantity);
    const totalQty = decNum(order.quantity);
    const baseCoin = selectedCoin?.base_currency || "USDT";

    const createdTime = order.created_at || order.createdAt || order.updatedAt;
    const dateFormatted = createdTime ? moment(createdTime).format("YYYY-MM-DD") : "—";
    const timeFormatted = createdTime ? moment(createdTime).format("HH:mm:ss") : "—";

    const priceVal = decNum(order.order_price ?? order.price);
    const avgFillVal = decNum(order.average_execution_price ?? order.avg_price);

    const triggerVal = decNum(order?.trigger_price ?? order?.triggerPrice ?? order?.stop_price ?? order?.stopPrice);
    const limitVal = decNum(order?.price);

    const fmtPrice = (n) => Number.isFinite(n) ? Number(n).toFixed(2) : "—";

    const tpSlText = () => {
      const tp = decNum(order.take_profit);
      const sl = decNum(order.stop_loss);
      if (!Number.isFinite(tp) && !Number.isFinite(sl)) return null;
      const parts = [];
      if (Number.isFinite(tp)) parts.push(`TP ${fmtPrice(tp)}`);
      if (Number.isFinite(sl)) parts.push(`SL ${fmtPrice(sl)}`);
      return parts.join(" · ");
    };

    const getTriggerText = () => {
      const attached = tpSlText();
      if (attached) return attached;

      if ((orderType === "STOP_LIMIT" || orderType === "TAKE_PROFIT_LIMIT") && Number.isFinite(triggerVal)) {
        return `Trigger ${fmtPrice(triggerVal)}`;
      }
      if (orderType === "CONDITIONAL" && Number.isFinite(triggerVal)) {
        if (Number.isFinite(limitVal) && limitVal > 0) {
          return `Trigger ${fmtPrice(triggerVal)} · Limit ${fmtPrice(limitVal)}`;
        }
        return `Trigger ${fmtPrice(triggerVal)}`;
      }
      if ((orderType === "STOP_MARKET" || orderType === "TAKE_PROFIT_MARKET") && Number.isFinite(triggerVal)) {
        return orderType === "TAKE_PROFIT_MARKET" ? "TP trigger" : "SL trigger";
      }
      return null;
    };

    const triggerText = getTriggerText();

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("FutureHistoryCardDetailPage", { pos: order, selectedCoin, title: activeHistoryTab })}
        activeOpacity={0.7}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 0,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: themeColors.themeBorderColor || "#e0e0e0",
        }}
      >
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
              {order.symbol || "—"}
            </AppText>
            <FastImage
              source={right_ic}
              style={{ width: 10, height: 10, marginLeft: 6 }}
              tintColor={themeColors.secondaryText}
              resizeMode="contain"
            />
          </View>
          <AppText type={TWELVE} style={{ color: themeColors.text, fontFamily: fontFamilyMedium }}>
            <AppText type={TWELVE} style={{ color: sideColor, fontFamily: fontFamilySemiBold }}>
              {isBuy ? "BUY" : "SELL"}
            </AppText>
            {" · "}{orderType === "MARKET" ? "Market" : "Limit"}{" · "}{order.leverage || 1}x
          </AppText>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Price</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
              {orderType === "MARKET" ? "Market" : priceVal > 0 ? priceVal.toFixed(4) : "0.0000"}
            </AppText>
          </View>
          {triggerText && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Trigger</AppText>
              <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{triggerText}</AppText>
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Avg Fill</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
              {avgFillVal > 0 ? avgFillVal.toFixed(2) : "0.00"}
            </AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Date</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{dateFormatted}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Time</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{timeFormatted}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Qty / Filled</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{totalQty > 0 ? totalQty.toFixed(4) : "0.0000"} / {filledQty > 0 ? filledQty.toFixed(4) : "0.0000"} {baseCoin}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>TIF</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{order.time_in_force || "GTC"}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Reduce Only</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{order.reduce_only ? "Yes" : "No"}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Status</AppText>
            <AppText type={FOURTEEN} style={{ color: getStatusColor(order.status, themeColors), fontFamily: fontFamilySemiBold }}>
              {String(order.status || "—").toUpperCase()}
            </AppText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (activeHistoryTab === 'Positions') {
    if (loadingPositions && futuresPositions.length === 0) {
      return (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <AppText type={FOURTEEN} color={themeColors.secondaryText} style={{ fontFamily: fontFamilyMedium }}>Loading positions...</AppText>
        </View>
      );
    }
    if (futuresPositions.length === 0) {
      return <EmptyState />;
    }
    const data = limit ? futuresPositions.slice(0, limit) : futuresPositions;
    const hasMore = limit && futuresPositions.length > limit;
    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {data.map((pos, index) => (
          <React.Fragment key={pos._id || index}>
            {renderFuturesPositionItem({ item: pos, isLast: index === data.length - 1 && !hasMore })}
          </React.Fragment>
        ))}
        {hasMore && (
          <TouchableOpacity onPress={onViewMore} style={{ marginTop: 16, alignItems: 'center' }}>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, textDecorationLine: 'underline', fontFamily: fontFamilySemiBold }}>View More</AppText>
          </TouchableOpacity>
        )}
        <View style={{ height: 80 }} />

        <FuturesClosePositionModal
          visible={closeModalVisible}
          isDark={isDark}
          themeColors={themeColors}
          loading={closeLoading}
          pos={posToClose}
          onClose={() => setCloseModalVisible(false)}
          onConfirm={executeClosePosition}
        />
      </View>
    );
  }

  if (activeHistoryTab === 'Position History') {
    if (loadingPositionHistory && futuresPositionHistory.length === 0) {
      return (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <AppText type={FOURTEEN} color={themeColors.secondaryText} style={{ fontFamily: fontFamilyMedium }}>Loading history...</AppText>
        </View>
      );
    }
    if (futuresPositionHistory.length === 0) {
      return <EmptyState />;
    }
    const data = limit ? futuresPositionHistory.slice(0, limit) : futuresPositionHistory;
    const hasMore = limit && futuresPositionHistory.length > limit;
    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {data.map((pos, index) => (
          <React.Fragment key={pos._id || index}>
            {renderFuturesPositionHistoryItem({ item: pos, isLast: index === data.length - 1 && !hasMore })}
          </React.Fragment>
        ))}
        {hasMore && (
          <TouchableOpacity onPress={onViewMore} style={{ marginTop: 16, alignItems: 'center' }}>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, textDecorationLine: 'underline' }}>View More</AppText>
          </TouchableOpacity>
        )}
        <View style={{ height: 80 }} />
      </View>
    );
  }

  if (activeHistoryTab === 'Open Orders') {
    const filteredOrders = futuresOpenOrders.filter((o) => {
      if (orderSideFilter !== 'All Sides') {
        const orderSide = String(o.side ?? "").toUpperCase();
        if (orderSideFilter === 'Buy' && orderSide !== 'BUY') return false;
        if (orderSideFilter === 'Sell' && orderSide !== 'SELL') return false;
      }
      if (orderKindFilter !== 'all') {
        const orderType = String(o.order_type ?? o.type ?? "").toUpperCase();
        if (orderKindFilter === 'limit' && orderType !== 'LIMIT') return false;
        if (orderKindFilter === 'market' && orderType !== 'MARKET') return false;
      }
      return true;
    });

    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>

        {loadingOpenOrders && filteredOrders.length === 0 ? (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <AppText type={FOURTEEN} color={themeColors.secondaryText} style={{ fontFamily: fontFamilyMedium }}>Loading open orders...</AppText>
          </View>
        ) : filteredOrders.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {filteredOrders.slice(0, limit ? limit : filteredOrders.length).map((order, index) => (
              <React.Fragment key={order._id || index}>
                {renderFuturesOpenOrderItem({ item: order, isLast: index === filteredOrders.length - 1 && (!limit || filteredOrders.length <= limit) })}
              </React.Fragment>
            ))}
            {limit && filteredOrders.length > limit && (
              <TouchableOpacity onPress={onViewMore} style={{ marginTop: 16, alignItems: 'center' }}>
                <AppText type={FOURTEEN} style={{ color: themeColors.text, textDecorationLine: 'underline' }}>View More</AppText>
              </TouchableOpacity>
            )}
          </>
        )}
        <View style={{ height: 80 }} />

        <FuturesCancelModal
          visible={cancelModalVisible}
          isDark={isDark}
          themeColors={themeColors}
          loading={cancelLoading}
          onClose={() => setCancelModalVisible(false)}
          onConfirm={executeCancelOrder}
        />
      </View>
    );
  }

  if (activeHistoryTab === 'Order History') {
    const filteredOrders = futuresOrderHistory.filter((o) => {
      if (orderSideFilter !== 'All Sides') {
        const orderSide = String(o.side ?? "").toUpperCase();
        if (orderSideFilter === 'Buy' && orderSide !== 'BUY') return false;
        if (orderSideFilter === 'Sell' && orderSide !== 'SELL') return false;
      }
      if (orderKindFilter !== 'all') {
        const orderType = String(o.order_type ?? o.type ?? "").toUpperCase();
        if (orderKindFilter === 'limit' && orderType !== 'LIMIT') return false;
        if (orderKindFilter === 'market' && orderType !== 'MARKET') return false;
      }
      return true;
    });

    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>

        {loadingOrderHistory && filteredOrders.length === 0 ? (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <AppText type={FOURTEEN} color={themeColors.secondaryText} style={{ fontFamily: fontFamilyMedium }}>Loading order history...</AppText>
          </View>
        ) : filteredOrders.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {filteredOrders.slice(0, limit ? limit : filteredOrders.length).map((order, index) => (
              <React.Fragment key={order._id || index}>
                {renderFuturesOrderHistoryItem({ item: order, isLast: index === filteredOrders.length - 1 && (!limit || filteredOrders.length <= limit) })}
              </React.Fragment>
            ))}
            {limit && filteredOrders.length > limit && (
              <TouchableOpacity onPress={onViewMore} style={{ marginTop: 16, alignItems: 'center' }}>
                <AppText type={FOURTEEN} style={{ color: themeColors.text, textDecorationLine: 'underline' }}>View More</AppText>
              </TouchableOpacity>
            )}
          </>
        )}
        <View style={{ height: 80 }} />
      </View>
    );
  }

  if (activeHistoryTab === 'Transaction History') {
    let filteredTx = futuresTransactionHistory || [];

    if (walletHistoryFilters) {
      if (walletHistoryFilters.type) {
        filteredTx = filteredTx.filter(tx => {
          const type = tx.transaction_type || tx.type || "";
          return type.toUpperCase() === walletHistoryFilters.type.toUpperCase();
        });
      }
      if (walletHistoryFilters.asset) {
        filteredTx = filteredTx.filter(tx => {
          const asset = tx.asset || "";
          return asset.toUpperCase().includes(walletHistoryFilters.asset.toUpperCase());
        });
      }
      if (walletHistoryFilters.contract) {
        filteredTx = filteredTx.filter(tx => {
          const sym = tx.symbol || "";
          return sym.toUpperCase().includes(walletHistoryFilters.contract.toUpperCase());
        });
      }
      if (walletHistoryFilters.from && walletHistoryFilters.to) {
        const fromDateStr = walletHistoryFilters.from;
        const toDateStr = walletHistoryFilters.to;
        const fromUnix = moment(fromDateStr).startOf('day').unix();
        const toUnix = moment(toDateStr).endOf('day').unix();
        filteredTx = filteredTx.filter(tx => {
          const txTime = tx.created_at || tx.createdAt || tx.updatedAt;
          if (!txTime) return true;
          const timeUnix = moment(txTime).unix();
          return timeUnix >= fromUnix && timeUnix <= toUnix;
        });
      }
    }

    const data = limit ? filteredTx.slice(0, limit) : filteredTx;
    const hasMore = limit && filteredTx.length > limit;

    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setFilterSheetVisible(true)}>
            <FastImage source={filterIcon} style={{ width: 24, height: 24 }} tintColor={themeColors.text} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {loadingTransactionHistory && filteredTx.length === 0 ? (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <AppText type={FOURTEEN} color={themeColors.secondaryText} style={{ fontFamily: fontFamilyMedium }}>Loading transaction history...</AppText>
          </View>
        ) : filteredTx.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {data.map((tx, index) => (
              <React.Fragment key={tx._id || index}>
                {renderFuturesTransactionHistoryItem({ item: tx, isLast: index === data.length - 1 && !hasMore })}
              </React.Fragment>
            ))}
            {hasMore && (
              <TouchableOpacity onPress={onViewMore} style={{ marginTop: 16, alignItems: 'center' }}>
                <AppText type={FOURTEEN} style={{ color: themeColors.text, textDecorationLine: 'underline' }}>View More</AppText>
              </TouchableOpacity>
            )}
          </>
        )}

        <FuturesHistoryFilterSheet
          visible={filterSheetVisible}
          onClose={() => setFilterSheetVisible(false)}
          themeColors={themeColors}
          isDark={isDark}
          initialFilters={walletHistoryFilters}
          applyFilters={(filters) => setWalletHistoryFilters(filters)}
          selectedCoin={selectedCoin}
          futuresPositions={futuresPositions}
        />

        <View style={{ height: 80 }} />
      </View>
    );
  }

  return <EmptyState />;
};

export default FuturesHistorySection;
