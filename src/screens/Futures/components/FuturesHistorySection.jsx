import React from 'react';
import { View, TouchableOpacity, Platform, ToastAndroid, Alert } from 'react-native';
import FastImage from 'react-native-fast-image';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';

import { BOLD, fontFamilyMedium, fontFamilySemiBold, MEDIUM, SEMI_BOLD } from '../../../theme/typography';
import { colors } from '../../../theme/colors';
import { decNum, computePosition, computeClosedPosition } from '../../../helper/futuresUtils';
import { right_ic, NO_NOTIFICATION_ICON } from '../../../helper/ImageAssets';
import { AppText, FOURTEEN, TEN, THIRTEEN, TWELVE } from '../../../common';

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
  themeColors,
  isDark,
  futuresPrice,
  selectedCoin
}) => {
  const navigation = useNavigation();

  const EmptyState = () => (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
      <FastImage source={NO_NOTIFICATION_ICON} style={{ width: 80, height: 80, marginBottom: 12, opacity: 0.8 }} />
    </View>
  );

  const renderFuturesPositionItem = ({ item: pos, isLast }) => {
    const { qty, entry, mark, pnl, margin, roe, marginRatio } = computePosition(pos, futuresPrice?.mark_price, selectedCoin);

    const isLong = String(pos.side ?? "").toUpperCase() === "LONG";
    const sideColor = isLong ? colors.green : colors.red;
    const pnlColor = pnl >= 0 ? colors.green : colors.red;

    return (
      <View style={{
        paddingVertical: 12,
        paddingHorizontal: 0,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: themeColors.themeBorderColor || "#e0e0e0",
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <AppText type={FOURTEEN} weight={BOLD} style={{ color: themeColors.text }}>
              {pos.symbol || "—"}
            </AppText>
            <View style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              paddingHorizontal: 4,
              paddingVertical: 2,
              borderRadius: 4,
              marginLeft: 6
            }}>
              <AppText type={TEN} weight={SEMI_BOLD} style={{ color: sideColor }}>
                {isLong ? "LONG" : "SHORT"} {pos.leverage}X
              </AppText>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <AppText type={TWELVE} color={themeColors.secondaryText}>Unrealized PNL (USDT)</AppText>
            <AppText type={FOURTEEN} weight={BOLD} style={{ color: pnlColor }}>
              {pnl >= 0 ? "+" : ""}{Number(pnl).toFixed(4)}
            </AppText>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: pnlColor }}>
              {roe >= 0 ? "+" : ""}{Number(roe).toFixed(2)}%
            </AppText>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <AppText type={TWELVE} color={themeColors.secondaryText} style={{ marginBottom: 2 }}>Size</AppText>
            <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>{Number(qty).toFixed(4)}</AppText>
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <AppText type={TWELVE} color={themeColors.secondaryText} style={{ marginBottom: 2 }}>Entry Price</AppText>
            <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>{Number(entry).toFixed(4)}</AppText>
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <AppText type={TWELVE} color={themeColors.secondaryText} style={{ marginBottom: 2 }}>Mark Price</AppText>
            <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>{Number(mark).toFixed(4)}</AppText>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <AppText type={TWELVE} color={themeColors.secondaryText} style={{ marginBottom: 2 }}>Margin (USDT)</AppText>
            <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>{Number(margin).toFixed(4)}</AppText>
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <AppText type={TWELVE} color={themeColors.secondaryText} style={{ marginBottom: 2 }}>Margin Ratio</AppText>
            <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>{Number(marginRatio).toFixed(2)}%</AppText>
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <AppText type={TWELVE} color={themeColors.secondaryText} style={{ marginBottom: 2 }}>Liq. Price</AppText>
            <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: colors.orange || "#FF9800" }}>
              {pos.liquidation_price ? Number(pos.liquidation_price).toFixed(4) : "—"}
            </AppText>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <TouchableOpacity
            style={{
              paddingVertical: 6,
              paddingHorizontal: 16,
              backgroundColor: isDark ? "#333" : "#F0F0F0",
              borderRadius: 4
            }}
            onPress={() => {
              if (Platform.OS === 'android') {
                ToastAndroid.show('Close Position coming soon', ToastAndroid.SHORT);
              } else {
                Alert.alert('Coming soon');
              }
            }}
          >
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.text }}>Close Position</AppText>
          </TouchableOpacity>
        </View>
      </View>
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
              <AppText type={FOURTEEN} style={{ color: colors.green, fontFamily: fontFamilySemiBold }}>
                {reason || pos.status}
              </AppText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFuturesOpenOrderItem = ({ item: order, isLast }) => {
    const isBuy = String(order.side ?? "").toUpperCase() === "BUY";
    const sideColor = isBuy ? colors.green : colors.red;
    const filledQty = decNum(order.executed_quantity);
    const totalQty = decNum(order.quantity);
    const filledPercent = totalQty > 0 ? (filledQty / totalQty) * 100 : 0;
    
    const handleCancelOrder = async () => {
      try {
        Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
          { text: "No", style: "cancel" },
          {
            text: "Yes", onPress: async () => {
              // Assuming you have appOperation imported or passed as a prop for cancelling
              // Alternatively, this needs to be implemented. I will just alert for now or implement if you provide the cancel function.
              ToastAndroid.show("Cancel logic to be implemented", ToastAndroid.SHORT);
            }
          }
        ]);
      } catch (e) {
        console.warn("Cancel Error", e);
      }
    };

    return (
      <View style={{
        paddingVertical: 12,
        paddingHorizontal: 0,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: themeColors.themeBorderColor || "#e0e0e0",
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
              {order.symbol || "—"}
            </AppText>
            <AppText type={TWELVE} style={{ color: sideColor, marginLeft: 8, fontFamily: fontFamilySemiBold }}>
              {isBuy ? "BUY" : "SELL"}
            </AppText>
          </View>
          <TouchableOpacity onPress={handleCancelOrder} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", borderRadius: 4 }}>
            <AppText type={TWELVE} style={{ color: themeColors.text, fontFamily: fontFamilyMedium }}>Cancel</AppText>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Price</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{decNum(order.price) > 0 ? decNum(order.price).toFixed(4) : "Market"}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Amount</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{totalQty > 0 ? totalQty.toFixed(4) : "0.0000"} {selectedCoin?.base_currency || "USDT"}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Filled</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>{filledQty > 0 ? filledQty.toFixed(4) : "0.0000"} ({filledPercent.toFixed(2)}%)</AppText>
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
            <AppText type={FOURTEEN} style={{ color: order.status === "FILLED" ? colors.green : themeColors.text, fontFamily: fontFamilySemiBold }}>
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
          <AppText type={FOURTEEN} color={themeColors.secondaryText}>Loading positions...</AppText>
        </View>
      );
    }
    if (futuresPositions.length === 0) {
      return <EmptyState />;
    }
    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {futuresPositions.map((pos, index) => (
          <React.Fragment key={pos._id || index}>
            {renderFuturesPositionItem({ item: pos, isLast: index === futuresPositions.length - 1 })}
          </React.Fragment>
        ))}
        <View style={{ height: 80 }} />
      </View>
    );
  }

  if (activeHistoryTab === 'Position History') {
    if (loadingPositionHistory && futuresPositionHistory.length === 0) {
      return (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <AppText type={FOURTEEN} color={themeColors.secondaryText}>Loading history...</AppText>
        </View>
      );
    }
    if (futuresPositionHistory.length === 0) {
      return <EmptyState />;
    }
    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {futuresPositionHistory.map((pos, index) => (
          <React.Fragment key={pos._id || index}>
            {renderFuturesPositionHistoryItem({ item: pos, isLast: index === futuresPositionHistory.length - 1 })}
          </React.Fragment>
        ))}
        <View style={{ height: 80 }} />
      </View>
    );
  }

  if (activeHistoryTab === 'Open Orders') {
    if (loadingOpenOrders && futuresOpenOrders.length === 0) {
      return (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <AppText type={FOURTEEN} color={themeColors.secondaryText}>Loading open orders...</AppText>
        </View>
      );
    }
    if (futuresOpenOrders.length === 0) {
      return <EmptyState />;
    }
    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {futuresOpenOrders.map((order, index) => (
          <React.Fragment key={order._id || index}>
            {renderFuturesOpenOrderItem({ item: order, isLast: index === futuresOpenOrders.length - 1 })}
          </React.Fragment>
        ))}
        <View style={{ height: 80 }} />
      </View>
    );
  }

  if (activeHistoryTab === 'Order History') {
    if (loadingOrderHistory && futuresOrderHistory.length === 0) {
      return (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <AppText type={FOURTEEN} color={themeColors.secondaryText}>Loading order history...</AppText>
        </View>
      );
    }
    if (futuresOrderHistory.length === 0) {
      return <EmptyState />;
    }
    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {futuresOrderHistory.map((order, index) => (
          <React.Fragment key={order._id || index}>
            {renderFuturesOrderHistoryItem({ item: order, isLast: index === futuresOrderHistory.length - 1 })}
          </React.Fragment>
        ))}
        <View style={{ height: 80 }} />
      </View>
    );
  }

  return <EmptyState />;
};

export default FuturesHistorySection;
