import { AppSafeAreaView } from '../../shared';
import React from 'react';
import { View, ScrollView, TouchableOpacity, Platform, Alert, ToastAndroid } from 'react-native';
import FastImage from 'react-native-fast-image';
import moment from 'moment';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useTheme } from '../../hooks/useTheme';
import { AppText, FOURTEEN, THIRTEEN, TWELVE, SIXTEEN } from '../../common';
import { BOLD, MEDIUM, SEMI_BOLD, fontFamilyMedium, fontFamilySemiBold } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { decNum, computeClosedPosition } from '../../helper/futuresUtils';
import { back_ic } from '../../helper/ImageAssets';
import { appOperation } from '../../appOperation';
import FuturesCancelModal from './components/FuturesCancelModal';

const FutureHistoryCardDetailPage = () => {
  const { colors: themeColors, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { pos, selectedCoin, title } = route.params || {};

  if (!pos) {
    return (
      <View style={{ flex: 1, backgroundColor: themeColors.background, alignItems: 'center', justifyContent: 'center' }}>
        <AppText type={FOURTEEN} style={{ color: themeColors.text }}>No Data Available</AppText>
      </View>
    );
  }

  const { entry, exit, qty, pnl, fees, funding, reason } = computeClosedPosition(pos);
  const isLong = String(pos.side ?? "").toUpperCase() === "LONG";
  const pnlColor = pnl >= 0 ? colors.green : colors.red;
  const fundingColor = funding >= 0 ? colors.green : colors.red;

  const getStatusColor = (statusText) => {
    if (!statusText) return themeColors.text;
    const normalized = statusText.toString().toLowerCase();
    if (normalized.includes("filled") || normalized.includes("success") || normalized.includes("completed")) {
      return colors.green;
    }
    if (normalized.includes("cancel") || normalized.includes("reject") || normalized.includes("fail")) {
      return colors.red;
    }
    if (normalized.includes("pending")) {
      return colors.orange || "#FFA500";
    }
    return themeColors.text;
  };

  const closedTime = pos.closed_at || pos.updatedAt || pos.createdAt;
  const openedTime = pos.opened_at || pos.createdAt;

  const closedDateFormatted = closedTime ? moment(closedTime).format("YYYY-MM-DD HH:mm:ss") : "—";
  const openedDateFormatted = openedTime ? moment(openedTime).format("YYYY-MM-DD HH:mm:ss") : "—";

  const renderDetailRow = (label, value, valueColor = themeColors.text, valueFont = fontFamilyMedium) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
      <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>{label}</AppText>
      <AppText type={FOURTEEN} style={{ color: valueColor, fontFamily: valueFont }}>{value}</AppText>
    </View>
  );

  const [cancelModalVisible, setCancelModalVisible] = React.useState(false);
  const [cancelLoading, setCancelLoading] = React.useState(false);

  const handleCancelOrder = () => {
    setCancelModalVisible(true);
  };

  const executeCancelOrder = async () => {
    setCancelLoading(true);
    try {
      const result = await appOperation.customer?.cancelFutureOrder({ orderId: pos._id || pos.id });
      if (result?.success) {
        ToastAndroid.show(result?.message || 'Order Cancelled', ToastAndroid.SHORT);
        setCancelModalVisible(false);
        navigation.goBack();
      } else {
        ToastAndroid.show(result?.message || 'Failed to cancel', ToastAndroid.SHORT);
      }
    } catch (e) {
      console.warn("Cancel error", e);
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: Platform.OS === 'ios' ? 10 : 16,
        borderBottomWidth: 1,
        borderBottomColor: themeColors.themeBorderColor || "#e0e0e0",
        justifyContent: 'space-between'
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ padding: 4 }}
        >
          <FastImage
            source={back_ic}
            style={{ width: 20, height: 20 }}
            tintColor={themeColors.text}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <AppText type={SIXTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold, marginRight: 20 }}>
          {title} Detail
        </AppText>
        <View></View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }}>
        {/* Header block with Symbol */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <AppText type={SIXTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
              {pos.symbol || "—"}
            </AppText>
          </View>
          {title === 'Order History' || title === 'Open Orders' ? (
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilyMedium }}>
              <AppText type={FOURTEEN} style={{ color: String(pos.side ?? "").toUpperCase() === "BUY" ? colors.green : colors.red, fontFamily: fontFamilySemiBold }}>
                {String(pos.side ?? "").toUpperCase() === "BUY" ? "BUY" : "SELL"}
              </AppText>
              {" · "}{String(pos.order_type ?? pos.type ?? "").toUpperCase() === "MARKET" ? "Market" : "Limit"}{" · "}{pos.leverage || 1}x
            </AppText>
          ) : (
            <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilyMedium }}>
              {isLong ? "LONG" : "SHORT"} · {pos.leverage}x · {String(pos.margin_type ?? "ISOLATED").toUpperCase()}
            </AppText>
          )}
        </View>

        <View style={{ gap: 4 }}>
          {title === 'Order History' || title === 'Open Orders' ? (
            <>
              {renderDetailRow("Price", String(pos.order_type ?? pos.type ?? "").toUpperCase() === "MARKET" ? "Market" : (decNum(pos.order_price ?? pos.price) > 0 ? decNum(pos.order_price ?? pos.price).toFixed(4) : "—"))}
              {renderDetailRow("Avg Fill", decNum(pos.average_execution_price ?? pos.avg_price) > 0 ? decNum(pos.average_execution_price ?? pos.avg_price).toFixed(2) : "—")}
              {renderDetailRow("Date", moment(pos.created_at || pos.createdAt).format("YYYY-MM-DD"))}
              {renderDetailRow("Time", moment(pos.created_at || pos.createdAt).format("HH:mm:ss"))}
              {renderDetailRow("Qty / Filled", `${decNum(pos.quantity).toFixed(4)} / ${decNum(pos.filled_quantity ?? pos.executed_quantity ?? pos.filledQty ?? 0).toFixed(4)} ${selectedCoin?.base_currency || "USDT"}`)}
              {renderDetailRow("TIF", pos.time_in_force || pos.timeInForce || "GTC")}
              {renderDetailRow("Reduce Only", pos.reduce_only || pos.reduceOnly ? "Yes" : "No")}
              {title === 'Order History' && renderDetailRow("Fee", `${decNum(pos.total_fees_paid ?? 0).toFixed(9)} USDT`)}
              {renderDetailRow("Status", String(pos.status || "OPEN").toUpperCase(), getStatusColor(pos.status || "OPEN"))}
              {title === 'Open Orders' && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, alignItems: 'center' }}>
                  <AppText type={FOURTEEN} style={{ color: isDark ? "#8E8E93" : "#666666", fontFamily: fontFamilySemiBold }}>Action</AppText>
                  <TouchableOpacity onPress={handleCancelOrder} style={{ paddingHorizontal: 16, paddingVertical: 6, backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "#333333", borderRadius: 16 }}>
                    <AppText type={FOURTEEN} style={{ color: isDark ? colors.white : colors.white, fontFamily: fontFamilyMedium }}>Cancel</AppText>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              {renderDetailRow("Closed Time", closedDateFormatted)}
              {renderDetailRow("Opened Time", openedDateFormatted)}
              {renderDetailRow("Size", `${Number(qty).toFixed(4)} ${selectedCoin?.base_currency || "USDT"}`)}
              {renderDetailRow("Entry Price", Number(entry) > 0 ? Number(entry).toFixed(4) : "—")}
              {renderDetailRow("Exit Price", Number(exit) > 0 ? Number(exit).toFixed(4) : "—")}
              {renderDetailRow("Realized PNL", `${pnl >= 0 ? "+" : ""}${Number(pnl).toFixed(4)} USDT`, pnlColor)}
              {renderDetailRow("Funding", `${funding >= 0 ? "+" : ""}${Number(funding || 0).toFixed(4)} USDT`, fundingColor)}
              {renderDetailRow("Fee", `${Number(fees || 0).toFixed(4)} USDT`)}
              {pos.close_reason || pos.status ? renderDetailRow("Status", reason || pos.status, getStatusColor(reason || pos.status)) : null}
            </>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <FuturesCancelModal
        visible={cancelModalVisible}
        isDark={isDark}
        themeColors={themeColors}
        loading={cancelLoading}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={executeCancelOrder}
      />
    </AppSafeAreaView>
  );
};

export default FutureHistoryCardDetailPage;
